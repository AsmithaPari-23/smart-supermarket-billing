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
  Printer,
  PieChart,
  FileSpreadsheet
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
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-brand-muted">Generating Supermarket Financial Reports...</p>
      </div>
    );
  }

  const s = summary || { totalSales: 0, totalTax: 0, totalDiscount: 0, totalCoupon: 0, totalRedeemedLoyalty: 0, totalTransactions: 0, netProfit: 0 };

  // Category charts configuration (Brand themed)
  const categoryChartData = {
    labels: ['Groceries', 'Beverages', 'Dairy', 'Personal Care', 'Snacks', 'Baby Care'],
    datasets: [
      {
        data: [42, 28, 19, 14, 21, 10],
        backgroundColor: [
          '#1F8A5B',
          '#2EA66D',
          '#FFC857',
          '#22C55E',
          '#F59E0B',
          '#EF4444'
        ],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }
    ]
  };

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Date Filters & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-[20px] border border-brand-border no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-dark">
          <Calendar size={16} className="text-brand-primary" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
          />
          <span className="text-brand-muted font-normal">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
          />
        </div>

        <button
          onClick={triggerPrintReport}
          className="glass-btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2"
        >
          <Printer size={16} />
          Print Executive Sales Summary
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center justify-between hover:shadow-glassHover transition">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Gross Sales Volume</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">₹{s.totalSales.toFixed(2)}</h3>
          </div>
          <div className="bg-brand-primary/10 text-brand-primary p-4 rounded-2xl border border-brand-primary/20">
            <IndianRupee size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center justify-between hover:shadow-glassHover transition">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Net Profit Earnings</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">₹{s.netProfit.toFixed(2)}</h3>
          </div>
          <div className="bg-brand-secondary/10 text-brand-secondary p-4 rounded-2xl border border-brand-secondary/20">
            <TrendingUp size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center justify-between hover:shadow-glassHover transition">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Taxes Collected (GST)</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">₹{s.totalTax.toFixed(2)}</h3>
          </div>
          <div className="bg-brand-gold/15 text-brand-dark p-4 rounded-2xl border border-brand-gold/30">
            <Coins size={22} className="stroke-[2.5]" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center justify-between hover:shadow-glassHover transition">
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Discounts Issued</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-1">₹{(s.totalDiscount + s.totalCoupon).toFixed(2)}</h3>
          </div>
          <div className="bg-brand-danger/10 text-brand-danger p-4 rounded-2xl border border-brand-danger/20">
            <Scissors size={22} className="stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Reports charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution Doughnut */}
        <div className="glass-card p-5 rounded-[20px] border border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
              <PieChart size={16} className="text-brand-primary" /> Category Breakdown
            </h3>
            <span className="text-[10px] text-brand-muted font-semibold">% Sales Share</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* Detailed breakdowns list */}
        <div className="lg:col-span-2 glass-card p-5 rounded-[20px] border border-brand-border">
          <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
            <h3 className="text-sm font-bold text-brand-dark flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand-primary" /> Supermarket Financial Statement
            </h3>
            <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full">Official Audit</span>
          </div>
          <div className="space-y-3.5 text-xs font-semibold text-brand-muted">
            <div className="flex justify-between items-center py-2 border-b border-brand-border/60">
              <span>Total Checkout Transactions Processed:</span>
              <span className="text-brand-dark font-extrabold">{s.totalTransactions} Invoices</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/60">
              <span>Product Level Catalog Discounts:</span>
              <span className="text-brand-danger font-bold">-₹{s.totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/60">
              <span>Promo Code Coupons Applied:</span>
              <span className="text-brand-danger font-bold">-₹{s.totalCoupon.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/60">
              <span>Loyalty Points Cash Equivalency Redeemed:</span>
              <span className="text-brand-danger font-bold">-₹{s.totalRedeemedLoyalty.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-brand-border/60">
              <span>Gross Tax Levies (GST Rate):</span>
              <span className="text-brand-dark font-bold">₹{s.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-brand-dark font-extrabold text-sm pt-2">
              <span>Net Sales Profit Revenue:</span>
              <span className="text-brand-primary font-bold text-lg">₹{s.netProfit.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
