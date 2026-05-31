import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import TransactionItem from '@/components/acshow/TransactionItem';
import QuickRecordModal from '@/pages/acshow/QuickRecordModal';
import Spinner from '@/components/ui/Spinner';
import { Search, Filter, X, Plus, TrendingUp, TrendingDown, Wallet, ShoppingBag } from 'lucide-react';
import EmptyState from '@/components/acshow/EmptyState';

// ─────────────────────────────────────────────────────────────
// CONSTANTS  — aligned with the new backend API
// ─────────────────────────────────────────────────────────────

// Each chip maps to zero or more query params sent to the API.
// 'overdue=1', 'receivables_only=1', 'payables_only=1' are custom flags
// understood by TransactionViewSet.get_queryset().
const FILTER_CHIPS = [
  { key: 'all',        label: 'All',         params: {} },
  { key: 'income',     label: 'Income',      params: { type: 'income' } },
  { key: 'sale',       label: 'Sale',        params: { type: 'sale' } },
  { key: 'expense',    label: 'Expense',     params: { type: 'expense' } },
  { key: 'purchase',   label: 'Purchase',    params: { type: 'purchase' } },
  { key: 'receivable', label: 'Receivables', params: { receivables_only: '1' } },
  { key: 'payable',    label: 'Payables',    params: { payables_only: '1' } },
  { key: 'overdue',    label: 'Overdue',     params: { overdue: '1' } },
];

const TYPE_OPTIONS = [
  { value: '',           label: 'All Types' },
  { value: 'income',     label: 'Income' },
  { value: 'sale',       label: 'Sale' },
  { value: 'expense',    label: 'Expense' },
  { value: 'purchase',   label: 'Purchase' },
  { value: 'receivable', label: 'Receivable' },
  { value: 'payable',    label: 'Payable' },
];

// Status values that actually exist in the new STATUS_CHOICES
const STATUS_OPTIONS = [
  { value: '',             label: 'All Status' },
  { value: 'approved',     label: 'Approved' },
  { value: 'pending',      label: 'Pending Approval' },
  { value: 'pending_edit', label: 'Edit Pending' },
  { value: 'rejected',     label: 'Rejected' },
];

const CHIP_COLORS = {
  overdue:    'bg-red-600 text-white',
  receivable: 'bg-amber-500 text-white',
  payable:    'bg-blue-600 text-white',
  sale:       'bg-blue-500 text-white',
  purchase:   'bg-purple-600 text-white',
  default:    'bg-emerald-600 text-white',
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const TransactionsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [summary, setSummary]           = useState(null);
  const [showFilters, setShowFilters]   = useState(false);
  const [showQuickRecord, setShowQuickRecord] = useState(false);
  const [activeChip, setActiveChip]     = useState('all');

  const [filters, setFilters] = useState({
    type:       searchParams.get('type')       || '',
    status:     searchParams.get('status')     || '',
    start_date: searchParams.get('start_date') || '',
    end_date:   searchParams.get('end_date')   || '',
    search:     searchParams.get('search')     || '',
    // Special flags
    receivables_only: searchParams.get('receivables_only') || '',
    payables_only:    searchParams.get('payables_only')    || '',
    overdue:          searchParams.get('overdue')          || '',
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Strip empty params before sending
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );

      const [transRes, summaryRes] = await Promise.all([
        acshowAPI.getTransactions(params),
        acshowAPI.getTransactionSummary(),
      ]);

      // baseApi returns JSON directly (not axios { data })
      const transData   = transRes.results   || transRes;
      const summaryData = summaryRes;

      setTransactions(Array.isArray(transData) ? transData : []);
      setSummary(summaryData);
      setSearchParams(params);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, setSearchParams]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleChipClick = (chip) => {
    setActiveChip(chip.key);
    setFilters({
      type:             '',
      status:           '',
      start_date:       '',
      end_date:         '',
      search:           filters.search, // keep live search
      receivables_only: '',
      payables_only:    '',
      overdue:          '',
      ...chip.params,
    });
  };

  const handleFilterChange = (key, value) => {
    setActiveChip('custom');
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveChip('all');
    setFilters({ type: '', status: '', start_date: '', end_date: '', search: '',
                 receivables_only: '', payables_only: '', overdue: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* HEADER */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <button onClick={() => navigate('/acshow')}
              className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
              Dashboard
            </button>
            <h1 className="text-lg font-bold text-gray-800">Transactions</h1>
          </div>
          <button
            onClick={() => setShowQuickRecord(true)}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold
              hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">

        {/* SUMMARY CARDS — reads new API shape (top-level fields) */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <SummaryCard
              icon={<TrendingUp size={16} />}
              label="Income + Sales"
              amount={(summary.income || 0) + (summary.collected || 0)}
              color="emerald"
            />
            <SummaryCard
              icon={<ShoppingBag size={16} />}
              label="Purchases"
              amount={summary.purchases || 0}
              color="purple"
            />
            <SummaryCard
              icon={<TrendingDown size={16} />}
              label="Expenses"
              amount={summary.expenses || 0}
              color="rose"
            />
            <SummaryCard
              icon={<Wallet size={16} />}
              label="Net Profit"
              amount={summary.net_profit || 0}
              color="blue"
            />
          </div>
        )}

        {/* SEARCH */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm
              focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
          />
          {filters.search && (
            <button onClick={() => handleFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* FILTER CHIPS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all
              ${activeChip === 'custom' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            <Filter size={14} /> Filters
          </button>

          {FILTER_CHIPS.map((chip) => {
            const isActive = activeChip === chip.key;
            const activeColor = CHIP_COLORS[chip.key] || CHIP_COLORS.default;
            return (
              <button
                key={chip.key}
                onClick={() => handleChipClick(chip)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? activeColor
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {chip.label}
              </button>
            );
          })}

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* EXTENDED FILTERS */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Type</label>
                <select value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50">
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Status</label>
                <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">From</label>
                <input type="date" value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">To</label>
                <input type="date" value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTION LIST */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center"><Spinner /></div>
          ) : transactions.length > 0 ? (
            <>
              <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-500">
                  {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </span>
              </div>
              {transactions.map((t) => (
                <TransactionItem
                  key={t.id}
                  transaction={t}
                  onClick={(id) => navigate(`/acshow/transactions/${id}`)}
                />
              ))}
            </>
          ) : (
            <EmptyState
              icon={hasActiveFilters ? '🔍' : '📝'}
              title={hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
              message={hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Start recording your daily transactions'}
              actionLabel={hasActiveFilters ? '' : 'Record First Transaction'}
              onAction={hasActiveFilters ? null : () => setShowQuickRecord(true)}
            />
          )}
        </div>
      </div>

      {showQuickRecord && (
        <QuickRecordModal
          onClose={() => setShowQuickRecord(false)}
          onSuccess={() => { setShowQuickRecord(false); fetchTransactions(); }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────────────────────

const SummaryCard = ({ icon, label, amount, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    rose:    'bg-rose-50    text-rose-700    border-rose-100',
    blue:    'bg-blue-50    text-blue-700    border-blue-100',
    purple:  'bg-purple-50  text-purple-700  border-purple-100',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-3 border`}>
      <div className="flex items-center gap-1.5 mb-1 opacity-70">
        {icon}
        <span className="text-[11px] font-semibold">{label}</span>
      </div>
      <div className="text-lg font-bold">
        &#2547;{parseFloat(amount).toLocaleString('en-IN')}
      </div>
    </div>
  );
};

export default TransactionsPage;
