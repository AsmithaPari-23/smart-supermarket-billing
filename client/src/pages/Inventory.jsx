import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  PlusCircle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  ClipboardList 
} from 'lucide-react';

const Inventory = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [products, setProducts] = useState([]);

  // Restock form state
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    quantity: 0,
    type: 'Restock',
    reason: ''
  });
  const [formError, setFormError] = useState('');

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      // Get Low Stock Stats
      const statRes = await axios.get('/api/inventory/overview');
      if (statRes.data.success) {
        setOverview(statRes.data);
      }

      // Get transaction history log
      const logRes = await axios.get('/api/inventory/history');
      if (logRes.data.success) {
        setLogs(logRes.data.logs);
      }

      // Get active product listing for restock options
      const prodRes = await axios.get('/api/products');
      if (prodRes.data.success) {
        setProducts(prodRes.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!adjustForm.productId || adjustForm.quantity <= 0) {
      setFormError('Please select a product and supply positive stock values.');
      return;
    }

    try {
      const { data } = await axios.post('/api/inventory/adjust', adjustForm);
      if (data.success) {
        alert('Stock adjusted successfully!');
        setAdjustForm({ productId: '', quantity: 0, type: 'Restock', reason: '' });
        fetchInventoryData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Stock adjustment failed.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = overview?.stats || { lowStockCount: 0, expiringItemsCount: 0, outOfStockCount: 0 };
  const lowStockItems = overview?.lowStockItems || [];
  const expiringItems = overview?.expiringItems || [];

  return (
    <div className="space-y-6 select-none">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center gap-4">
          <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-red-500/10 text-accent-danger animate-pulse' : 'bg-green-500/10 text-accent-success'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Low Stock Indicators</p>
            <h3 className="text-xl font-bold text-text-primary mt-0.5">{stats.lowStockCount} Products</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center gap-4">
          <div className="bg-amber-500/10 text-accent-warning p-3 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Expiring in 30 days</p>
            <h3 className="text-xl font-bold text-text-primary mt-0.5">{stats.expiringItemsCount} Products</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-glass-border flex items-center gap-4">
          <div className={`p-3 rounded-xl ${stats.outOfStockCount > 0 ? 'bg-red-500/10 text-accent-danger' : 'bg-green-500/10 text-accent-success'}`}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-secondary uppercase">Out of Stock</p>
            <h3 className="text-xl font-bold text-text-primary mt-0.5">{stats.outOfStockCount} Products</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Restock Stock Form */}
        <div className="glass-card p-5 rounded-3xl border border-glass-border h-fit">
          <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-4">
            <PlusCircle size={18} className="text-accent-primary" />
            Stock Adjustments Form
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-accent-danger text-xs font-semibold rounded-lg text-center">{formError}</div>}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase block">Select Product *</label>
              <select
                required
                value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              >
                <option value="">Choose Catalog item</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (BC: {p.barcode} | Stock: {p.stock})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase block">Adjust Type *</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
                >
                  <option value="Restock">Restock (+)</option>
                  <option value="Damage">Damage (-)</option>
                  <option value="Adjustment">Adjustment (+/-)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase block">Quantity *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase block">Adjustment Reason / Notes</label>
              <input
                type="text"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="Details of adjustment..."
                className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-accent-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Post Adjustment
            </button>
          </form>
        </div>

        {/* Right Side: Stock Transaction Log */}
        <div className="xl:col-span-2 glass-card p-5 rounded-3xl border border-glass-border flex flex-col h-[400px]">
          <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-4">
            <History size={18} className="text-text-secondary" />
            Stock transaction ledger
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3">Performed By</th>
                  <th className="pb-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-xs font-medium text-text-secondary">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">No inventory adjustments logged yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isPositive = log.quantity > 0;
                    return (
                      <tr key={log._id} className="hover:bg-white/10 transition-colors">
                        <td className="py-3">
                          <p className="text-text-primary font-bold">{log.productId?.name || 'Unknown item'}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5">BC: {log.productId?.barcode}</p>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            log.type === 'Restock' 
                              ? 'bg-green-500/10 text-accent-success' 
                              : log.type === 'Sale'
                              ? 'bg-blue-500/10 text-accent-primary'
                              : 'bg-red-500/10 text-accent-danger'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`flex items-center justify-center gap-0.5 font-bold ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(log.quantity)}
                          </span>
                        </td>
                        <td className="py-3">
                          <p className="text-text-primary">{log.performedBy?.name}</p>
                          <p className="text-[9px] text-text-secondary mt-0.5">{log.performedBy?.role}</p>
                        </td>
                        <td className="py-3 text-right">{new Date(log.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warning panels: items requiring immediate action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Catalogue warnings */}
        <div className="glass-card p-5 rounded-3xl border border-glass-border">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Low Stock Warning Checklist</h3>
          <div className="space-y-3.5">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-text-secondary font-medium">All active products have adequate stock levels.</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item._id} className="flex justify-between items-center bg-white/40 border border-glass-border p-3 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{item.name}</h4>
                    <p className="text-[9px] text-text-secondary mt-0.5">Category: {item.category} | EAN: {item.barcode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-accent-danger bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
                      Stock: {item.stock}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiry alerts warnings */}
        <div className="glass-card p-5 rounded-3xl border border-glass-border">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Upcoming Product Expirations</h3>
          <div className="space-y-3.5">
            {expiringItems.length === 0 ? (
              <p className="text-xs text-text-secondary font-medium">No active products are expiring in the next 30 days.</p>
            ) : (
              expiringItems.map(item => {
                const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={item._id} className="flex justify-between items-center bg-white/40 border border-glass-border p-3 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-text-primary">{item.name}</h4>
                      <p className="text-[9px] text-text-secondary mt-0.5">Expiry Date: {new Date(item.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        daysLeft <= 7 
                          ? 'bg-red-500/10 text-accent-danger border-red-500/20 animate-pulse' 
                          : 'bg-amber-500/10 text-accent-warning border-amber-500/20'
                      }`}>
                        {daysLeft} days left
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
