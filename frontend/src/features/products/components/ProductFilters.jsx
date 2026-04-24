import React from 'react';

const ProductFilters = ({ categories, currentFilters, onFilterChange }) => {
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...currentFilters, [name]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      category: '',
      minPrice: '',
      maxPrice: '',
      condition: '',
      sortBy: 'newest'
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900">Filters</h3>
        <button 
          onClick={clearFilters}
          className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Category
          </label>
          <select
            name="category"
            value={currentFilters.category}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Price Range (৳)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="minPrice"
              placeholder="Min"
              value={currentFilters.minPrice}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <span className="text-gray-300">-</span>
            <input
              type="number"
              name="maxPrice"
              placeholder="Max"
              value={currentFilters.maxPrice}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
        </div>

        {/* Condition Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Condition
          </label>
          <div className="space-y-2">
            {['new', 'refurbished', 'used'].map((cond) => (
              <label key={cond} className="flex items-center group cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={cond}
                  checked={currentFilters.condition === cond}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                />
                <span className="ml-3 text-sm text-gray-600 capitalize group-hover:text-gray-900 transition-colors">
                  {cond}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Sort By
          </label>
          <select
            name="sortBy"
            value={currentFilters.sortBy}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="popularity">Most Popular</option>
          </select>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-50">
        <p className="text-[10px] text-gray-400 leading-tight">
          Filters update your view in real-time. Showing results based on your current partner preferences.
        </p>
      </div>
    </div>
  );
};

export default ProductFilters;