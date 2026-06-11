import React, { useState, useEffect, useCallback, useRef } from 'react';
import { acshowAPI } from '@/api/acshow';
import { contactsAPI } from '@/api/contacts';
import { X, Camera, Plus } from 'lucide-react';
import QuickContactModal from '@/pages/acshow/components/QuickContactModal';

// ─────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────

const TYPES = [
  {
    key: 'sale', icon: '🛒', label: 'Sale',
    partyLabel: 'Customer', partyType: 'customer', showProduct: true, categoryType: 'income',
    creditLabel: 'Customer owes (→ AR)',
    bg: 'bg-blue-600', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200',
    focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
    btn: 'bg-blue-600 hover:bg-blue-700',
  },
  {
    key: 'purchase', icon: '📦', label: 'Purchase',
    partyLabel: 'Supplier', partyType: 'supplier', showProduct: true, categoryType: 'expense',
    creditLabel: 'You owe supplier (→ AP)',
    bg: 'bg-purple-600', text: 'text-purple-700', light: 'bg-purple-50', border: 'border-purple-200',
    focus: 'focus:border-purple-500 focus:ring-2 focus:ring-purple-100',
    btn: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    key: 'income', icon: '💰', label: 'Income',
    partyLabel: 'Received From', partyType: null, showProduct: false, categoryType: 'income',
    creditLabel: 'Will collect later',
    bg: 'bg-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200',
    focus: 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
  },
  {
    key: 'expense', icon: '💸', label: 'Expense',
    partyLabel: 'Paid To', partyType: null, showProduct: false, categoryType: 'expense',
    creditLabel: 'Will pay later',
    bg: 'bg-rose-600', text: 'text-rose-700', light: 'bg-rose-50', border: 'border-rose-200',
    focus: 'focus:border-rose-500 focus:ring-2 focus:ring-rose-100',
    btn: 'bg-rose-600 hover:bg-rose-700',
  },
  {
    key: 'receivable', icon: '📥', label: 'Receivable',
    partyLabel: 'Customer', partyType: 'customer', showProduct: false, categoryType: 'income',
    creditLabel: 'Pending collection',
    bg: 'bg-amber-600', text: 'text-amber-700', light: 'bg-amber-50', border: 'border-amber-200',
    focus: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-100',
    btn: 'bg-amber-600 hover:bg-amber-700',
  },
  {
    key: 'payable', icon: '📤', label: 'Payable',
    partyLabel: 'Supplier', partyType: 'supplier', showProduct: false, categoryType: 'expense',
    creditLabel: 'Pending payment',
    bg: 'bg-orange-600', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200',
    focus: 'focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
    btn: 'bg-orange-600 hover:bg-orange-700',
  },
];

