import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../api/baseApi';
import Spinner from '../components/ui/Spinner';

const AgreementsPage = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        const response = await api.get('/display/agreements/');
        setAgreements(response.data.results || response.data || []);
      } catch (err) {
        console.error("Failed to fetch agreements", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgreements();
  }, []);

  // Helper for status badge colors
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agreements</h1>
          <p className="text-gray-500 mt-1">Manage your business contracts and digital handshakes.</p>
        </div>
        <button className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm">
          + New Agreement
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Partner</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Commission</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {agreements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{item.partner_name || 'Business Partner'}</div>
                        <div className="text-xs text-gray-400">ID: #AGR-{item.id}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.agreement_type || 'Retail'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.commission_rate}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(item.status)}`}>
                          {item.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-purple-600 font-bold text-sm hover:text-purple-900 transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-20 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-lg font-bold text-gray-900">No active agreements</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                Connect with Producers or Showrooms to start drafting your first digital handshake.
              </p>
              <button className="mt-6 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all">
                Find Partners
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AgreementsPage;
