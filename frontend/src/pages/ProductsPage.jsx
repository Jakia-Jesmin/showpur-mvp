import React, { useState, useEffect } from 'react';
import api from '../api/baseApi';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProductCard from '../features/products/components/ProductCard';
import ProductFilters from '../features/products/components/ProductFilters';
import Spinner from '../components/ui/Spinner';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    sortBy: 'newest'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products/products/'),
          api.get('/products/categories/')
        ]);
        setProducts(prodRes.data.results || prodRes.data);
        setCategories(catRes.data.results || catRes.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         product.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || String(product.category) === String(filters.category);
    
    const price = parseFloat(product.price);
    const matchesMinPrice = !filters.minPrice || price >= parseFloat(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= parseFloat(filters.maxPrice);
    
    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[60vh] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1440px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketplace</h1>
            <p className="text-gray-500 mt-2 font-medium">Discover unique offerings from local producers.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inventory</p>
                <p className="text-sm font-black text-gray-900">{filteredProducts.length} Items Available</p>
             </div>
             <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-xl shadow-sm border border-purple-100">
               📦
             </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Enhanced Filter Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm group-focus-within:shadow-purple-100 group-focus-within:border-purple-200 outline-none transition-all font-medium"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-6">Refine Search</h3>
                <ProductFilters 
                  categories={categories} 
                  currentFilters={filters} 
                  onFilterChange={setFilters} 
                />
              </div>
              
              {/* Promo Card */}
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[2rem] text-white shadow-xl shadow-purple-100">
                <h4 className="font-bold mb-2">New Connections</h4>
                <p className="text-xs text-purple-100 leading-relaxed mb-4">Producers are listing new items daily. Check back for fresh inventory.</p>
                <button className="text-xs font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 py-2 px-4 rounded-lg transition-all">View Trends</button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            {error && (
              <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 mb-8 flex items-center gap-3">
                <span>⚠️</span> <span className="font-medium">Error loading catalog: {error}</span>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.map((product, index) => (
                  <div key={product.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border border-gray-100 py-32 text-center shadow-sm">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                  🔎
                </div>
                <h3 className="text-2xl font-black text-gray-900">No results found</h3>
                <p className="text-gray-500 max-w-sm mx-auto mt-3 font-medium px-6">
                  We couldn't find any products matching your current criteria. Try expanding your search.
                </p>
                <button 
                  onClick={() => setFilters({search: '', category: '', minPrice: '', maxPrice: '', condition: '', sortBy: 'newest'})}
                  className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-gray-200"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProductsPage;
