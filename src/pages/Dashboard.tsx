import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { startOfDay, subDays, format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    dailySales: 0,
    monthlySales: 0,
    totalMedicines: 0,
    lowStock: 0,
    expiringSoon: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const today = startOfDay(new Date());
    const salesQuery = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(5));
    
    const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentSales(sales);
      
      // Calculate daily sales
      const todaySales = sales
        .filter((s: any) => new Date(s.timestamp) >= today)
        .reduce((acc: number, s: any) => acc + s.finalAmount, 0);
      
      setStats(prev => ({ ...prev, dailySales: todaySales }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sales'));

    const unsubscribeMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      const medicines = snapshot.docs.map(doc => doc.data());
      const lowStock = medicines.filter((m: any) => m.quantity <= (m.lowStockThreshold || 10)).length;
      
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      const expiringSoon = medicines.filter((m: any) => new Date(m.expiryDate) <= ninetyDaysFromNow).length;

      setStats(prev => ({
        ...prev,
        totalMedicines: medicines.length,
        lowStock,
        expiringSoon
      }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'medicines'));

    // Mock chart data for now (in real app, query last 7 days)
    const mockData = Array.from({ length: 7 }).map((_, i) => ({
      name: format(subDays(new Date(), 6 - i), 'EEE'),
      sales: Math.floor(Math.random() * 5000) + 1000,
    }));
    setChartData(mockData);

    return () => {
      unsubscribeSales();
      unsubscribeMedicines();
    };
  }, []);

  const statCards = [
    { label: "Today's Sales", value: formatCurrency(stats.dailySales), trend: "↑ 12.5% vs yesterday", icon: ShoppingCart, color: "text-success", bg: "bg-emerald-50" },
    { label: 'Total Medicines', value: stats.totalMedicines, trend: "↑ 8.2% vs average", icon: Package, color: 'text-primary', bg: 'bg-sky-50' },
    { label: 'Low Stock Alert', value: stats.lowStock, trend: "Ordered today", icon: AlertTriangle, color: 'text-warning', bg: 'bg-amber-50' },
    { label: 'Expiring Soon', value: stats.expiringSoon, trend: "↑ 4.1% monthly", icon: TrendingUp, color: 'text-danger', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card-theme">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-text-main">{card.value}</p>
            <p className={cn("text-[11px] mt-1 font-medium", i === 2 ? "text-text-muted" : card.color)}>
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-theme">
          <div className="px-5 py-4 border-b border-border-theme flex items-center justify-between bg-white">
            <h2 className="text-base font-bold text-text-main">Inventory Overview - Fast Moving</h2>
            <button className="btn-primary">View All Inventory</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="text-left px-5 py-3 text-text-muted font-bold">Medicine Name</th>
                  <th className="text-left px-5 py-3 text-text-muted font-bold">Batch</th>
                  <th className="text-left px-5 py-3 text-text-muted font-bold">Stock</th>
                  <th className="text-left px-5 py-3 text-text-muted font-bold">Price</th>
                  <th className="text-left px-5 py-3 text-text-muted font-bold">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme">
                {recentSales.length > 0 ? recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium">Medicine Item</td>
                    <td className="px-5 py-3 text-text-muted">B-2024-01</td>
                    <td className="px-5 py-3">1,240</td>
                    <td className="px-5 py-3">$0.15</td>
                    <td className="px-5 py-3 text-text-muted">Mar 2026</td>
                  </tr>
                )) : (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium">Sample Medicine {i}</td>
                      <td className="px-5 py-3 text-text-muted">B-2024-0{i}</td>
                      <td className="px-5 py-3">1,240</td>
                      <td className="px-5 py-3">$0.15</td>
                      <td className="px-5 py-3 text-text-muted">Mar 2026</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-theme">
            <div className="px-5 py-4 border-b border-border-theme bg-white">
              <h2 className="text-base font-bold text-text-main">Quick Actions</h2>
            </div>
            <div className="p-5 grid gap-3">
              <Link to="/pos" className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-border-theme rounded-lg text-sm font-medium hover:border-primary hover:bg-[#f0f9ff] transition-all">
                <span className="text-primary font-bold text-lg">+</span> New Sale (POS)
              </Link>
              <Link to="/inventory" className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-border-theme rounded-lg text-sm font-medium hover:border-primary hover:bg-[#f0f9ff] transition-all">
                <span className="text-success font-bold text-lg">↓</span> Receive Stock
              </Link>
              <Link to="/reports" className="flex items-center gap-3 p-3 bg-[#f8fafc] border border-border-theme rounded-lg text-sm font-medium hover:border-primary hover:bg-[#f0f9ff] transition-all">
                <span className="text-warning font-bold text-lg">!</span> Expiry Report
              </Link>
            </div>
          </div>

          <div className="card-theme flex-1">
            <div className="px-5 py-4 border-b border-border-theme bg-white">
              <h2 className="text-base font-bold text-text-main">Stock Alerts</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 border-l-4 border-danger bg-[#fff1f2] rounded-r-lg">
                <p className="text-sm font-bold text-text-main">Insulin Glargine</p>
                <p className="text-xs text-text-muted">Only 2 units remaining</p>
              </div>
              <div className="p-3 border-l-4 border-warning bg-[#fffbeb] rounded-r-lg">
                <p className="text-sm font-bold text-text-main">Azithromycin 500mg</p>
                <p className="text-xs text-text-muted">Expiring in 45 days (Batch A2)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
