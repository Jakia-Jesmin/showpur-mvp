import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/baseApi';
import { useAuth } from "../hooks/useAuth";
import DashboardLayout from '../components/layout/DashboardLayout';
import PostCard from '../features/social/components/PostCard';
import ProductCard from '../features/products/components/ProductCard';
import Spinner from '../components/ui/Spinner';

function BusinessProfilePage() {
  const { userId } = useParams();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        // Parallel fetching for speed
        const [profileRes, postsRes, productsRes] = await Promise.all([
          api.get(`/auth/business-profile/${userId || ''}`),
          api.get(`/social/posts/?user=${userId}`),
          api.get(`/products/products/?owner=${userId}`)
        ]);
        
        setProfile(profileRes.data);
        setPosts(postsRes.data.results || postsRes.data);
        setProducts(productsRes.data.results || productsRes.data);
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, [userId]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  if (!profile) return (
    <DashboardLayout>
      <div className="text-center py-20 text-gray-500">Profile not found.</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      {/* Header Section: Cover & Identity */}
      <div className="relative mb-8">
        <div className="h-48 md:h-64 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-3xl overflow-hidden shadow-lg">
          {profile.cover_image && (
            <img src={profile.cover_image} className="w-full h-full object-cover opacity-50" alt="" />
          )}
        </div>
        
        <div className="px-8 -mt-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="h-32 w-32 rounded-3xl bg-white p-2 shadow-xl">
              <div className="h-full w-full rounded-2xl bg-gray-100 flex items-center justify-center text-4xl overflow-hidden border border-gray-50">
                {profile.logo ? <img src={profile.logo} alt="" /> : "🏢"}
              </div>
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile.business_name}</h1>
              <p className="text-purple-600 font-bold uppercase text-xs tracking-widest flex items-center justify-center md:justify-start gap-2">
                {profile.role} <span className="h-1 w-1 bg-gray-300 rounded-full"></span> {profile.location}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 pb-2">
            <button className="px-6 py-2.5 rounded-xl bg-purple-700 text-white font-bold shadow-md hover:bg-purple-800 transition-all">
              {isFollowing ? 'Following' : 'Follow'}
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all">
              Message
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-8 border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'posts', label: 'Feed', icon: '📱', count: posts.length },
          { id: 'products', label: 'Catalog', icon: '📦', count: products.length },
          { id: 'about', label: 'About', icon: 'ℹ️', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-purple-600 text-purple-700' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count !== null && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'posts' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-20 text-gray-400 italic bg-white rounded-3xl border border-gray-50 shadow-sm">
                No updates shared yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map(product => <ProductCard key={product.id} product={product} />)
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400 italic bg-white rounded-3xl border border-gray-50 shadow-sm">
                This producer hasn't listed any products yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed">{profile.bio || 'No bio available.'}</p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900 text-white p-6 rounded-3xl">
                <h4 className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-4">Contact Details</h4>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between"><span>Location</span> <span className="font-bold">{profile.location}</span></p>
                  <p className="flex justify-between"><span>Website</span> <a href={profile.website} className="text-purple-400 font-bold">Visit Site</a></p>
                  <p className="flex justify-between"><span>Phone</span> <span className="font-bold">{profile.phone}</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default BusinessProfilePage;
