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
  Percent
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
    <div className="space-y-6 select-none">
      {/* Search and Register Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-glass-border">
        <div className="relative w-full max-w-md flex gap-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CRM by phone number or name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-glass-border bg-white/40 focus:bg-white/80 focus:border-accent-primary outline-none transition text-sm font-semibold"
          />
          <button
            onClick={handleSearch}
            className="bg-accent-primary hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-xs"
          >
            Search
          </button>
        </div>

        <button
          onClick={() => setShowRegModal(true)}
          className="w-full sm:w-auto bg-accent-success hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-green-500/10"
        >
          <UserPlus size={16} />
          Register Customer
        </button>
      </div>

      {/* Search results dropdown panel */}
      {searchResults.length > 0 && (
        <div className="glass-card p-3 rounded-2xl border border-glass-border divide-y divide-glass-border space-y-2">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-2 py-1">Matched CRM Records</h3>
          {searchResults.map((cust) => (
            <div
              key={cust._id}
              onClick={() => selectCustomer(cust._id)}
              className="p-3 hover:bg-glass-hover rounded-xl flex justify-between items-center cursor-pointer transition"
            >
              <div>
                <p className="text-text-primary font-bold text-sm">{cust.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{cust.phone} | Membership ID: {cust.membershipId}</p>
              </div>
              <span className="text-accent-primary font-semibold text-xs bg-blue-500/10 px-2 py-1 rounded-lg">
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
          <div className="glass-card p-5 rounded-3xl border border-glass-border space-y-6">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white font-heading font-semibold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto">
                {selectedCustomer.customer.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-heading font-bold text-lg text-text-primary leading-tight">{selectedCustomer.customer.name}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-accent-primary bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/25">
                <Award size={14} />
                {selectedCustomer.customer.tier} Member
              </span>
            </div>

            <div className="space-y-3.5 border-t border-glass-border pt-4 text-xs font-semibold text-text-secondary">
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-accent-primary" />
                <span>{selectedCustomer.customer.phone}</span>
              </div>
              {selectedCustomer.customer.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={16} className="text-accent-primary" />
                  <span>{selectedCustomer.customer.email}</span>
                </div>
              )}
              {selectedCustomer.customer.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={16} className="text-accent-primary" />
                  <span>{selectedCustomer.customer.address}</span>
                </div>
              )}
              {selectedCustomer.customer.dob && (
                <div className="flex items-center gap-2.5">
                  <Calendar size={16} className="text-accent-primary" />
                  <span>DOB: {new Date(selectedCustomer.customer.dob).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="bg-white/40 border border-glass-border p-4 rounded-2xl flex justify-between items-center text-center">
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase">Loyalty Balance</p>
                <h4 className="text-lg font-extrabold text-accent-primary font-heading mt-1">{selectedCustomer.customer.loyaltyPoints} pts</h4>
              </div>
              <div className="h-8 border-l border-glass-border"></div>
              <div>
                <p className="text-[10px] font-bold text-text-secondary uppercase">Member ID</p>
                <h4 className="text-sm font-bold font-mono text-text-primary mt-2">{selectedCustomer.customer.membershipId}</h4>
              </div>
            </div>
          </div>

          {/* Column 2: Spending Analytics & History */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase insights overview cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-glass-border">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Total Transactions</p>
                <h3 className="text-xl font-bold font-heading text-text-primary mt-1">{selectedCustomer.history.totalBills} Bills</h3>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-glass-border">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Avg Invoice size</p>
                <h3 className="text-xl font-bold font-heading text-text-primary mt-1">₹{selectedCustomer.insights.averageBillValue || 0}</h3>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-glass-border">
                <p className="text-[10px] font-bold text-text-secondary uppercase">Favorite Section</p>
                <h3 className="text-xl font-bold font-heading text-accent-primary mt-1">{selectedCustomer.insights.favoriteCategory || 'N/A'}</h3>
              </div>
            </div>

            {/* AI Engine Offer recommendations */}
            <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-glass-border p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider font-heading">
                <Sparkles size={16} className="text-accent-primary animate-pulse" />
                AI Offer recommendation Engine
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCustomer.offers.map((off, idx) => (
                  <div key={idx} className="glass-card p-4 rounded-2xl border border-glass-border space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-accent-success">
                        <Percent size={14} />
                        {off.name}
                      </div>
                      <p className="text-[11px] font-medium text-text-secondary mt-1">{off.description}</p>
                    </div>
                    <div className="text-[10px] text-text-secondary/70 border-t border-glass-border pt-2 mt-2">
                      Target Section: {off.targetCategory || 'Storewide'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase History table */}
            <div className="glass-card p-5 rounded-3xl border border-glass-border">
              <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-4">
                <History size={18} className="text-text-secondary" />
                Invoice logs
              </div>
              <div className="overflow-x-auto max-h-60 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                      <th className="pb-3">Bill Number</th>
                      <th className="pb-3">Payment</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border text-xs font-medium text-text-secondary">
                    {selectedCustomer.history.bills.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-6 text-center">No purchases recorded.</td>
                      </tr>
                    ) : (
                      selectedCustomer.history.bills.map((b) => (
                        <tr key={b._id} className="hover:bg-white/10 transition-colors">
                          <td className="py-3 text-text-primary font-mono font-semibold">{b.billNumber}</td>
                          <td className="py-3">{b.paymentMethod}</td>
                          <td className="py-3">{new Date(b.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right text-text-primary font-bold">₹{b.grandTotal.toFixed(2)}</td>
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
        <div className="glass-card p-20 rounded-3xl border border-glass-border text-center text-text-secondary/50 font-medium text-sm">
          Please search for a customer or register a new membership profile.
        </div>
      )}

      {/* Register Customer Modal */}
      {showRegModal && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <form onSubmit={handleRegister} className="glass-panel p-6 rounded-3xl w-full max-w-md border border-glass-border shadow-2xl space-y-4">
            <h3 className="font-heading font-bold text-base text-text-primary">Register New Customer</h3>

            {regError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-accent-danger text-xs font-semibold rounded-lg text-center">{regError}</div>}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Full Name *</label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                placeholder="Full Name..."
                className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Phone Number *</label>
              <input
                type="text"
                required
                value={regForm.phone}
                onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                placeholder="Phone Number..."
                className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Email (Optional)</label>
              <input
                type="email"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                placeholder="Email..."
                className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Address (Optional)</label>
              <input
                type="text"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                placeholder="Address..."
                className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Date of Birth (Optional)</label>
              <input
                type="date"
                value={regForm.dob}
                onChange={(e) => setRegForm({ ...regForm, dob: e.target.value })}
                className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegModal(false)}
                className="w-1/2 bg-white/50 border border-glass-border hover:bg-glass-hover text-text-primary py-2 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-accent-success hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold transition"
              >
                Register
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
