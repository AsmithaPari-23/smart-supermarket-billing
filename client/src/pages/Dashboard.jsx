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
  Filler
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
  ShoppingCart,
  QrCode,
  QrCode as ScannerIcon,
  Sparkles,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
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
      <div className="h-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-brand-muted animate-pulse">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || { revenueToday: 0, billsToday: 0, customersToday: 0, lowStockCount: 0 };
  const recentBills = data?.recentBills || [];
  const topProducts = data?.topProducts || [];
  const charts = data?.charts || { weekly: { labels: [], data: [] }, monthly: { labels: [], data: [] } };

  // Theme-tailored chart configurations (Primary Green & Secondary Green)
  const monthlyChartData = {
    labels: charts.monthly.labels,
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: charts.monthly.data,
        backgroundColor: 'rgba(31, 138, 91, 0.75)',
        hoverBackgroundColor: '#1F8A5B',
        borderColor: '#1F8A5B',
        borderWidth: 1,
        borderRadius: 12,
      }
    ]
  };

  const weeklyChartData = {
    labels: charts.weekly.labels,
    datasets: [
      {
        label: 'Daily Sales (₹)',
        data: charts.weekly.data,
        borderColor: '#2EA66D',
        backgroundColor: 'rgba(46, 166, 109, 0.12)',
        borderWidth: 3,
        pointBackgroundColor: '#1F8A5B',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 5,
        fill: true,
        tension: 0.35
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { family: 'Poppins', size: 11, weight: '500' },
          color: '#64748B',
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { family: 'Poppins', size: 12, weight: '600' },
        bodyFont: { family: 'Poppins', size: 12 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748B' }
      },
      y: {
        grid: { color: 'rgba(229, 231, 235, 0.6)', strokeDashArray: [4, 4] },
        ticks: { font: { family: 'Poppins', size: 11 }, color: '#64748B' }
      }
    }
  };

  const categoriesList = [
    { name: 'Fruits & Vegetables', icon: '🍎', count: 'Fresh Picks' },
    { name: 'Dairy & Bakery', icon: '🥛', count: 'Daily Essentials' },
    { name: 'Snacks & Beverages', icon: '🥤', count: 'Instant Delights' },
    { name: 'Packaged Foods', icon: '📦', count: 'Pantry Staples' }
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-brand-primary via-brand-secondary to-[#1F8A5B] text-white p-6 rounded-[20px] shadow-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Smart Supermarket POS
            </span>
            <span className="flex items-center gap-1 text-brand-gold text-xs font-semibold">
              <Sparkles size={14} /> System Operational
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Supermarket Executive Overview</h2>
          <p className="text-xs text-white/80 max-w-xl">
            Real-time cashier activity, inventory alerts, quick POS shortcuts, and sales revenue analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/billing')}
            className="px-5 py-2.5 bg-white text-brand-primary font-bold text-xs rounded-xl shadow-md hover:bg-brand-gold hover:text-brand-dark transition-all duration-200 flex items-center gap-2"
          >
            <ShoppingCart size={16} /> Open Billing POS
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Revenue KPI */}
        <div className="glass-card p-5 rounded-[20px] flex items-center justify-between border border-brand-border hover:shadow-glassHover transition-all">
          <div>
            <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Today's Revenue</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">₹{kpis.revenueToday.toFixed(2)}</h3>
            <p className="text-[10px] text-brand-primary font-semibold mt-1 flex items-center gap-1">
              <ArrowUpRight size={12} /> Real-time sales
            </p>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-4 rounded-2xl border border-brand-primary/20">
            <IndianRupee size={24} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Bills Count KPI */}
        <div className="glass-card p-5 rounded-[20px] flex items-center justify-between border border-brand-border hover:shadow-glassHover transition-all">
          <div>
            <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Today's Invoices</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">{kpis.billsToday}</h3>
            <p className="text-[10px] text-brand-secondary font-semibold mt-1 flex items-center gap-1">
              <Receipt size={12} /> Checkout receipts
            </p>
          </div>
          <div className="bg-brand-secondary/10 text-brand-secondary p-4 rounded-2xl border border-brand-secondary/20">
            <Receipt size={24} className="stroke-[2.5]" />
          </div>
        </div>

        {/* New Customers KPI */}
        <div className="glass-card p-5 rounded-[20px] flex items-center justify-between border border-brand-border hover:shadow-glassHover transition-all">
          <div>
            <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">New CRM Customers</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">{kpis.customersToday}</h3>
            <p className="text-[10px] text-brand-gold font-semibold mt-1 flex items-center gap-1">
              <Users size={12} /> Loyalty members
            </p>
          </div>
          <div className="bg-brand-gold/15 text-brand-dark p-4 rounded-2xl border border-brand-gold/30">
            <Users size={24} className="stroke-[2.5]" />
          </div>
        </div>

        {/* Low Stock count KPI */}
        <div className="glass-card p-5 rounded-[20px] flex items-center justify-between border border-brand-border hover:shadow-glassHover transition-all">
          <div>
            <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Low Stock Items</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">{kpis.lowStockCount}</h3>
            <p className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${
              kpis.lowStockCount > 0 ? 'text-brand-danger' : 'text-brand-success'
            }`}>
              <AlertTriangle size={12} /> Restock alert
            </p>
          </div>
          <div className={`p-4 rounded-2xl border ${
            kpis.lowStockCount > 0 
              ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/25 animate-pulse'
              : 'bg-brand-success/10 text-brand-success border-brand-success/25'
          }`}>
            <AlertTriangle size={24} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Product Categories Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted flex items-center gap-2">
            <Layers size={14} className="text-brand-primary" /> Product Categories Summary
          </h3>
          <span className="text-[10px] text-brand-primary font-semibold">Active Supermarket Catalog</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoriesList.map((cat, i) => (
            <div key={i} className="glass-card p-3.5 rounded-2xl border border-brand-border flex items-center gap-3 hover:border-brand-primary/40 transition">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-brand-dark leading-tight">{cat.name}</h4>
                <p className="text-[10px] text-brand-muted font-medium">{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-[20px] border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" /> Monthly Revenue Trend
              </h2>
              <p className="text-[10px] text-brand-muted">Aggregated sales performance by month</p>
            </div>
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">₹ Analytics</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
                <Activity size={16} className="text-brand-secondary" /> Weekly Sales Performance
              </h2>
              <p className="text-[10px] text-brand-muted">Daily breakdown of total bill amounts</p>
            </div>
            <span className="text-[10px] font-bold text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded-full">Weekly</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Line data={weeklyChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Quick Launch & Top Selling Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fast Action Links & Terminal Status */}
        <div className="glass-card p-5 rounded-[20px] border border-brand-border space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
            <Sparkles size={16} className="text-brand-gold" /> Quick POS Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/billing')}
              className="p-3.5 bg-gradient-to-br from-brand-primary/10 to-brand-primary/20 border border-brand-primary/30 hover:border-brand-primary text-brand-primary rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-200 group"
            >
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">New Invoice</span>
            </button>
            <button
              onClick={() => navigate('/products')}
              className="p-3.5 bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/20 border border-brand-secondary/30 hover:border-brand-secondary text-brand-secondary rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-200 group"
            >
              <PlusCircle size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Add Item</span>
            </button>
            <button
              onClick={() => navigate('/inventory')}
              className="p-3.5 bg-gradient-to-br from-brand-gold/15 to-brand-gold/30 border border-brand-gold/40 hover:border-brand-gold text-brand-dark rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-200 group"
            >
              <FolderPlus size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Inventory Logs</span>
            </button>
            <button
              onClick={() => navigate('/scanner')}
              className="p-3.5 bg-brand-dark/5 border border-brand-dark/15 hover:bg-brand-dark hover:text-white text-brand-dark rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition duration-200 group"
            >
              <ScannerIcon size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Mobile Scanner</span>
            </button>
          </div>

          <div className="bg-brand-bg/80 border border-brand-border p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-brand-dark font-bold text-xs uppercase tracking-wider">
              <Activity size={14} className="text-brand-primary animate-pulse" />
              Supermarket Terminal Status
            </div>
            <div className="space-y-2 text-xs font-medium text-brand-muted">
              <div className="flex justify-between items-center">
                <span>Database Connection</span>
                <span className="flex items-center gap-1 text-brand-success font-semibold"><CheckCircle size={13} /> Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mobile Socket Relay</span>
                <span className="flex items-center gap-1 text-brand-success font-semibold"><CheckCircle size={13} /> Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Thermal Printer Mode</span>
                <span className="flex items-center gap-1 text-brand-muted"><Clock size={13} /> Standard Thermal/PDF</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="glass-card p-5 rounded-[20px] border border-brand-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
              <Package size={16} className="text-brand-primary" /> Top Selling Supermarket Products
            </h2>
            <span className="text-[10px] text-brand-muted font-medium">Ranked by revenue</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 text-center">Items Sold</th>
                  <th className="pb-3 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs font-medium">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-brand-muted">No sales records logged yet.</td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-brand-primary/5 transition-colors">
                      <td className="py-3 text-brand-dark font-semibold">{p.name}</td>
                      <td className="py-3 text-center text-brand-muted">
                        <span className="bg-brand-bg px-2.5 py-1 rounded-full text-brand-dark font-bold text-[11px] border border-brand-border">
                          {p.quantity} units
                        </span>
                      </td>
                      <td className="py-3 text-right text-brand-primary font-bold text-sm">₹{p.salesValue.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Receipts Summary */}
      <div className="glass-card p-5 rounded-[20px] border border-brand-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-brand-dark flex items-center gap-2">
            <Receipt size={16} className="text-brand-primary" /> Recent Checkout Invoices
          </h2>
          <button 
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
          >
            View All History →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                <th className="pb-3">Bill Number</th>
                <th className="pb-3">Cashier</th>
                <th className="pb-3">Payment Method</th>
                <th className="pb-3">Timestamp</th>
                <th className="pb-3 text-right">Grand Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60 text-xs font-medium text-brand-muted">
              {recentBills.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-brand-muted">
                    No checkout invoices generated today. Go to <span className="text-brand-primary font-semibold cursor-pointer" onClick={() => navigate('/billing')}>Billing POS</span> to create one.
                  </td>
                </tr>
              ) : (
                recentBills.map((b) => (
                  <tr key={b._id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="py-3 text-brand-dark font-mono font-bold">{b.billNumber}</td>
                    <td className="py-3 text-brand-dark">{b.cashierName}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                        b.paymentMethod === 'Split' 
                          ? 'bg-brand-warning/15 text-brand-dark border border-brand-warning/30'
                          : b.paymentMethod === 'UPI'
                          ? 'bg-purple-500/10 text-purple-700 border border-purple-200'
                          : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      }`}>
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 text-brand-muted">{new Date(b.createdAt).toLocaleTimeString()}</td>
                    <td className="py-3 text-right text-brand-dark font-bold text-sm">₹{b.grandTotal.toFixed(2)}</td>
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
