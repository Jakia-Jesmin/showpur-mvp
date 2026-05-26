// frontend/src/pages/acshow/products/ProductsPage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductList from './ProductList';
import { ChevronLeft } from 'lucide-react';

const ProductsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button onClick={() => navigate('/acshow')} className="text-gray-400 hover:text-gray-600 text-xs mb-1 flex items-center gap-1">
            <ChevronLeft size={14} /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-gray-800">Products <span className="text-gray-400 text-sm font-normal">(পণ্য)</span></h1>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <ProductList />
      </div>
    </div>
  );
};

export default ProductsPage;