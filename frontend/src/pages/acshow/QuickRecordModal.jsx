// frontend/src/pages/acshow/QuickRecordModal.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { acshowAPI } from '@/api/acshow';
import QuickContactModal from '@/pages/acshow/components/QuickContactModal';
import { X } from 'lucide-react';
import { contactsAPI } from '@/api/contacts';

const QuickRecordModal = ({ type, onClose, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [partyName, setPartyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Contact state
  const [contactId, setContactId] = useState('');
  const [contacts, setContacts] = useState([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState('customer');
  
  // Product state
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState([]);
  const [quantity, setQuantity] = useState('1');

  const typeConfig = {
    collection: {
      icon: '💵', title: 'Receive Money', entryType: 'collection',
      placeholder: 'Who paid you?', color: 'emerald',
      focusColor: 'focus:border-emerald-500 focus:ring-emerald-200',
      btnColor: 'bg-emerald-600 hover:bg-emerald-700',
      quickHover: 'hover:bg-emerald-50 hover:text-emerald-600',
      showContact: true, contactType: 'customer', showProduct: false,
    },
    payment: {
      icon: '💸', title: 'Pay Supplier', entryType: 'payment',
      placeholder: 'Who did you pay?', color: 'rose',
      focusColor: 'focus:border-rose-500 focus:ring-rose-200',
      btnColor: 'bg-rose-600 hover:bg-rose-700',
      quickHover: 'hover:bg-rose-50 hover:text-rose-600',
      showContact: true, contactType: 'supplier', showProduct: false,
    },
    sale: {
      icon: '🛒', title: 'Record Sale', entryType: 'sale',
      placeholder: 'Customer name', color: 'blue',
      focusColor: 'focus:border-blue-500 focus:ring-blue-200',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      quickHover: 'hover:bg-blue-50 hover:text-blue-600',
      showContact: true, contactType: 'customer', showProduct: true,
    },
    purchase: {
      icon: '📦', title: 'Record Purchase', entryType: 'purchase',
      placeholder: 'Supplier name', color: 'purple',
      focusColor: 'focus:border-purple-500 focus:ring-purple-200',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      quickHover: 'hover:bg-purple-50 hover:text-purple-600',
      showContact: true, contactType: 'supplier', showProduct: true,
    },
    expense: {
      icon: '🧾', title: 'Add Expense', entryType: 'expense',
      placeholder: 'What was the expense?', color: 'orange',
      focusColor: 'focus:border-orange-500 focus:ring-orange-200',
      btnColor: 'bg-orange-600 hover:bg-orange-700',
      quickHover: 'hover:bg-orange-50 hover:text-orange-600',
      showContact: false, showProduct: false,
    },
  };

  const config = typeConfig[type] || typeConfig.collection;

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    if (config.showContact) {
      try {
        const res = await contactsAPI.list(config.contactType);
        const data = res.results || res;
        setContacts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      }
    }
  }, [config.showContact, config.contactType]);

  // Fetch products (for sale/purchase)
  const fetchProducts = useCallback(async () => {
    if (config.showProduct) {
      try {
        // Use existing products API or create one
        const res = await acshowAPI.getProducts?.() || { data: { results: [] } };
        setProducts(res.data.results || res.data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      }
    }
  }, [config.showProduct]);

  useEffect(() => {
    const loadData = async () => {
      await fetchContacts();
      await fetchProducts();
    };

    loadData();
  }, [fetchContacts, fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        entry_type: config.entryType,
        amount: parseFloat(amount),
        description: description || `${config.title}`,
        party_name: partyName,
        is_paid: true,
      };
      
      if (contactId) payload.contact = contactId;
      if (productId) payload.product = productId;
      if (quantity) payload.quantity = quantity;
      
      await acshowAPI.createQuickRecord(payload);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdded = () => {
    setShowContactModal(false);
    fetchContacts();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h2 className="font-semibold text-gray-800">{config.icon} {config.title}</h2>
          <div className="w-5" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* Contact Dropdown */}
          {config.showContact && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {config.contactType === 'customer' ? '👤 Customer' : '🏭 Supplier'}
              </label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${config.focusColor}`}>
                <option value="">Select {config.contactType}...</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
              <button type="button" onClick={() => { setContactType(config.contactType); setShowContactModal(true); }}
                className="text-xs text-emerald-600 font-medium mt-1 hover:text-emerald-700">
                + Add New {config.contactType === 'customer' ? 'Customer' : 'Supplier'}
              </button>
            </div>
          )}

          {/* Product Dropdown (Sale/Purchase only) */}
          {config.showProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">📦 Product</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${config.focusColor}`}>
                <option value="">Select product...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {/* Quantity (Sale/Purchase only) */}
          {config.showProduct && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                placeholder="1" min="0.01" step="0.01"
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none transition-all ${config.focusColor}`} />
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (৳)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full text-3xl font-bold text-center py-4 border-2 border-gray-200 rounded-xl outline-none transition-all ${config.focusColor}`}
              autoFocus />
          </div>

          {/* Quick Amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map(preset => (
              <button key={preset} type="button" onClick={() => setAmount(preset.toString())}
                className={`py-2 px-3 bg-gray-100 rounded-lg text-sm font-medium transition-colors ${config.quickHover}`}>
                ৳{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Party Name (fallback) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{config.placeholder}</label>
            <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)}
              placeholder="Name (optional)"
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none transition-all ${config.focusColor}`} />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this for? (optional)" rows={2}
              className={`w-full px-4 py-3 border border-gray-200 rounded-xl outline-none resize-none transition-all ${config.focusColor}`} />
          </div>

          {/* Error */}
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full text-white py-4 rounded-xl text-lg font-semibold active:scale-95 transition-all disabled:opacity-50 ${config.btnColor}`}>
            {loading ? 'Saving...' : `Save ${config.title}`}
          </button>
        </form>
      </div>

      {/* Quick Contact Modal */}
      {showContactModal && (
        <QuickContactModal
          type={contactType}
          onClose={() => setShowContactModal(false)}
          onSuccess={handleContactAdded}
        />
      )}
    </div>
  );
};

export default QuickRecordModal;