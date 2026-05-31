import React, { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '@/api/acshow';
import { contactsAPI } from '@/api/contacts';
import { X } from 'lucide-react';
import QuickContactModal from '@/pages/acshow/components/QuickContactModal';

// ─────────────────────────────────────────────────────────────
// CONFIG PER ENTRY TYPE
// ─────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  collection: {
    icon: '💵', title: 'Receive Money', entryType: 'collection',
    focusColor: 'focus:border-emerald-500 focus:ring-emerald-200',
    btnColor:   'bg-emerald-600 hover:bg-emerald-700',
    showContact: true,  contactType: 'customer',
    showProduct: false, creditLabel: 'Remaining to collect later',
  },
  payment: {
    icon: '💸', title: 'Pay Supplier', entryType: 'payment',
    focusColor: 'focus:border-rose-500 focus:ring-rose-200',
    btnColor:   'bg-rose-600 hover:bg-rose-700',
    showContact: true,  contactType: 'supplier',
    showProduct: false, creditLabel: 'Will pay later (credit)',
  },
  sale: {
    icon: '🛒', title: 'Record Sale', entryType: 'sale',
    focusColor: 'focus:border-blue-500 focus:ring-blue-200',
    btnColor:   'bg-blue-600 hover:bg-blue-700',
    showContact: true,  contactType: 'customer',
    showProduct: true,  creditLabel: 'Customer owes (goes to AR)',
  },
  purchase: {
    icon: '📦', title: 'Record Purchase', entryType: 'purchase',
    focusColor: 'focus:border-purple-500 focus:ring-purple-200',
    btnColor:   'bg-purple-600 hover:bg-purple-700',
    showContact: true,  contactType: 'supplier',
    showProduct: true,  creditLabel: 'You owe supplier (goes to AP)',
  },
  expense: {
    icon: '🧾', title: 'Add Expense', entryType: 'expense',
    focusColor: 'focus:border-orange-500 focus:ring-orange-200',
    btnColor:   'bg-orange-600 hover:bg-orange-700',
    showContact: false, showProduct: false,
    creditLabel: 'Credit portion',
  },
};

// ─────────────────────────────────────────────────────────────
// PAYMENT MODE
//   full_cash  — entire amount paid in cash (hand or bank)
//   partial    — some cash now, rest on credit
//   full_credit — nothing paid now, all on credit
// ─────────────────────────────────────────────────────────────

