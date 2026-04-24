import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/baseApi';
import { useAuth } from "../hooks/useAuth";
import Spinner from '../components/ui/Spinner';
import ConnectionModal from '../features/connections/components/ConnectionModal';

function PublicProfile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [profileRes, productsRes] = await Promise.all([
          api.get(`/auth/business-profiles/${userId}/`),
          api.get(`/products/public/?user=${userId}`)
        ]);
        setProfile(profileRes.data);
        setProducts(productsRes.data.results || productsRes.data || []);
      } catch (err) {
        setError("The business profile you're looking for is currently unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Spinner size="lg" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
      <div className="max-w-md">
        <div className="text-4xl mb-4">🏪</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button onClick={() => window.history.back()} className="text-purple-700 font-bold hover:underline">← Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* 1. HERO SECTION */}
      <header className="bg-white border-b border-gray-100 pt-32 pb-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-purple-100">
                {profile.business_name?.[0]}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">{profile.business_name}</h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    profile.role === 'producer' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {profile.role}
                  </span>
                </div>
                <p className="text-gray-500 font-medium mt-1 flex items-center gap-1">
                  <span className="text-lg">📍</span> {profile.location}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" 
                   className="flex-1 md:flex-none text-center px-6 py-3 border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all">
                  Visit Website
                </a>
              )}
              {currentUser?.id !== parseInt(userId) && (
                <button 
                  onClick={() => setShowConnectModal(true)}
                  disabled={requestSent}
                  className={`flex-1 md:flex-none px-8 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                    requestSent 
                    ? 'bg-green-50 text-green-700 border border-green-100 cursor-default' 
                    : 'bg-gray-900 text-white hover:bg-purple-700 shadow-purple-100'
                  }`}
                >
                  {requestSent ? 'Request Sent ✅' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* 2. SIDEBAR */}
          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Business Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Direct Phone</label>
                  <p className="font-bold text-gray-900">{profile.phone || 'Private'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Base Office</label>
                  <p className="font-bold text-gray-900">{profile.address || 'Dhaka, Bangladesh'}</p>
                </div>
              </div>
            </section>

            <section className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-purple-100">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-gray-400">Trading Terms</h3>
              <div className="space-y-4">
                {profile.role === 'showroom' ? (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-gray-400 font-medium">Shelf Space</span>
                      <span className="font-black text-lg">৳{profile.shelf_price_per_month || '0'}/mo</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-gray-400 font-medium">Commission</span>
                      <span className="font-black text-lg text-purple-400">{profile.commission_rate || '0'}%</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                      <span className="text-gray-400 font-medium">Min. Order</span>
                      <span className="font-black text-lg">{profile.minimum_order_quantity || '0'} Units</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium block mb-3">Top Categories</span>
                      <div className="flex flex-wrap gap-2">
                        {profile.product_categories?.map(cat => (
                          <span key={cat} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/10">{cat}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </aside>

          {/* 3. MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-12">
            <section className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-2xl font-black text-gray-900 mb-6">About the Business</h2>
              <p className="text-gray-600 leading-relaxed text-lg font-medium">
                {profile.bio || "No detailed business description has been provided yet."}
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-black text-gray-900 mb-8 px-4">
                {profile.role === 'producer' ? 'Product Portfolio' : 'Display Areas'}
              </h2>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {products.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-1000"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">{item.category_name}</p>
                        <h4 className="text-lg font-black text-gray-900 mb-1">{item.name}</h4>
                        <span className="text-xl font-black text-gray-900">৳{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 py-20 text-center">
                  <p className="text-gray-400 font-medium italic">Portfolio items are being curated.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {showConnectModal && (
        <ConnectionModal 
          targetUser={profile} 
          onClose={() => setShowConnectModal(false)} 
          onSuccess={() => setRequestSent(true)}
        />
      )}
    </div>
  );
}

export default PublicProfile;
