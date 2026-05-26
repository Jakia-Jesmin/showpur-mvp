import React, { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import ContactTable from './ContactTable';
import ContactFormModal from './ContactFormModal';
import Spinner from '@/components/ui/Spinner';
import { Plus } from 'lucide-react';

const CustomerList = () => {
  const { contacts, setContacts, loading, refresh } = useContacts('customer');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };
    const handleDelete = async (target) => {
      const targetId = typeof target === 'object' ? (target?.id || target?.pk) : target;
      const displayName = typeof target === 'object' ? target?.company_name : `this contact (ID: ${targetId})`;

      if (!targetId) {
          console.error('Delete failed: no valid ID');
          return;
      }

      if (!window.confirm(`Delete ${displayName}?`)) return;

      // Backup in case the API call fails
      const previousContacts = contacts;

      // Instant UI removal
      setContacts(prev => prev.filter(c => c.id !== targetId));

      try {
          const { contactsAPI } = await import('@/api/contacts');
          await contactsAPI.delete(targetId);
          // Success — no further action needed
      } catch (err) {
          console.error('Delete failed:', err);
          // Revert on failure
          setContacts(previousContacts);
          alert('Failed to delete. Please try again.');
      }
  };
  const handleSuccess = () => {
    setShowForm(false);
    setEditingContact(null);
    refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">
          Customers <span className="text-gray-400 text-sm font-normal">(গ্রাহক)</span>
        </h2>
        <button 
          onClick={() => { setEditingContact(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all"
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <ContactTable 
        contacts={contacts} 
        type="customer" 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      {showForm && (
        <ContactFormModal 
          contact={editingContact} 
          type="customer" 
          onClose={() => { setShowForm(false); setEditingContact(null); }} 
          onSuccess={handleSuccess} 
        />
      )}
    </div>
  );
};

export default CustomerList;