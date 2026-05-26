import React, { useState, useEffect } from 'react';
import { contactsAPI } from '@/api/contacts';
import { X } from 'lucide-react';


const ContactFormModal = ({ contact, type, onClose, onSuccess }) => {
  const isEdit = !!contact;
  const typeLabel = type === 'customer' ? 'Customer' : 'Supplier';
  const typeIcon = type === 'customer' ? '👤' : '🏭';

  const [form, setForm] = useState(() => ({
    company_name: contact?.company_name || '',
    proprietor_name: contact?.proprietor_name || '',
    business_address: contact?.business_address || '',
    phone: contact?.phone || '',
    email: contact?.email || '',
  }));

  useEffect(() => {
    if (contact) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        company_name: contact.company_name || '',
        proprietor_name: contact.proprietor_name || '',
        business_address: contact.business_address || '',
        phone: contact.phone || '',
        email: contact.email || '',
      });
    }
  }, [contact]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.company_name.trim()) {
      setError('Company name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = { ...form, contact_type: type };
      if (isEdit) {
        await contactsAPI.update(contact.id, data);
      } else {
        await contactsAPI.create(data);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          <h2 className="font-bold text-gray-800">{typeIcon} {isEdit ? 'Edit' : 'Add'} {typeLabel}</h2>
          <div className="w-5" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Company Name *</label>
            <input type="text" name="company_name" value={form.company_name} onChange={handleChange} placeholder={`${typeLabel} name`} className={inputClass} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Owner / Proprietor</label>
            <input type="text" name="proprietor_name" value={form.proprietor_name} onChange={handleChange} placeholder="Owner name (optional)" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Business Address</label>
            <textarea name="business_address" value={form.business_address} onChange={handleChange} placeholder="Address (optional)" rows={2} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Contact No.</label>
            <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email (optional)" className={inputClass} />
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50">
            {loading ? 'Saving...' : `${isEdit ? 'Update' : 'Add'} ${typeLabel}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactFormModal;