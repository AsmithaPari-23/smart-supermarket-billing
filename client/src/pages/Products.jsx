import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Tag, 
  Barcode, 
  PackageCheck, 
  X,
  Package,
  Layers,
  Sparkles,
  Filter
} from 'lucide-react';

const Products = () => {
  const { isManager, isAdmin } = useAuth();
  
  // Products Listing state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('Add'); // Add or Edit
  const [selectedId, setSelectedId] = useState('');
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    supplier: '',
    mrp: 0,
    sellingPrice: 0,
    gst: 0,
    discount: 0,
    stock: 0,
    expiryDate: '',
    manufacturingDate: '',
    status: 'Active'
  });
  const [formError, setFormError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = `/api/products?search=${search}&category=${category}`;
      const { data } = await axios.get(url);
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category]);

  const handleOpenAdd = () => {
    setModalMode('Add');
    setFormData({
      barcode: '',
      name: '',
      category: '',
      supplier: '',
      mrp: 0,
      sellingPrice: 0,
      gst: 0,
      discount: 0,
      stock: 0,
      expiryDate: '',
      manufacturingDate: '',
      status: 'Active'
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('Edit');
    setSelectedId(product._id);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      supplier: product.supplier || '',
      mrp: product.mrp,
      sellingPrice: product.sellingPrice,
      gst: product.gst,
      discount: product.discount,
      stock: product.stock,
      expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
      manufacturingDate: product.manufacturingDate ? product.manufacturingDate.slice(0, 10) : '',
      status: product.status
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (modalMode === 'Add') {
        const { data } = await axios.post('/api/products', formData);
        if (data.success) {
          alert('Product added successfully!');
          setShowModal(false);
          fetchProducts();
        }
      } else {
        const { data } = await axios.put(`/api/products/${selectedId}`, formData);
        if (data.success) {
          alert('Product updated successfully!');
          setShowModal(false);
          fetchProducts();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const { data } = await axios.delete(`/api/products/${id}`);
      if (data.success) {
        alert('Product deleted successfully');
        fetchProducts();
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  return (
    <div className="space-y-6 select-none pb-6">
      {/* Action & Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-[20px] border border-brand-border">
        <div className="flex flex-wrap items-center gap-3 w-full max-w-2xl">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog by product name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-border bg-white focus:border-brand-primary outline-none text-xs font-semibold text-brand-dark shadow-sm"
            />
          </div>

          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary shadow-sm"
            >
              <option value="">All Supermarket Categories</option>
              <option value="Dairy">🥛 Dairy</option>
              <option value="Beverages">🥤 Beverages</option>
              <option value="Groceries">🌾 Groceries</option>
              <option value="Baby Care">👶 Baby Care</option>
              <option value="Snacks">🍿 Snacks</option>
              <option value="Personal Care">🧼 Personal Care</option>
            </select>
          </div>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto glass-btn-primary py-2.5 px-5 text-xs font-bold flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add New Product
          </button>
        )}
      </div>

      {/* Catalog Table Container */}
      <div className="glass-card p-5 rounded-[20px] border border-brand-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-brand-muted">Loading Catalog Products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <Package size={36} className="mx-auto text-brand-muted opacity-40" />
            <p className="text-sm font-bold text-brand-dark">No products found matching filters.</p>
            <p className="text-xs text-brand-muted">Try clearing search term or select another category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                  <th className="pb-3 px-2">EAN Barcode</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-center">Stock Level</th>
                  <th className="pb-3 text-right">MRP (₹)</th>
                  <th className="pb-3 text-right">Sale Price (₹)</th>
                  <th className="pb-3 text-center">GST Rate</th>
                  <th className="pb-3 text-center">Status</th>
                  {isManager && <th className="pb-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs font-medium text-brand-muted">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-brand-dark font-bold">{p.barcode}</td>
                    <td className="py-3.5 text-brand-dark font-bold">{p.name}</td>
                    <td className="py-3.5 text-brand-dark">
                      <span className="bg-brand-bg border border-brand-border px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        p.stock === 0 
                          ? 'bg-brand-danger/15 text-brand-danger border border-brand-danger/30' 
                          : p.stock <= 10 
                          ? 'bg-brand-warning/15 text-brand-dark border border-brand-warning/30' 
                          : 'bg-brand-success/15 text-brand-success border border-brand-success/30'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-medium">₹{p.mrp.toFixed(2)}</td>
                    <td className="py-3.5 text-right text-brand-primary font-bold text-sm">₹{p.sellingPrice.toFixed(2)}</td>
                    <td className="py-3.5 text-center font-semibold">{p.gst}%</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'Active' ? 'bg-brand-success/15 text-brand-success' : 'bg-brand-muted/15 text-brand-muted'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    {isManager && (
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 bg-brand-bg hover:bg-brand-primary/10 text-brand-dark hover:text-brand-primary rounded-xl transition border border-brand-border"
                            title="Edit Product"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="p-1.5 bg-brand-bg hover:bg-brand-danger/10 text-brand-dark hover:text-brand-danger rounded-xl transition border border-brand-border"
                              title="Delete Product"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-brand-dark/40 backdrop-blur-md z-50 p-4">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-[20px] w-full max-w-2xl border border-brand-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-brand-border pb-3">
              <h3 className="font-bold text-base text-brand-dark flex items-center gap-2">
                <Package size={18} className="text-brand-primary" /> {modalMode} Catalog Product
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-brand-muted hover:text-brand-dark p-1 rounded-xl">
                <X size={20} />
              </button>
            </div>

            {formError && <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold rounded-xl text-center">{formError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">EAN Barcode *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                    <Barcode size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="EAN-13 barcode number..."
                    className="w-full pl-9 pr-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fresh Organic Apples 1kg..."
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
                >
                  <option value="">Select Category</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Baby Care">Baby Care</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Personal Care">Personal Care</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name..."
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">MRP (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">GST Tax (%) *</label>
                <select
                  required
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Discount (%)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Starting Stock *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Manufacturing Date</label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 bg-white border border-brand-border hover:bg-brand-bg text-brand-dark py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 glass-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                {modalMode === 'Add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Products;
