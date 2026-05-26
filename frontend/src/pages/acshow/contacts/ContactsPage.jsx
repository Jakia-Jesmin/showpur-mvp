import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerList from './CustomerList';
import SupplierList from './SupplierList';
import { ChevronLeft } from 'lucide-react';

const ContactsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('customer');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button onClick={() => navigate('/acshow')} className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
            <ChevronLeft size={14} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800">Contacts <span className="text-gray-400 text-sm font-normal">(পরিচিতি)</span></h1>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 pb-2">
          {[
            { key: 'customer', label: '👤 Customers (গ্রাহক)' },
            { key: 'supplier', label: '🏭 Suppliers (সরবরাহকারী)' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.key ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {tab === 'customer' ? <CustomerList /> : <SupplierList />}
      </div>
    </div>
  );
};

export default ContactsPage;