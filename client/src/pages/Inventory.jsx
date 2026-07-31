import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  PlusCircle, 
  History, 
  ArrowUpRight, 
  ArrowDownRight, 
  ClipboardList,
  Package,
  Layers,
  Clock,
  CheckCircle2
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
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-brand-muted">Loading Inventory Logs & Alerts...</p>
      </div>
    );
  }

  const stats = overview?.stats || { lowStockCount: 0, expiringItemsCount: 0, outOfStockCount: 0 };
  const lowStockItems = overview?.lowStockItems || [];
  const expiringItems = overview?.expiringItems || [];

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Overview Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center gap-4 hover:shadow-glassHover transition">
          <div className={`p-3.5 rounded-2xl ${stats.lowStockCount > 0 ? 'bg-brand-danger/15 text-brand-danger animate-pulse border border-brand-danger/30' : 'bg-brand-success/15 text-brand-success'}`}>
            <AlertTriangle size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Low Stock Indicators</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-0.5">{stats.lowStockCount} Products</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center gap-4 hover:shadow-glassHover transition">
          <div className="bg-brand-gold/20 text-brand-dark p-3.5 rounded-2xl border border-brand-gold/40">
            <Clock size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Expiring in 30 days</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-0.5">{stats.expiringItemsCount} Products</h3>
          </div>
        </div>

        <div className="glass-card p-5 rounded-[20px] border border-brand-border flex items-center gap-4 hover:shadow-glassHover transition">
          <div className={`p-3.5 rounded-2xl ${stats.outOfStockCount > 0 ? 'bg-brand-danger/15 text-brand-danger border border-brand-danger/30' : 'bg-brand-success/15 text-brand-success'}`}>
            <Package size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Out of Stock</p>
            <h3 className="text-2xl font-extrabold text-brand-dark mt-0.5">{stats.outOfStockCount} Products</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Side: Restock Stock Form */}
        <div className="glass-card p-5 rounded-[20px] border border-brand-border h-fit">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-4 border-b border-brand-border pb-3">
            <PlusCircle size={18} className="text-brand-primary" />
            Stock Adjustments Form
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            {formError && <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold rounded-xl text-center">{formError}</div>}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Select Product *</label>
              <select
                required
                value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
              >
                <option value="">Choose Catalog Item</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (BC: {p.barcode} | Stock: {p.stock})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase block">Adjust Type *</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
                >
                  <option value="Restock">Restock (+)</option>
                  <option value="Damage">Damage (-)</option>
                  <option value="Adjustment">Adjustment (+/-)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase block">Quantity *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase block">Adjustment Notes</label>
              <input
                type="text"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="Shipment batch, damage details..."
                className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full glass-btn-primary py-2.5 text-xs font-bold transition flex items-center justify-center gap-2"
            >
              Post Stock Adjustment
            </button>
          </form>
        </div>

        {/* Right Side: Stock Transaction Log */}
        <div className="xl:col-span-2 glass-card p-5 rounded-[20px] border border-brand-border flex flex-col h-[400px]">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-4 border-b border-brand-border pb-3">
            <History size={18} className="text-brand-primary" />
            Supermarket Stock Transaction Ledger
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3">Performed By</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs font-medium text-brand-muted">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-brand-muted">No inventory adjustments logged yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isPositive = log.quantity > 0;
                    return (
                      <tr key={log._id} className="hover:bg-brand-primary/5 transition-colors">
                        <td className="py-3">
                          <p className="text-brand-dark font-bold">{log.productId?.name || 'Unknown item'}</p>
                          <p className="text-[10px] text-brand-muted font-mono mt-0.5">BC: {log.productId?.barcode}</p>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            log.type === 'Restock' 
                              ? 'bg-brand-success/15 text-brand-success' 
                              : log.type === 'Sale'
                              ? 'bg-brand-primary/10 text-brand-primary'
                              : 'bg-brand-danger/15 text-brand-danger'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`flex items-center justify-center gap-0.5 font-bold ${isPositive ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {Math.abs(log.quantity)}
                          </span>
                        </td>
                        <td className="py-3">
                          <p className="text-brand-dark font-semibold">{log.performedBy?.name}</p>
                          <p className="text-[10px] text-brand-muted">{log.performedBy?.role}</p>
                        </td>
                        <td className="py-3 text-right text-brand-muted">{new Date(log.createdAt).toLocaleDateString()}</td>
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
        <div className="glass-card p-5 rounded-[20px] border border-brand-border">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-brand-danger" /> Low Stock Warning Checklist
          </h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-brand-muted font-medium">All active products have adequate stock levels.</p>
            ) : (
              lowStockItems.map(item => (
                <div key={item._id} className="flex justify-between items-center bg-brand-bg/80 border border-brand-border p-3.5 rounded-2xl">
                  <div>
                    <h4 className="text-xs font-bold text-brand-dark">{item.name}</h4>
                    <p className="text-[10px] text-brand-muted mt-0.5">Category: {item.category} | EAN: {item.barcode}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-brand-danger bg-brand-danger/15 px-3 py-1 rounded-full border border-brand-danger/30">
                      Stock: {item.stock} units
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiry alerts warnings */}
        <div className="glass-card p-5 rounded-[20px] border border-brand-border">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={16} className="text-brand-warning" /> Upcoming Product Expirations
          </h3>
          <div className="space-y-3">
            {expiringItems.length === 0 ? (
              <p className="text-xs text-brand-muted font-medium">No active products are expiring in the next 30 days.</p>
            ) : (
              expiringItems.map(item => {
                const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={item._id} className="flex justify-between items-center bg-brand-bg/80 border border-brand-border p-3.5 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">{item.name}</h4>
                      <p className="text-[10px] text-brand-muted mt-0.5">Expiry Date: {new Date(item.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        daysLeft <= 7 
                          ? 'bg-brand-danger/15 text-brand-danger border-brand-danger/30 animate-pulse' 
                          : 'bg-brand-warning/15 text-brand-dark border-brand-warning/30'
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
