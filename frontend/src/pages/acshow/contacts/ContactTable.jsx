import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const ContactTable = ({ contacts, type, onEdit, onDelete }) => {
  if (!contacts?.length) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div className="text-4xl mb-3">{type === 'customer' ? '👤' : '🏭'}</div>
        <h3 className="font-bold text-gray-800 mb-1">No {type === 'customer' ? 'Customers' : 'Suppliers'} Yet</h3>
        <p className="text-sm text-gray-500">Add your first {type === 'customer' ? 'customer' : 'supplier'} to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase w-12">#</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Company Name</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden lg:table-cell">Address</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Contact No.</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Email</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">
                {type === 'customer' ? 'Due' : 'To Pay'}
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contacts.map((contact, index) => (
              <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{contact.company_name}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{contact.proprietor_name || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell max-w-45 truncate">{contact.business_address || '—'}</td>
                <td className="px-4 py-3 text-gray-700 text-xs">{contact.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{contact.email || '—'}</td>
                <td className={`px-4 py-3 text-right font-bold text-sm ${
                  (type === 'customer' ? contact.total_due : contact.total_payable) > 0 
                    ? 'text-rose-600' 
                    : 'text-gray-400'
                }`}>
                  ৳{parseFloat(type === 'customer' ? contact.total_due : contact.total_payable || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onEdit(contact)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(contact.pk || contact.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactTable;