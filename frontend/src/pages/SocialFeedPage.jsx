import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

const SocialFeedPage = () => {
  const [posts, setPosts] = useState([]); 

  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* 1. Main Feed Area */}
          <div className="flex-1 space-y-8">
            {/* Page Header - Mobile visible */}
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-black text-gray-900">Network Feed</h1>
            </div>

            {/* Premium Create Post Header */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
              <div className="flex gap-5 items-center">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex-shrink-0 flex items-center justify-center font-black text-white shadow-lg shadow-purple-100">
                  J
                </div>
                <button className="flex-1 text-left px-6 py-4 bg-gray-50 hover:bg-gray-100 rounded-[1.5rem] text-gray-500 font-medium transition-all border border-transparent hover:border-gray-200">
                  Share a new collection or business update...
                </button>
                <div className="hidden sm:flex gap-2">
                   <button className="p-3 hover:bg-purple-50 rounded-xl text-purple-600 transition-colors">🖼️</button>
                   <button className="p-3 hover:bg-purple-50 rounded-xl text-purple-600 transition-colors">📈</button>
                </div>
              </div>
            </div>

            {/* Feed Content */}
            <div className="space-y-8">
              {posts.length === 0 ? (
                <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-20 text-center animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                    📡
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Your feed is quiet</h3>
                  <p className="text-gray-500 mt-3 max-w-xs mx-auto font-medium leading-relaxed">
                    Follow more Producers or Showrooms to see their latest products and collaborations.
                  </p>
                  <button className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-gray-200">
                    Discover Partners
                  </button>
                </div>
              ) : (
                posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Content will go here */}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. Right Sidebar - Discovery Hub */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0">
            <div className="sticky top-24 space-y-8">
              
              {/* Profile Mini Card */}
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-purple-100">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-4">Your Identity</p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl font-black">J</div>
                  <div>
                    <h4 className="font-black text-lg leading-tight">Jakia Jesmin</h4>
                    <p className="text-gray-400 text-xs font-medium">Producer • Dhaka</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Connections</p>
                    <p className="text-lg font-black">128</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Views</p>
                    <p className="text-lg font-black">1.2k</p>
                  </div>
                </div>
              </div>

              {/* Suggestions Section */}
              <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Suggested</h3>
                  <button className="text-[10px] font-black text-purple-600 hover:underline">VIEW ALL</button>
                </div>
                
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="group flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-lg group-hover:bg-purple-50 transition-colors">🏢</div>
                        <div>
                          <p className="text-sm font-black text-gray-900">Elite Garments {i}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Showroom • Chittagong</p>
                        </div>
                      </div>
                      <button className="h-8 w-8 rounded-full border border-gray-100 flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white transition-all">
                        <span className="font-bold">+</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Health / Trending */}
              <div className="px-8">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Network Live</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">
                  ShowPur Platform v2.4 • Dhaka, Bangladesh
                </p>
              </div>

            </div>
          </aside>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default SocialFeedPage;
