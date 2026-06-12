import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { acshowAPI } from '@/api/acshow';
import { ArrowLeft } from 'lucide-react';

const GROUPS = [
  { key: 'income',     label: 'Money In',        labelBn: 'আয়',        color: 'emerald', desc: 'Revenue from sales and services' },
  { key: 'expense',    label: 'Money Out',       labelBn: 'খরচ',       color: 'red',     desc: 'Costs and operating expenses' },
  { key: 'cash_bank',  label: 'My Cash & Bank',  labelBn: 'নগদ/ব্যাংক', color: 'blue',    desc: 'Where your money physically lives' },
  { key: 'receivable', label: 'Will Collect',    labelBn: 'পাবো',      color: 'orange',  desc: 'Credit sales not yet collected' },
  { key: 'payable',    label: 'Will Pay',        labelBn: 'দেবো',      color: 'purple',  desc: 'Credit purchases not yet paid' },
  { key: 'capital',    label: "Owner's Capital", labelBn: 'মালিকের সম্পদ', color: 'pink',    desc: 'Owner withdrawals and capital' },
];

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700', dot: 'bg-emerald-500' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700',         btn: 'bg-red-600 hover:bg-red-700',         dot: 'bg-red-500' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    badge: 'bg-blue-100 text-blue-700',       btn: 'bg-blue-600 hover:bg-blue-700',       dot: 'bg-blue-500' },
  orange:  { bg: 'bg-orange-50',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700',   btn: 'bg-orange-500 hover:bg-orange-600',   dot: 'bg-orange-500' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200',  badge: 'bg-purple-100 text-purple-700',   btn: 'bg-purple-600 hover:bg-purple-700',   dot: 'bg-purple-500' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200',    badge: 'bg-pink-100 text-pink-700',       btn: 'bg-pink-600 hover:bg-pink-700',       dot: 'bg-pink-500' },
};

const EMPTY_FORM = { name: '', name_bn: '', icon: '', account_code: '', account_type: 'income', order: 0 };

export default function ChartOfAccountsPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await acshowAPI.getAccounts();
      setAccounts(data.results ?? data);
    } catch {
      setError('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd(group) {
    setForm({ ...EMPTY_FORM, account_type: group.key });
    setModal({ mode: 'add', group });
    setError('');
  }

  function openEdit(account, group) {
    if (account.is_default) {
      setError('System accounts cannot be edited.');
      return;
    }
    setForm({
      name: account.name,
      name_bn: account.name_bn || '',
      icon: account.icon || '',
      account_code: account.account_code || '',
      account_type: account.account_type,
      order: account.order,
    });
    setModal({ mode: 'edit', group, account });
    setError('');
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      if (modal.mode === 'add') {
        await acshowAPI.createAccount(form);
      } else {
        await acshowAPI.updateAccount(modal.account.id, form);
      }
      setModal(null);
      await load();
    } catch (e) {
      const msg = e.response?.data?.name?.[0] || e.response?.data?.detail || 'Failed to save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await acshowAPI.deleteAccount(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setDeleteTarget(null);
    }
  }

  const byGroup = (key) => accounts.filter(a => a.account_type === key);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => navigate('/acshow/settings')}
            className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1 font-medium"
          >
            <ArrowLeft size={14} /> Back to Settings
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-800">Chart of Accounts</h1>
            <p className="text-xs text-gray-400 mt-0.5">হিসাবের তালিকা — Organize your income and expenses</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {error && !modal && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="hover:bg-red-100 p-1 rounded">×</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                  </div>
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-gray-50">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="px-4 py-3 flex items-center gap-3">
                      <div className="h-8 w-8 bg-gray-100 rounded animate-pulse" />
                      <div className="flex-1">
                        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-24 bg-gray-50 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          GROUPS.map(group => {
            const c = COLOR_MAP[group.color];
            const items = byGroup(group.key);
            return (
              <div key={group.key} className={`bg-white rounded-2xl border ${c.border} shadow-sm overflow-hidden`}>
                {/* Group header */}
                <div className={`${c.bg} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                      <span className="font-bold text-gray-800 text-sm">{group.label}</span>
                      <span className="text-xs text-gray-400">({group.labelBn})</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>
                        {items.length}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 ml-4">{group.desc}</p>
                  </div>
                  <button
                    onClick={() => openAdd(group)}
                    className={`${c.btn} text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shrink-0`}
                  >
                    + Add
                  </button>
                </div>

                {/* Account rows */}
                {items.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-400">
                    No accounts yet. Click + Add to create one.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {items
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map(acc => (
                      <div key={acc.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                        <span className="text-xl w-8 text-center">{acc.icon || '📋'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-800 text-sm">{acc.name}</span>
                            {acc.name_bn && <span className="text-xs text-gray-400">({acc.name_bn})</span>}
                            {acc.account_code && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                #{acc.account_code}
                              </span>
                            )}
                            {acc.is_default && (
                              <span className="text-xs bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium">
                                🔒 System
                              </span>
                            )}
                          </div>
                          {acc.sub_accounts?.length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {acc.sub_accounts.length} sub-account{acc.sub_accounts.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(acc, group)}
                            disabled={acc.is_default}
                            className={`p-1.5 rounded-lg transition-colors text-sm ${
                              acc.is_default
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                            }`}
                            title={acc.is_default ? 'System accounts cannot be edited' : 'Edit'}
                          >
                            ✏️
                          </button>
                          {!acc.is_default && (
                            <button
                              onClick={() => setDeleteTarget(acc)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl">

            <div className="px-6 py-4 border-b">
              <h2 className="font-bold text-gray-800">
                {modal.mode === 'add' ? '+ Add Account' : 'Edit Account'}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Group: <span className="font-semibold text-gray-600">{modal.group.label}</span>
              </p>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Icon</label>
                  <input
                    type="text" value={form.icon} maxLength={2}
                    onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                    placeholder="🛒"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Code (optional)</label>
                  <input
                    type="text" value={form.account_code} maxLength={10}
                    onChange={e => setForm(p => ({ ...p, account_code: e.target.value }))}
                    placeholder="e.g. 1001"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Name (English) *</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Product Sales"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">নাম (Bengali)</label>
                <input
                  type="text" value={form.name_bn}
                  onChange={e => setForm(p => ({ ...p, name_bn: e.target.value }))}
                  placeholder="e.g. পণ্য বিক্রয়"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex gap-3">
              <button
                onClick={() => { setModal(null); setError(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : modal.mode === 'add' ? 'Add Account' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="font-bold text-gray-800 mb-2">Delete Account?</h3>
            <p className="text-sm text-gray-600 mb-5">
              "<span className="font-semibold">{deleteTarget.name}</span>" will be removed.
              Existing transactions linked to it will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Keep It
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
