import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  LogOut,
  PlusCircle,
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { profile } = useAuth();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ShoppingCart, label: 'POS Billing', path: '/pos' },
    { icon: Package, label: 'Inventory', path: '/inventory' },
    { icon: Users, label: 'Suppliers', path: '/suppliers' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  if (profile?.role === 'admin') {
    menuItems.push({ icon: Settings, label: 'Settings', path: '/settings' });
  }

  return (
    <div className="w-[240px] bg-sidebar-bg text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 pb-8">
        <div className="flex items-center gap-2 text-[#38bdf8]">
          <PlusCircle size={24} />
          <span className="text-xl font-bold tracking-tight">PharmaFlow</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-6 py-3 text-sm transition-all border-l-4",
              location.pathname === item.path
                ? "bg-white/5 text-white border-[#38bdf8]"
                : "text-[#94a3b8] border-transparent hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-[#64748b] font-bold">Logged in as</p>
          <p className="text-sm font-medium text-white truncate">{profile?.name}</p>
        </div>
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-3 w-full text-sm font-medium text-[#94a3b8] hover:text-red-400 transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
