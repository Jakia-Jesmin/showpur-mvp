import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import api from '../api/baseApi';
import Spinner from '../components/ui/Spinner';

const ConnectionsPage = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await api.get('/accounts/connections/');
        setConnections(response.data.results || response.data);
      } catch (err) {
        console.error("Failed to fetch connections", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-500 mt-1">Manage your business partners and collaborative network.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {connections.length > 0 ? (
            connections.map((partner) => (
              <div key={partner.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center text-2xl">
                  {partner.logo ? <img src={partner.logo} alt="" className="rounded-full" /> : "🏢"}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{partner.business_name}</h3>
                  <p className="text-xs text-gray-500">{partner.role} • {partner.location}</p>
                </div>
                <button className="text-xs font-bold text-purple-600 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors">
                  MESSAGE
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <p className="text-gray-500">You haven't made any connections yet.</p>
              <button className="mt-4 text-purple-700 font-bold">Browse the Network</button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ConnectionsPage;
