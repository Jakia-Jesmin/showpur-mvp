import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-[1400px] mx-auto"> 
            {/* The 1400px max-width keeps your high-end design from stretching too far */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
