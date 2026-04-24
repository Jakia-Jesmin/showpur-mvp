import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {product.main_image ? (
          <img 
            src={product.main_image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
            📦
          </div>
        )}
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-purple-700 uppercase tracking-widest shadow-sm">
          {product.category_name || 'General'}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
          <span className="text-lg font-black text-purple-700">৳{product.price}</span>
        </div>
        
        <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
          {product.description || 'No description provided for this item.'}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">
              👤
            </div>
            <span className="text-xs text-gray-400 font-medium truncate max-w-[100px]">
              {product.owner_name}
            </span>
          </div>
          <button className="text-xs font-bold text-purple-600 hover:text-purple-800 transition-colors">
            VIEW DETAILS →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
