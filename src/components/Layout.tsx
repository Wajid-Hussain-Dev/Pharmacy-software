import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-bg-main">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border-theme flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex-1 max-w-md">
            <input 
              type="text" 
              placeholder="Search medicine, batch number, or customer..." 
              className="w-full bg-[#f1f5f9] border border-border-theme px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-5 ml-4">
            <div className="hidden md:flex items-center gap-2">
              <span className="px-2 py-1 bg-red-100 text-danger text-[11px] font-bold rounded-full">
                12 Low Stock Items
              </span>
            </div>
            <div className="w-8 h-8 bg-[#e2e8f0] rounded-full border border-border-theme" />
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
