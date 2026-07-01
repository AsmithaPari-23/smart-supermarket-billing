import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Line, 
  Bar 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  IndianRupee, 
  Receipt, 
  Users, 
  AlertTriangle, 
  PlusCircle, 
  FolderPlus, 
  Activity, 
  CheckCircle,
  Clock,
  ShoppingCart
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/reports/dashboard');
      if (data.success) {
        setData(data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = data?.kpis || { revenueToday: 0, billsToday: 0, customersToday: 0, lowStockCount: 0 };
  const recentBills = data?.recentBills || [];
  const topProducts = data?.topProducts || [];
  const charts = data?.charts || { weekly: { labels: [], data: [] }, monthly: { labels: [], data: [] } };

  // Chart configs
  const monthlyChartData = {
    labels: charts.monthly.labels,
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: charts.monthly.data,
        backgroundColor: 'rgba(37, 99, 235, 0.45)',
        borderColor: '#2563EB',
        borderWidth: 2,
        borderRadius: 8,
        tension: 0.3
      }
    ]
  };

  const weeklyChartData = {
    labels: charts.weekly.labels,
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: charts.weekly.data,
        borderColor: '#16A34A',
        backgroundColor: 'rgba(22, 163, 74, 0.05)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.3
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Revenue KPI */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-glass-border">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-2xl font-bold font-heading text-text-primary mt-1">₹{kpis.revenueToday.toFixed(2)}</h3>
          </div>
          <div className="bg-blue-500/10 text-accent-primary p-3.5 rounded-xl border border-blue-500/25">
            <IndianRupee size={22} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Bills Count KPI */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-glass-border">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Today's Bills</p>
            <h3 className="text-2xl font-bold font-heading text-text-primary mt-1">{kpis.billsToday}</h3>
          </div>
          <div className="bg-green-500/10 text-accent-success p-3.5 rounded-xl border border-green-500/25">
            <Receipt size={22} className="stroke-[2.2]" />
          </div>
        </div>

        {/* New Customers KPI */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-glass-border">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">New Customers</p>
            <h3 className="text-2xl font-bold font-heading text-text-primary mt-1">{kpis.customersToday}</h3>
          </div>
          <div className="bg-amber-500/10 text-accent-warning p-3.5 rounded-xl border border-amber-500/25">
            <Users size={22} className="stroke-[2.2]" />
          </div>
        </div>

        {/* Low Stock count KPI */}
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between border border-glass-border">
          <div>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-2xl font-bold font-heading text-text-primary mt-1">{kpis.lowStockCount}</h3>
          </div>
          <div className={`p-3.5 rounded-xl border ${
            kpis.lowStockCount > 0 
              ? 'bg-red-500/10 text-accent-danger border-red-500/25 animate-pulse'
              : 'bg-green-500/10 text-accent-success border-green-500/25'
          }`}>
            <AlertTriangle size={22} className="stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Chart Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-glass-border">
          <h2 className="text-sm font-semibold font-heading text-text-primary mb-4">Monthly Revenue Trend</h2>
          <div className="h-64 flex items-center justify-center">
            <Bar data={monthlyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border">
          <h2 className="text-sm font-semibold font-heading text-text-primary mb-4">Weekly Sales Performance</h2>
          <div className="h-64 flex items-center justify-center">
            <Line data={weeklyChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Quick Launch & Top Selling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast Action Links */}
        <div className="glass-card p-5 rounded-2xl border border-glass-border space-y-4 lg:col-span-1">
          <h2 className="text-sm font-semibold font-heading text-text-primary">Quick Shortcuts</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/billing')}
              className="p-4 bg-accent-primary/10 border border-accent-primary/20 hover:bg-accent-primary/20 text-accent-primary rounded-xl flex flex-col items-center justify-center text-center gap-2 transition duration-200"
            >
              <ShoppingCart size={22} />
              <span className="text-xs font-semibold">New Invoice</span>
            </button>
            <button
              onClick={() => navigate('/products')}
              className="p-4 bg-accent-success/10 border border-accent-success/20 hover:bg-accent-success/20 text-accent-success rounded-xl flex flex-col items-center justify-center text-center gap-2 transition duration-200"
            >
              <PlusCircle size={22} />
              <span className="text-xs font-semibold">Add Item</span>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="p-4 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-accent-warning rounded-xl flex flex-col items-center justify-center text-center gap-2 transition duration-200"
            >
              <FolderPlus size={22} />
              <span className="text-xs font-semibold">Restock Logs</span>
            </button>
            <button
              onClick={() => navigate('/customers')}
              className="p-4 bg-gray-500/10 border border-gray-500/20 hover:bg-gray-500/20 text-text-primary rounded-xl flex flex-col items-center justify-center text-center gap-2 transition duration-200"
            >
              <Users size={22} />
              <span className="text-xs font-semibold">Customers</span>
            </button>
          </div>

          <div className="bg-white/40 border border-glass-border p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-text-primary font-semibold text-xs uppercase tracking-wider">
              <Activity size={14} className="text-accent-primary animate-pulse" />
              Terminal Status
            </div>
            <div className="space-y-2 text-xs font-medium text-text-secondary">
              <div className="flex justify-between items-center">
                <span>Database Sync</span>
                <span className="flex items-center gap-1 text-accent-success"><CheckCircle size={12} /> Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mobile Socket Port</span>
                <span className="flex items-center gap-1 text-accent-success"><CheckCircle size={12} /> Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>POS Printer status</span>
                <span className="flex items-center gap-1 text-text-secondary/50"><Clock size={12} /> Standard PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="glass-card p-5 rounded-2xl border border-glass-border lg:col-span-2">
          <h2 className="text-sm font-semibold font-heading text-text-primary mb-4">Top Selling Products</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 text-center">Items Sold</th>
                  <th className="pb-3 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-sm font-medium">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/20 transition-colors">
                    <td className="py-3 text-text-primary font-semibold">{p.name}</td>
                    <td className="py-3 text-center text-text-secondary">{p.quantity}</td>
                    <td className="py-3 text-right text-accent-primary font-bold">₹{p.salesValue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Bills Summary */}
      <div className="glass-card p-5 rounded-2xl border border-glass-border">
        <h2 className="text-sm font-semibold font-heading text-text-primary mb-4">Recent Receipts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                <th className="pb-3">Bill Number</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border text-sm font-medium text-text-secondary">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-xs">No invoices generated yet today. Go to Billing to create one.</td>
                </tr>
              ) : (
                recentBills.map((b) => (
                  <tr key={b._id} className="hover:bg-white/20 transition-colors">
                    <td className="py-3 text-text-primary font-mono font-semibold">{b.billNumber}</td>
                    <td className="py-3">{b.cashierName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                        b.paymentMethod === 'Split' 
                          ? 'bg-amber-500/10 text-accent-warning border border-amber-500/25'
                          : 'bg-blue-500/10 text-accent-primary border border-blue-500/25'
                      }`}>
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3">{new Date(b.createdAt).toLocaleTimeString()}</td>
                    <td className="py-3 text-right text-text-primary font-bold">₹{b.grandTotal.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
