// frontend/src/pages/acshow/products/ProductList.jsx

import React, { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import ProductTable from './ProductTable';
import ProductFormModal from './ProductFormModal';
import Spinner from '@/components/ui/Spinner';
import { Plus } from 'lucide-react';

const ProductList = () => {
  const { products, loading, refresh } = useProducts();
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (target) => {
    const targetId = typeof target === 'object' ? target?.id : target;
    const displayName = typeof target === 'object' ? target?.name : `this product`;

    if (!targetId) return;
    if (!window.confirm(`Delete ${displayName}?`)) return;

    try {
      const { productsAPI } = await import('@/api/products');
      await productsAPI.delete(targetId);
      refresh();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    refresh();
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Products <span className="text-gray-400 text-sm font-normal">(পণ্য)</span></h2>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <ProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />

      {showForm && (
        <ProductFormModal product={editingProduct} onClose={() => { setShowForm(false); setEditingProduct(null); }} onSuccess={handleSuccess} />
      )}
    </div>
  );
};

export default ProductList;