// Map legacy QuickRecord entry types to transaction types
const LEGACY_MAP = { collection: 'income', payment: 'expense' };
const QUICK_AMTS = [100, 500, 1000, 5000];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const QuickRecordModal = ({ type: initType, onClose, onSuccess }) => {
  const resolved = LEGACY_MAP[initType] || initType || 'sale';
  const [activeType, setActiveType] = useState(resolved);
  const cfg = TYPES.find(t => t.key === activeType) || TYPES[0];

  // Form fields
  const [amount, setAmount]         = useState('');
  const [description, setDescription] = useState('');
  const [contactId, setContactId]   = useState('');
  const [partyName, setPartyName]   = useState('');
  const [productId, setProductId]   = useState('');
  const [quantity, setQuantity]     = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [txDate, setTxDate]         = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate]       = useState('');
  const [notes, setNotes]           = useState('');
  const [receiptFile, setReceiptFile]     = useState(null);
  const [receiptPreview, setReceiptPreview] = useState('');

  // Payment split
  const [payMode, setPayMode]       = useState('full_cash');
  const [cashHand, setCashHand]     = useState('');
  const [cashBank, setCashBank]     = useState('');

  // Remote data
  const [contacts, setContacts]     = useState([]);
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);

  // UI state
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [showContactModal, setShowContactModal] = useState(false);
  const fileRef = useRef(null);

  // ── Computed ──────────────────────────────────────────────
  const total    = parseFloat(amount) || 0;
  const hand     = parseFloat(cashHand) || 0;
  const bank     = parseFloat(cashBank) || 0;
  const cashPaid = hand + bank;
  const credit   = Math.max(total - cashPaid, 0);

  // Sync pay mode presets when amount or mode changes
  useEffect(() => {
    if (payMode === 'full_cash') { setCashHand(amount); setCashBank(''); }
    else if (payMode === 'full_credit') { setCashHand(''); setCashBank(''); }
  }, [payMode, amount]);

  // Receivable/Payable always default to full credit
  useEffect(() => {
    if (activeType === 'receivable' || activeType === 'payable') {
      setPayMode('full_credit');
    } else {
      setPayMode('full_cash');
    }
    setContactId(''); setPartyName(''); setProductId('');
    setCategoryId(''); setCashHand(''); setCashBank(''); setDueDate('');
  }, [activeType]);

  // Load contacts, products, categories when type changes
  const loadData = useCallback(async () => {
    const tasks = [];
    if (cfg.partyType) {
      tasks.push(
        contactsAPI.list(cfg.partyType)
          .then(r => setContacts(Array.isArray(r) ? r : (r.results || [])))
          .catch(() => setContacts([]))
      );
    } else {
      setContacts([]);
    }
    if (cfg.showProduct) {
      tasks.push(
        acshowAPI.getProducts()
          .then(r => setProducts(Array.isArray(r) ? r : (r.results || [])))
          .catch(() => setProducts([]))
      );
    }
    tasks.push(
      acshowAPI.getCategories(cfg.categoryType)
        .then(r => setCategories(Array.isArray(r) ? r : (r.results || [])))
        .catch(() => setCategories([]))
    );
    await Promise.all(tasks);
  }, [cfg.partyType, cfg.showProduct, cfg.categoryType]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Receipt file handler ──────────────────────────────────
  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setReceiptFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result);
    reader.readAsDataURL(f);
  };

  // ── Validation ────────────────────────────────────────────
  const validate = () => {
    if (!amount || total <= 0) return 'Enter a valid amount.';
    if (cashPaid > total) return 'Cash paid cannot exceed total amount.';
    if (credit > 0 && !dueDate) return 'Due date is required when part of the amount is on credit.';
    const needsParty = ['sale', 'purchase', 'receivable', 'payable'].includes(activeType);
    if (needsParty && !contactId && !partyName.trim())
      return `${cfg.partyLabel} name or contact is required.`;
    return null;
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (saveAsDraft) => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        transaction_type:  activeType,
        amount:            total,
        description:       description || `${cfg.label} — ${new Date(txDate).toLocaleDateString('en-BD')}`,
        cash_hand_amount:  hand,
        cash_bank_amount:  bank,
        transaction_date:  txDate,
        source:            'manual',
        save_as_draft:     saveAsDraft,
      };
      if (dueDate)    payload.due_date             = dueDate;
      if (contactId)  payload.contact              = contactId;
      if (!contactId && partyName.trim()) payload.party_name = partyName.trim();
      if (cfg.partyType) payload.party_type        = cfg.partyType;
      if (productId)  payload.product              = productId;
      if (quantity)   payload.quantity             = parseFloat(quantity) || 1;
      if (categoryId) payload.account               = categoryId;
      if (notes.trim()) payload.notes              = notes.trim();

      let txn;
      if (receiptFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
        fd.append('receipt_image', receiptFile);
        txn = await acshowAPI.createTransactionFormData(fd);
      } else {
        txn = await acshowAPI.createTransaction(payload);
      }
      onSuccess(txn);
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[95vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
          <h2 className="font-bold text-gray-800 text-base">New Transaction</h2>
          <div className="w-7" />
        </div>

        {/* Type Tabs */}
        <div className="flex-shrink-0 px-4 pt-3 pb-1">
          <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveType(t.key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeType === t.key
                    ? `${t.bg} text-white shadow-sm`
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Amount (৳)</label>
            <input
              type="number" value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00" min="0.01" step="0.01"
              className={`w-full text-3xl font-bold text-center py-4 border-2 border-gray-200 rounded-xl outline-none transition-all ${cfg.focus}`}
              autoFocus
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {QUICK_AMTS.map(n => (
                <button key={n} type="button" onClick={() => setAmount(n.toString())}
                  className="py-1.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  ৳{n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl">
              {[
                { k: 'full_cash',   l: 'Full Cash' },
                { k: 'partial',     l: 'Partial' },
                { k: 'full_credit', l: 'Full Credit' },
              ].map(({ k, l }) => (
                <button key={k} type="button" onClick={() => setPayMode(k)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    payMode === k ? 'bg-white shadow text-gray-800' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  {l}
                </button>
              ))}
            </div>

            {payMode !== 'full_credit' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cash in Hand (৳)</label>
                  <input type="number" value={cashHand} placeholder="0.00" min="0" step="0.01"
                    onChange={e => { setPayMode('partial'); setCashHand(e.target.value); }}
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cash at Bank (৳)</label>
                  <input type="number" value={cashBank} placeholder="0.00" min="0" step="0.01"
                    onChange={e => { setPayMode('partial'); setCashBank(e.target.value); }}
                    className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
                </div>
              </div>
            )}

            {/* Payment summary */}
            {total > 0 && (
              <div className={`mt-3 rounded-xl p-3 text-sm border ${
                credit > 0 ? 'bg-amber-50 border-amber-200' : `${cfg.light} ${cfg.border}`
              }`}>
                {credit > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-amber-800">
                      <span>Paid now</span>
                      <span className="font-semibold">৳{cashPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>{cfg.creditLabel}</span>
                      <span className="font-bold">৳{credit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ) : (
                  <div className={`flex justify-between ${cfg.text}`}>
                    <span>Fully settled</span>
                    <span className="font-bold">৳{total.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Due Date — required when credit > 0 */}
          {credit > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                min={txDate} required
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
            </div>
          )}

          {/* Contact selector */}
          {cfg.partyType ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">{cfg.partyLabel}</label>
                <button type="button" onClick={() => setShowContactModal(true)}
                  className={`text-xs font-semibold flex items-center gap-0.5 ${cfg.text}`}>
                  <Plus size={11} /> Add New
                </button>
              </div>
              <select value={contactId}
                onChange={e => { setContactId(e.target.value); if (e.target.value) setPartyName(''); }}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`}>
                <option value="">Select {cfg.partyLabel.toLowerCase()}...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.proprietor_name}
                    {c.company_name && c.proprietor_name ? ` · ${c.proprietor_name}` : ''}
                    {c.phone ? ` (${c.phone})` : ''}
                  </option>
                ))}
              </select>
              {!contactId && (
                <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)}
                  placeholder={`Or type ${cfg.partyLabel.toLowerCase()} name...`}
                  className={`w-full mt-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm outline-none ${cfg.focus}`} />
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Party Name (optional)</label>
              <input type="text" value={partyName} onChange={e => setPartyName(e.target.value)}
                placeholder="Who is this for?"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
            </div>
          )}

          {/* Product + Quantity */}
          {cfg.showProduct && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product</label>
                <select value={productId} onChange={e => setProductId(e.target.value)}
                  className={`w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Qty</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)}
                  placeholder="1" min="0.01" step="0.01"
                  className={`w-full px-3 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
              </div>
            </div>
          )}

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`}>
                <option value="">Select category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder={
                activeType === 'sale'     ? 'e.g. Wholesale to Ahmed Store' :
                activeType === 'purchase' ? 'e.g. Raw materials from supplier' :
                activeType === 'expense'  ? 'e.g. Office rent June 2026' :
                'What is this for?'
              }
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Date</label>
            <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none ${cfg.focus}`} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Additional details..." rows={2}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none resize-none ${cfg.focus}`} />
          </div>

          {/* Receipt Photo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt Photo (optional)</label>
            {receiptPreview ? (
              <div className="relative">
                <img src={receiptPreview} alt="Receipt" className="w-full h-40 object-cover rounded-xl" />
                <button type="button"
                  onClick={() => { setReceiptFile(null); setReceiptPreview(''); }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
                <Camera size={20} />
                <span className="text-sm">Tap to add receipt photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleFile} />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Footer — Save Draft / Submit */}
        <div className="flex-shrink-0 border-t bg-white px-4 py-3 flex gap-3">
          <button type="button" disabled={loading} onClick={() => handleSubmit(true)}
            className="flex-1 py-3.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 disabled:opacity-50 transition-all">
            Save Draft
          </button>
          <button type="button" disabled={loading} onClick={() => handleSubmit(false)}
            className={`flex-[2] py-3.5 rounded-xl text-sm font-bold text-white active:scale-95 disabled:opacity-50 transition-all ${cfg.btn}`}>
            {loading ? 'Saving...' : `Submit ${cfg.icon}`}
          </button>
        </div>
      </div>

      {showContactModal && (
        <QuickContactModal
          type={cfg.partyType}
          onClose={() => setShowContactModal(false)}
          onSuccess={() => { setShowContactModal(false); loadData(); }}
        />
      )}
    </div>
  );
};

export default QuickRecordModal;
