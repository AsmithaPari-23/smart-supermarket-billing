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
  X 
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
    <div className="space-y-6 select-none">
      {/* Action Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-glass-border">
        <div className="flex flex-wrap items-center gap-3 w-full max-w-2xl">
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-glass-border bg-white/40 focus:bg-white/80 focus:border-accent-primary outline-none text-xs font-semibold"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-glass-border bg-white/40 text-xs font-semibold outline-none focus:bg-white"
          >
            <option value="">All Categories</option>
            <option value="Dairy">Dairy</option>
            <option value="Beverages">Beverages</option>
            <option value="Groceries">Groceries</option>
            <option value="Baby Care">Baby Care</option>
            <option value="Snacks">Snacks</option>
            <option value="Personal Care">Personal Care</option>
          </select>
        </div>

        {isManager && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto bg-accent-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/10"
          >
            <Plus size={16} />
            Add New Product
          </button>
        )}
      </div>

      {/* Catalog Table */}
      <div className="glass-card p-5 rounded-3xl border border-glass-border overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <p className="py-20 text-center text-text-secondary/50 font-medium text-sm">No products found matching filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="pb-3">Barcode</th>
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3 text-center">Stock</th>
                  <th className="pb-3 text-right">MRP</th>
                  <th className="pb-3 text-right">Sale Price</th>
                  <th className="pb-3 text-center">GST%</th>
                  <th className="pb-3 text-center">Status</th>
                  {isManager && <th className="pb-3 text-center w-24">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-xs font-medium text-text-secondary">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-white/10 transition-colors">
                    <td className="py-3.5 font-mono text-text-primary font-semibold">{p.barcode}</td>
                    <td className="py-3.5 text-text-primary font-bold">{p.name}</td>
                    <td className="py-3.5">{p.category}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        p.stock === 0 
                          ? 'bg-red-500/10 text-accent-danger border border-red-500/20' 
                          : p.stock <= 10 
                          ? 'bg-amber-500/10 text-accent-warning border border-amber-500/20' 
                          : 'bg-green-500/10 text-accent-success border border-green-500/20'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 text-right">₹{p.mrp.toFixed(2)}</td>
                    <td className="py-3.5 text-right text-accent-primary font-extrabold">₹{p.sellingPrice.toFixed(2)}</td>
                    <td className="py-3.5 text-center">{p.gst}%</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        p.status === 'Active' ? 'bg-green-500/10 text-accent-success' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    {isManager && (
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 hover:bg-glass-hover text-text-secondary hover:text-accent-primary rounded-lg transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(p._id)}
                              className="p-1 hover:bg-glass-hover text-text-secondary hover:text-accent-danger rounded-lg transition"
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-3xl w-full max-w-2xl border border-glass-border shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-base text-text-primary">{modalMode} Catalog Product</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-accent-danger text-xs font-semibold rounded-lg text-center">{formError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">EAN Barcode *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
                    <Barcode size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="EAN-13 number..."
                    className="w-full pl-9 pr-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Fresh Apples..."
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
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
                <label className="text-[10px] font-bold text-text-secondary uppercase">Supplier</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Supplier name..."
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">MRP (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">GST Tax (%) *</label>
                <select
                  required
                  value={formData.gst}
                  onChange={(e) => setFormData({ ...formData, gst: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Discount (%)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Starting Stock *</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Manufacturing Date</label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-secondary uppercase">Status *</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 bg-white/50 border border-glass-border hover:bg-glass-hover text-text-primary py-2.5 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-accent-primary hover:bg-blue-600 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/10"
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
