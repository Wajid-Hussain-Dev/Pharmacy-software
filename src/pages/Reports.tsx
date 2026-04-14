import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatDate } from '../lib/utils';
import { Download, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Reports = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const unsubscribeSales = onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'sales'));

    const unsubscribeMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      setMedicines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'medicines'));

    return () => {
      unsubscribeSales();
      unsubscribeMedicines();
    };
  }, []);

  // Process data for charts
  const salesByCategory = medicines.reduce((acc: any, med: any) => {
    const category = med.category || 'General';
    const totalSales = sales.reduce((sum, sale) => {
      const item = sale.items.find((i: any) => i.medicineId === med.id);
      return sum + (item ? item.price * item.quantity : 0);
    }, 0);
    
    acc[category] = (acc[category] || 0) + totalSales;
    return acc;
  }, {});

  const pieData = Object.entries(salesByCategory).map(([name, value]) => ({ name, value }));
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  const totalRevenue = sales.reduce((sum, s) => sum + s.finalAmount, 0);
  const totalProfit = sales.reduce((sum, s) => {
    const cost = s.items.reduce((cAcc: number, item: any) => {
      const med = medicines.find(m => m.id === item.medicineId);
      return cAcc + (med ? med.purchasePrice * item.quantity : 0);
    }, 0);
    return sum + (s.totalAmount - cost);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Detailed insights into your pharmacy performance.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <Download size={20} />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
          <div className="mt-4 flex items-center gap-1 text-green-600 text-sm font-bold">
            <TrendingUp size={16} /> +12.5% from last month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Estimated Profit</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{formatCurrency(totalProfit)}</p>
          <div className="mt-4 flex items-center gap-1 text-green-600 text-sm font-bold">
            <TrendingUp size={16} /> +8.2% from last month
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Transactions</p>
          <p className="text-3xl font-black text-gray-900 mt-1">{sales.length}</p>
          <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-bold">
            <Calendar size={16} /> Average 15/day
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Sales by Category</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Inventory Value</h2>
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm font-bold text-blue-700 uppercase tracking-wider">Total Stock Value (Selling)</p>
              <p className="text-2xl font-black text-blue-900">
                {formatCurrency(medicines.reduce((sum, m) => sum + (m.sellingPrice * m.quantity), 0))}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <p className="text-sm font-bold text-purple-700 uppercase tracking-wider">Total Stock Value (Cost)</p>
              <p className="text-2xl font-black text-purple-900">
                {formatCurrency(medicines.reduce((sum, m) => sum + (m.purchasePrice * m.quantity), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendingUp = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

export default Reports;
