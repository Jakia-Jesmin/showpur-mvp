import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import { useAuth } from '@/hooks/useAuth';
import Spinner from '@/components/ui/Spinner';
import { Edit2 } from 'lucide-react';

const fmt = (n) => parseFloat(n || 0).toLocaleString('en-IN');

// ─────────────────────────────────────────────────────────────
// TYPE STYLES  — includes all 6 transaction types
// ─────────────────────────────────────────────────────────────

const TYPE_STYLE = {
  income:     { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '💰', sign: '+' },
  sale:       { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: '🛒', sign: '+' },
  receivable: { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: '📥', sign: '+' },
  expense:    { bg: 'bg-red-50',     text: 'text-red-700',     icon: '💸', sign: '-' },
  purchase:   { bg: 'bg-purple-50',  text: 'text-purple-700',  icon: '📦', sign: '-' },
  payable:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: '📤', sign: '-' },
};

const STATUS_STYLE = {
  approved:     'bg-green-100  text-green-700',
  pending:      'bg-yellow-100 text-yellow-700',
  pending_edit: 'bg-purple-100 text-purple-700',
  rejected:     'bg-red-100    text-red-700',
};

const STATUS_ICON = {
  approved: '✅', pending: '⏳', pending_edit: '✏️', rejected: '❌',
};

const TransactionDetailPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [transaction,      setTransaction]      = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [actionLoading,    setActionLoading]    = useState(false);
  const [showPayment,      setShowPayment]      = useState(false);
  const [paymentAmount,    setPaymentAmount]    = useState('');
  const [showReject,       setShowReject]       = useState(false);
  const [rejectionReason,  setRejectionReason]  = useState('');
  const [actionError,      setActionError]      = useState('');
  const [showEdit,         setShowEdit]         = useState(false);
  const [editData,         setEditData]         = useState({});

  const fetchTransaction = async () => {
    try {
      // baseApi.get() returns the parsed JSON directly — NOT wrapped in { data }
      const res = await acshowAPI.getTransaction(id);
      setTransaction(res);
    } catch (err) {
      console.error('Failed to fetch transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransaction(); }, [id]);

  const withAction = async (fn) => {
    setActionLoading(true);
    setActionError('');
    try {
      await fn();
      await fetchTransaction();
    } catch (err) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove      = () => withAction(() => acshowAPI.approveTransaction(id));
  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) return;
    withAction(async () => {
      await acshowAPI.rejectTransaction(id, rejectionReason);
      setShowReject(false);
      setRejectionReason('');
    });
  };
  const handlePaymentUpdate = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) return;
    withAction(async () => {
      await acshowAPI.updateTransactionStatus(id, 'update_payment', amount);
      setShowPayment(false);
      setPaymentAmount('');
    });
  };
  const handleMarkComplete = () => withAction(() => acshowAPI.updateTransactionStatus(id, 'complete'));

  const openEdit = () => {
    const tx = transaction;
    setEditData({
      description:       tx.description || '',
      notes:             tx.notes || '',
      amount:            tx.amount || '',
      cash_hand_amount:  tx.cash_hand_amount || '',
      cash_bank_amount:  tx.cash_bank_amount || '',
      due_date:          tx.due_date || '',
      transaction_date:  tx.transaction_date || '',
    });
    setShowEdit(true);
  };

  const handleEditSubmit = () => {
    if (!editData.description?.trim()) { setActionError('Description is required.'); return; }
    withAction(async () => {
      await acshowAPI.submitEdit(id, editData);
      setShowEdit(false);
    });
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!transaction) return (
    <div className="text-center py-12">
      <p className="text-gray-500">Transaction not found</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 text-sm">Go back</button>
    </div>
  );

  const t     = transaction;
  const style = TYPE_STYLE[t.transaction_type] || TYPE_STYLE.income;

  // Maker-checker access
  const userRole        = user?.staff_role || 'both';
  const isChecker       = ['checker', 'both', 'admin'].includes(userRole);
  const isMaker         = ['maker',   'both', 'admin'].includes(userRole);
  const isOwnTransaction = String(t.created_by) === String(user?.id);
  const canApprove      = isChecker && !isOwnTransaction && ['pending', 'pending_edit'].includes(t.status);
  const canEdit         = isMaker && t.status === 'approved';
  const hasOutstanding  = parseFloat(t.remaining_amount || 0) > 0;
  const isIncomeType    = ['income', 'sale', 'receivable'].includes(t.transaction_type);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">Back</button>
          <h1 className="text-lg font-semibold text-gray-800">Transaction Details</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* Amount Hero */}
        <div className={`${style.bg} rounded-2xl p-6 text-center`}>
          <div className="text-4xl mb-2">{style.icon}</div>
          <div className={`text-3xl font-bold ${style.text} mb-1`}>
            {style.sign}&#2547;{fmt(t.amount)}
          </div>
          <div className={`${style.text} font-medium`}>{t.transaction_type_display}</div>
          {hasOutstanding && (
            <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
              &#2547;{fmt(t.remaining_amount)} outstanding
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex justify-center">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium ${STATUS_STYLE[t.status] || 'bg-gray-100 text-gray-600'}`}>
            {STATUS_ICON[t.status] || '📋'} {t.status_display || t.status}
          </span>
        </div>

        {/* Maker-checker trail */}
        {t.approved_by && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-center text-green-700">
            Approved by {t.approved_by_name || 'Checker'}
          </div>
        )}
        {t.rejected_by && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-center text-red-700">
            Rejected by {t.rejected_by_name || 'Checker'}
            {t.rejection_reason && <p className="mt-1 text-xs">Reason: {t.rejection_reason}</p>}
          </div>
        )}
        {t.edited_by && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm text-center text-purple-700">
            Edit submitted by {t.edited_by_name || 'Maker'} — awaiting approval
          </div>
        )}

        {/* Core details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-0">
          <DetailRow label="Description"   value={t.description} />
          <DetailRow label="Category"      value={t.category_display || '—'} />
          <DetailRow label="Party"         value={t.party_name || '—'} />
          <DetailRow label="Date"          value={new Date(t.transaction_date).toLocaleDateString('en-BD')} />
          {t.due_date && (
            <DetailRow
              label="Due Date"
              value={new Date(t.due_date).toLocaleDateString('en-BD')}
              highlight={t.is_overdue}
            />
          )}
          {t.product && <DetailRow label="Product" value={`${t.product_name || t.product} × ${t.quantity}`} />}
          {t.notes && <DetailRow label="Notes" value={t.notes} />}
        </div>

        {/* Payment split breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Payment Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="font-semibold">&#2547;{fmt(t.amount)}</span>
            </div>
            {parseFloat(t.cash_hand_amount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash in Hand</span>
                <span className="text-emerald-600 font-medium">&#2547;{fmt(t.cash_hand_amount)}</span>
              </div>
            )}
            {parseFloat(t.cash_bank_amount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash at Bank</span>
                <span className="text-blue-600 font-medium">&#2547;{fmt(t.cash_bank_amount)}</span>
              </div>
            )}
            {parseFloat(t.credit_amount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isIncomeType ? 'On Credit (AR)' : 'On Credit (AP)'}</span>
                <span className="text-amber-600 font-medium">&#2547;{fmt(t.credit_amount)}</span>
              </div>
            )}
            {hasOutstanding && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-500 font-medium">Still Outstanding</span>
                <span className="text-red-600 font-bold">&#2547;{fmt(t.remaining_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs pt-1">
              <span className="text-gray-400">Method</span>
              <span className="text-gray-500 capitalize">{(t.payment_method || '').replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-800">Actions</h3>

          {/* Collect / Pay outstanding balance */}
          {hasOutstanding && t.status === 'approved' && (
            <div className="space-y-2">
              <button onClick={handleMarkComplete} disabled={actionLoading}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
                Mark as Fully {isIncomeType ? 'Collected' : 'Paid'}
              </button>

              {!showPayment ? (
                <button onClick={() => setShowPayment(true)}
                  className="w-full border-2 border-emerald-500 text-emerald-700 py-3 rounded-xl font-medium hover:bg-emerald-50 active:scale-95 transition-all">
                  Record Partial Payment
                </button>
              ) : (
                <div className="p-3 bg-emerald-50 rounded-xl space-y-2">
                  <label className="block text-sm font-medium text-emerald-800">
                    Amount {isIncomeType ? 'Received' : 'Paid'} (max &#2547;{fmt(t.remaining_amount)})
                  </label>
                  <input
                    type="number" value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00" max={t.remaining_amount}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl text-sm" autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handlePaymentUpdate} disabled={!paymentAmount || actionLoading}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                      Save
                    </button>
                    <button onClick={() => { setShowPayment(false); setPaymentAmount(''); }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checker: Approve / Reject */}
          {canApprove && (
            <div className="space-y-2">
              <button onClick={handleApprove} disabled={actionLoading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 active:scale-95 transition-all disabled:opacity-50">
                Approve Transaction
              </button>
              {!showReject ? (
                <button onClick={() => setShowReject(true)}
                  className="w-full border-2 border-red-500 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50 active:scale-95 transition-all">
                  Reject Transaction
                </button>
              ) : (
                <div className="p-3 bg-red-50 rounded-xl space-y-2">
                  <label className="block text-sm font-medium text-red-700">Rejection Reason</label>
                  <input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this being rejected?"
                    className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm" autoFocus />
                  <div className="flex gap-2">
                    <button onClick={handleRejectSubmit} disabled={!rejectionReason.trim() || actionLoading}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                      Confirm Reject
                    </button>
                    <button onClick={() => setShowReject(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Maker: Edit approved transaction */}
          {canEdit && !showEdit && (
            <button onClick={openEdit}
              className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2">
              <Edit2 size={15} /> Edit Transaction
            </button>
          )}

          {canEdit && showEdit && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Edit Transaction</h4>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description *</label>
                <input type="text" value={editData.description}
                  onChange={e => setEditData(d => ({ ...d, description: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cash in Hand (৳)</label>
                  <input type="number" value={editData.cash_hand_amount}
                    onChange={e => setEditData(d => ({ ...d, cash_hand_amount: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cash at Bank (৳)</label>
                  <input type="number" value={editData.cash_bank_amount}
                    onChange={e => setEditData(d => ({ ...d, cash_bank_amount: e.target.value }))}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Due Date</label>
                <input type="date" value={editData.due_date}
                  onChange={e => setEditData(d => ({ ...d, due_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <textarea value={editData.notes} rows={2}
                  onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={handleEditSubmit} disabled={actionLoading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                  Submit for Approval
                </button>
                <button onClick={() => setShowEdit(false)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Nothing to act on */}
          {!canApprove && !hasOutstanding && !canEdit && (
            <p className="text-sm text-gray-400 text-center py-2">No actions available</p>
          )}

          {actionError && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{actionError}</div>
          )}
        </div>

        {/* Metadata */}
        <div className="text-center text-xs text-gray-400 space-y-1">
          <p>Created by {t.created_by_name || 'Unknown'}</p>
          <p>Created {new Date(t.created_at).toLocaleString('en-BD')}</p>
          {t.updated_at !== t.created_at && (
            <p>Updated {new Date(t.updated_at).toLocaleString('en-BD')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-sm font-medium text-right ml-4 ${highlight ? 'text-red-600' : 'text-gray-800'}`}>
      {value}
    </span>
  </div>
);

export default TransactionDetailPage;
