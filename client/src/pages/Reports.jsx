import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bar, 
  Doughnut 
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { 
  TrendingUp, 
  IndianRupee, 
  Scissors, 
  Coins, 
  Calendar, 
  Printer 
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const url = `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`;
      const { data } = await axios.get(url);
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const triggerPrintReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const s = summary || { totalSales: 0, totalTax: 0, totalDiscount: 0, totalCoupon: 0, totalRedeemedLoyalty: 0, totalTransactions: 0, netProfit: 0 };

  // Category charts configuration
  const categoryChartData = {
    labels: ['Groceries', 'Beverages', 'Dairy', 'Personal Care', 'Snacks', 'Baby Care'],
    datasets: [
      {
        data: [42, 28, 19, 14, 21, 10],
        backgroundColor: [
          '#2563EB',
          '#16A34A',
          '#F59E0B',
          '#DC2626',
          '#8B5CF6',
          '#EC4899'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6 select-none">
      {/* Date Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-glass-border no-print">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
          <Calendar size={14} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-glass-border bg-white/40 outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-glass-border bg-white/40 outline-none"
          />
        </div>

        <button
          onClick={triggerPrintReport}
          className="bg-accent-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          <Printer size={16} />
          Print Sales Summary
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Gross Sales Volume</p>
            <h3 className="text-xl font-bold font-heading text-text-primary mt-1">₹{s.totalSales.toFixed(2)}</h3>
          </div>
          <div className="bg-blue-500/10 text-accent-primary p-3.5 rounded-xl">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Net Earnings</p>
            <h3 className="text-xl font-bold font-heading text-text-primary mt-1">₹{s.netProfit.toFixed(2)}</h3>
          </div>
          <div className="bg-green-500/10 text-accent-success p-3 rounded-xl">
            <TrendingUp size={18} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Taxes Collected (GST)</p>
            <h3 className="text-xl font-bold font-heading text-text-primary mt-1">₹{s.totalTax.toFixed(2)}</h3>
          </div>
          <div className="bg-amber-500/10 text-accent-warning p-3 rounded-xl">
            <Coins size={18} />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Discounts Issued</p>
            <h3 className="text-xl font-bold font-heading text-text-primary mt-1">₹{(s.totalDiscount + s.totalCoupon).toFixed(2)}</h3>
          </div>
          <div className="bg-red-500/10 text-accent-danger p-3 rounded-xl">
            <Scissors size={18} />
          </div>
        </div>
      </div>

      {/* Reports charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution Doughnut */}
        <div className="glass-card p-5 rounded-3xl border border-glass-border">
          <h3 className="text-sm font-semibold font-heading text-text-primary mb-4">Category Sales Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Detailed breakdowns list */}
        <div className="lg:col-span-2 glass-card p-5 rounded-3xl border border-glass-border">
          <h3 className="text-sm font-semibold font-heading text-text-primary mb-4">Detailed Financial Statement</h3>
          <div className="space-y-4 text-xs font-semibold text-text-secondary">
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span>Total Transactions processed:</span>
              <span className="text-text-primary font-bold">{s.totalTransactions} Invoices</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span>Product Level discounts applied:</span>
              <span className="text-accent-danger">-₹{s.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span>Promo coupon codes savings:</span>
              <span className="text-accent-danger">-₹{s.totalCoupon.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span>Loyalty Points Cash equivalency redeemed:</span>
              <span className="text-accent-danger">-₹{s.totalRedeemedLoyalty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-glass-border">
              <span>Gross Tax levies:</span>
              <span className="text-text-primary">₹{s.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-text-primary font-bold text-sm">
              <span>Net Revenue:</span>
              <span className="text-accent-primary font-heading font-extrabold text-base">₹{s.netProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