const QuickRecordModal = ({ type, onClose, onSuccess }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.collection;

  const [amount,       setAmount]       = useState('');
  const [description,  setDescription]  = useState('');
  const [partyName,    setPartyName]    = useState('');
  const [contactId,    setContactId]    = useState('');
  const [productId,    setProductId]    = useState('');
  const [quantity,     setQuantity]     = useState('1');
  const [dueDate,      setDueDate]      = useState('');
  const [contacts,     setContacts]     = useState([]);
  const [products,     setProducts]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [showContactModal, setShowContactModal] = useState(false);

  // Payment split state
  const [payMode,      setPayMode]      = useState('full_cash');  // full_cash | partial | full_credit
  const [cashHandAmt,  setCashHandAmt]  = useState('');
  const [cashBankAmt,  setCashBankAmt]  = useState('');

  // Computed credit
  const totalAmount = parseFloat(amount) || 0;
  const handPaid    = parseFloat(cashHandAmt) || 0;
  const bankPaid    = parseFloat(cashBankAmt) || 0;
  const creditAmt   = Math.max(totalAmount - handPaid - bankPaid, 0);

  // Sync pay mode preset values
  useEffect(() => {
    if (payMode === 'full_cash') {
      setCashHandAmt(amount);
      setCashBankAmt('');
    } else if (payMode === 'full_credit') {
      setCashHandAmt('');
      setCashBankAmt('');
    } else {
      // partial — user types their own split
    }
  }, [payMode, amount]);

  const fetchContacts = useCallback(async () => {
    if (!cfg.showContact) return;
    try {
      const res  = await contactsAPI.list(cfg.contactType);
      const data = res.results || res;
      setContacts(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [cfg.showContact, cfg.contactType]);

  const fetchProducts = useCallback(async () => {
    if (!cfg.showProduct) return;
    try {
      const res  = await acshowAPI.getProducts();
      const data = res.results || res;
      setProducts(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [cfg.showProduct]);

  useEffect(() => {
    fetchContacts();
    fetchProducts();
  }, [fetchContacts, fetchProducts]);

  const validate = () => {
    if (!amount || totalAmount <= 0) return 'Please enter a valid amount.';
    if (handPaid + bankPaid > totalAmount) return 'Cash amounts cannot exceed total amount.';
    if (creditAmt > 0 && !dueDate) return 'Due date is required when part of the amount is on credit.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError('');
    try {
      const payload = {
        entry_type:       cfg.entryType,
        amount:           totalAmount,
        description:      description || cfg.title,
        party_name:       partyName,
        is_paid:          creditAmt === 0,
        cash_hand_amount: handPaid,
        cash_bank_amount: bankPaid,
      };

      if (dueDate)    payload.due_date = dueDate;
      if (contactId)  payload.contact  = contactId;
      if (productId)  payload.product  = productId;
      if (quantity)   payload.quantity = parseFloat(quantity);

      await acshowAPI.createQuickRecord(payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h2 className="font-semibold text-gray-800">{cfg.icon} {cfg.title}</h2>
          <div className="w-5" />
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* Contact */}
          {cfg.showContact && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {cfg.contactType === 'customer' ? 'Customer' : 'Supplier'}
              </label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`}>
                <option value="">Select {cfg.contactType}...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.company_name}</option>
                ))}
              </select>
              <button type="button"
                onClick={() => setShowContactModal(true)}
                className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700">
                + Add New {cfg.contactType === 'customer' ? 'Customer' : 'Supplier'}
              </button>
            </div>
          )}

          {/* Product */}
          {cfg.showProduct && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select value={productId} onChange={(e) => setProductId(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`}>
                  <option value="">Select product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1" min="0.01" step="0.01"
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`} />
              </div>
            </>
          )}

          {/* Total Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (&#2547;)</label>
            <input
              type="number" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" min="0.01" step="0.01"
              className={`w-full text-3xl font-bold text-center py-4 border-2 border-gray-200 rounded-xl outline-none transition-all ${cfg.focusColor}`}
              autoFocus
            />
            {/* Quick amount presets */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[100, 500, 1000, 5000].map(n => (
                <button key={n} type="button" onClick={() => setAmount(n.toString())}
                  className="py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                  &#2547;{n.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
              {[
                { key: 'full_cash',   label: 'Full Cash' },
                { key: 'partial',     label: 'Partial' },
                { key: 'full_credit', label: 'Full Credit' },
              ].map(({ key, label }) => (
                <button
                  key={key} type="button"
                  onClick={() => setPayMode(key)}
                  className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                    payMode === key
                      ? 'bg-white shadow text-gray-800'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash split inputs (hidden for full_credit) */}
          {payMode !== 'full_credit' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cash in Hand (&#2547;)</label>
                <input
                  type="number" value={cashHandAmt}
                  onChange={(e) => { setPayMode('partial'); setCashHandAmt(e.target.value); }}
                  placeholder="0.00" min="0" step="0.01"
                  className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cash at Bank (&#2547;)</label>
                <input
                  type="number" value={cashBankAmt}
                  onChange={(e) => { setPayMode('partial'); setCashBankAmt(e.target.value); }}
                  placeholder="0.00" min="0" step="0.01"
                  className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`}
                />
              </div>
            </div>
          )}

          {/* Credit Summary */}
          {totalAmount > 0 && (
            <div className={`rounded-xl p-3 text-sm ${creditAmt > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
              {creditAmt > 0 ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-amber-800">
                    <span>Cash now</span>
                    <span className="font-semibold">&#2547;{(handPaid + bankPaid).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>{cfg.creditLabel}</span>
                    <span className="font-bold">&#2547;{creditAmt.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-800">
                  <span>Fully paid</span>
                  <span className="font-bold">&#2547;{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          )}

          {/* Due Date (required when credit > 0) */}
          {creditAmt > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${cfg.focusColor}`}
                required
              />
            </div>
          )}

          {/* Party Name (free text fallback) */}
          {!cfg.showContact && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Name (optional)</label>
              <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)}
                placeholder="Name"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition-all ${cfg.focusColor}`} />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this for?" rows={2}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none transition-all ${cfg.focusColor}`} />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className={`w-full text-white py-4 rounded-xl text-base font-semibold active:scale-95 transition-all disabled:opacity-50 ${cfg.btnColor}`}>
            {loading ? 'Saving...' : `Save ${cfg.title}`}
          </button>
        </form>
      </div>

      {showContactModal && (
        <QuickContactModal
          type={cfg.contactType}
          onClose={() => setShowContactModal(false)}
          onSuccess={() => { setShowContactModal(false); fetchContacts(); }}
        />
      )}
    </div>
  );
};

export default QuickRecordModal;
