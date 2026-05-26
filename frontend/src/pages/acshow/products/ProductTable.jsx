// frontend/src/pages/acshow/products/ProductTable.jsx

import React from 'react';
import { Pencil, Trash2, Package } from 'lucide-react';

const ProductTable = ({ products, onEdit, onDelete }) => {
  if (!products?.length) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <Package size={48} className="mx-auto mb-3 text-gray-300" />
        <h3 className="font-bold text-gray-800 mb-1">No Products Yet</h3>
        <p className="text-sm text-gray-500">Add your first product to get started.</p>
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
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase hidden md:table-cell">Category</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Price</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Stock</th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase w-20">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((product, index) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-gray-400 text-xs">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.main_image_url ? (
                      <img src={product.main_image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Package size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{product.short_description || product.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{product.category_name || '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">৳{parseFloat(product.price || 0).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${product.stock_quantity <= (product.low_stock_threshold || 5) ? 'text-red-600' : 'text-gray-700'}`}>
                    {product.stock_quantity || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onEdit(product)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(product)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
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

export default ProductTable;