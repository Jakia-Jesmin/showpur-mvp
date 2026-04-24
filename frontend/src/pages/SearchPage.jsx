import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'producer', 'showroom'

  const tabs = [
    { id: 'all', label: 'All Partners', emoji: '🌐' },
    { id: 'producer', label: 'Producers', emoji: '🏭' },
    { id: 'showroom', label: 'Showrooms', emoji: '🏪' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Discover Partners</h1>
            <p className="text-gray-500 mt-2 font-medium">Find and connect with business entities across Bangladesh.</p>
          </div>
          
          {/* Visual Tab Selector */}
          <div className="inline-flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                  activeTab === tab.id 
                  ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-lg">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Massive Search Bar */}
        <div className="relative mb-16 group">
          <div className="absolute inset-0 bg-purple-200/20 blur-3xl rounded-[3rem] transition-opacity opacity-0 group-focus-within:opacity-100" />
          <div className="relative bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-purple-100/40 border border-gray-100 flex items-center">
            <div className="pl-8 text-2xl">🔍</div>
            <input
              type="text"
              placeholder="Search by name, location, or product categories..."
              className="flex-1 bg-transparent border-none px-6 py-6 text-xl font-medium focus:ring-0 outline-none text-gray-900 placeholder:text-gray-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="bg-gray-900 text-white px-10 py-5 rounded-[1.8rem] font-black text-lg hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-200 transition-all active:scale-95 mr-1">
              Search
            </button>
          </div>
        </div>

        {/* 3. Results / Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* This is the empty state with the staggered "YouTube-style" entry feel */}
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-sm animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-5xl mb-8 animate-bounce-slow">
              ✨
            </div>
            <h3 className="text-2xl font-black text-gray-900">The network is yours to explore</h3>
            <p className="text-gray-500 text-center max-w-sm mt-3 font-medium leading-relaxed">
              Find the perfect match for your next business collaboration. Use the filters above to narrow your search.
            </p>
            
            {/* Quick Suggestion Chips */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block w-full text-center mb-2">Try searching for:</span>
              {['Textiles', 'Dhaka Showrooms', 'Eco-friendly', 'Handicrafts'].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-full text-sm font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-100 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        
      </div>
    </DashboardLayout>
  );
};

export default SearchPage;
