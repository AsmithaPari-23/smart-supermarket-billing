import React, { useState } from 'react';
import axios from 'axios';
import {
  Search,
  UserPlus,
  Award,
  Calendar,
  MapPin,
  Mail,
  Phone,
  TrendingUp,
  History,
  Sparkles,
  Percent,
  UserCheck,
  CreditCard,
  Crown
} from 'lucide-react';

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Registration Form State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ name: '', phone: '', email: '', address: '', dob: '' });
  const [regError, setRegError] = useState('');

  // Search handles
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const { data } = await axios.get(`/api/customers/search?q=${searchQuery}`);
      if (data.success) {
        setSearchResults(data.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectCustomer = async (id) => {
    try {
      const { data } = await axios.get(`/api/customers/${id}`);
      if (data.success) {
        setSelectedCustomer(data);
        setSearchResults([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    if (!regForm.name || !regForm.phone) {
      setRegError('Name and Phone number are required');
      return;
    }
    try {
      const { data } = await axios.post('/api/customers/register', regForm);
      if (data.success) {
        alert('Customer registered successfully!');
        setShowRegModal(false);
        setRegForm({ name: '', phone: '', email: '', address: '', dob: '' });
        // Automatically select the new customer
        selectCustomer(data.customer._id);
      }
    } catch (err) {
      setRegError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Search & Register Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-[20px] border border-brand-border">
        <div className="relative w-full max-w-lg flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search CRM by phone number or customer name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary shadow-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-sm"
          >
            Search
          </button>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="w-full sm:w-auto glass-btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          Register Customer
        </button>
      </div>

      {/* Search results dropdown panel */}
      {searchResults.length > 0 && (
        <div className="glass-card p-4 rounded-[20px] border border-brand-border divide-y divide-brand-border/60 space-y-2">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider px-2 py-1">Matched CRM Records</h3>
          {searchResults.map((cust) => (
            <div
              key={cust._id}
              onClick={() => selectCustomer(cust._id)}
              className="p-3 hover:bg-brand-primary/5 rounded-xl flex justify-between items-center cursor-pointer transition"
            >
              <div>
                <p className="text-brand-dark font-bold text-sm">{cust.name}</p>
                <p className="text-xs text-brand-muted mt-0.5">{cust.phone} | Membership ID: {cust.membershipId}</p>
              </div>
              <span className="text-brand-primary font-bold text-xs bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                {cust.tier} Tier
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Selected Customer profile detail panel */}
      {selectedCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Customer Profile details */}
          <div className="glass-card p-6 rounded-[20px] border border-brand-border space-y-6">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full text-white font-bold text-2xl flex items-center justify-center shadow-primary mx-auto">
                {selectedCustomer.customer.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-bold text-lg text-brand-dark leading-tight">{selectedCustomer.customer.name}</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary bg-brand-primary/10 px-3.5 py-1 rounded-full border border-brand-primary/20">
                <Crown size={14} className="text-brand-gold" />
                {selectedCustomer.customer.tier} Tier Member
              </span>
            </div>

            <div className="space-y-3.5 border-t border-brand-border pt-4 text-xs font-semibold text-brand-muted">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-brand-primary" />
                <span>{selectedCustomer.customer.phone}</span>
              </div>
              {selectedCustomer.customer.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-brand-primary" />
                  <span>{selectedCustomer.customer.email}</span>
                </div>
              )}
              {selectedCustomer.customer.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-brand-primary" />
                  <span>{selectedCustomer.customer.address}</span>
                </div>
              )}
              {selectedCustomer.customer.dob && (
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-brand-primary" />
                  <span>DOB: {new Date(selectedCustomer.customer.dob).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="bg-brand-bg/80 border border-brand-border p-4 rounded-2xl flex justify-between items-center text-center">
              <div>
                <p className="text-[10px] font-bold text-brand-muted uppercase">Loyalty Balance</p>
                <h4 className="text-xl font-extrabold text-brand-primary mt-1">{selectedCustomer.customer.loyaltyPoints} pts</h4>
              </div>
              <div className="h-8 border-l border-brand-border"></div>
              <div>
                <p className="text-[10px] font-bold text-brand-muted uppercase">Member ID</p>
                <h4 className="text-sm font-bold font-mono text-brand-dark mt-1.5">{selectedCustomer.customer.membershipId}</h4>
              </div>
            </div>
          </div>

          {/* Column 2: Spending Analytics & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase insights overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-[20px] border border-brand-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase">Total Transactions</p>
                <h3 className="text-xl font-extrabold text-brand-dark mt-1">{selectedCustomer.history.totalBills} Bills</h3>
              </div>
              <div className="glass-card p-4 rounded-[20px] border border-brand-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase">Avg Invoice Size</p>
                <h3 className="text-xl font-extrabold text-brand-dark mt-1">₹{selectedCustomer.insights.averageBillValue || 0}</h3>
              </div>
              <div className="glass-card p-4 rounded-[20px] border border-brand-border">
                <p className="text-[10px] font-bold text-brand-muted uppercase">Favorite Category</p>
                <h3 className="text-xl font-extrabold text-brand-primary mt-1">{selectedCustomer.insights.favoriteCategory || 'N/A'}</h3>
              </div>
            </div>

            {/* AI Engine Offer recommendations */}
            <div className="bg-gradient-to-br from-brand-gold/10 via-brand-primary/5 to-transparent border border-brand-gold/30 p-5 rounded-[20px] space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-dark uppercase tracking-wider">
                <Sparkles size={16} className="text-brand-gold animate-pulse" />
                Personalized AI Offer Engine
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCustomer.offers.map((off, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl border border-brand-border space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-success">
                        <Percent size={14} />
                        {off.name}
                      </div>
                      <p className="text-[11px] font-medium text-brand-muted mt-1">{off.description}</p>
                    </div>
                    <div className="text-[10px] text-brand-muted border-t border-brand-border pt-2 mt-2 font-semibold">
                      Target Category: {off.targetCategory || 'Storewide'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase History table */}
            <div className="glass-card p-5 rounded-[20px] border border-brand-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-brand-dark">
                  <History size={18} className="text-brand-primary" />
                  Customer Purchase History
                </div>
                <span className="text-[10px] text-brand-muted font-mono">{selectedCustomer.history.bills.length} Invoices logged</span>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                      <th className="pb-3">Bill Number</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/60 text-xs font-medium text-brand-muted">
                    {selectedCustomer.history.bills.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-brand-muted">No past purchases recorded.</td>
                      </tr>
                    ) : (
                      selectedCustomer.history.bills.map((b) => (
                        <tr key={b._id} className="hover:bg-brand-primary/5 transition-colors">
                          <td className="py-3 text-brand-dark font-mono font-bold">{b.billNumber}</td>
                          <td className="py-3 text-brand-dark">{b.paymentMethod}</td>
                          <td className="py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right text-brand-primary font-bold">₹{b.grandTotal.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-20 rounded-[20px] border border-brand-border text-center text-brand-muted font-medium text-sm space-y-2">
          <UserCheck size={36} className="mx-auto text-brand-primary opacity-50" />
          <p className="font-bold text-brand-dark">Search CRM Customer Profile</p>
          <p className="text-xs">Search by phone number or register a new supermarket membership profile above.</p>
        </div>
      )}

      {/* Register Customer Modal */}
      {showRegModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-brand-dark/40 backdrop-blur-md z-50 p-4">
          <form onSubmit={handleRegister} className="glass-panel p-6 rounded-[20px] w-full max-w-md border border-brand-border shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-brand-dark flex items-center gap-2 border-b border-brand-border pb-3">
              <UserPlus size={18} className="text-brand-primary" /> Register New Customer Membership
            </h3>

            {regError && <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold rounded-xl text-center">{regError}</div>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Full Name *</label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="Enter customer full name..."
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Phone Number *</label>
              <input
                type="text"
                required
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                placeholder="10-digit phone number..."
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Email Address (Optional)</label>
              <input
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                placeholder="customer@example.com..."
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Residential Address (Optional)</label>
              <input
                type="text"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                placeholder="City, Area street..."
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Date of Birth (Optional)</label>
              <input
                type="date"
                value={regForm.dob}
                onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex gap-3 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="w-1/2 bg-white border border-brand-border hover:bg-brand-bg text-brand-dark py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 glass-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                Register Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
