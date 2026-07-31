import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  Shield, 
  Power, 
  Users as UsersIcon, 
  Lock 
} from 'lucide-react';

const Users = () => {
  const { isAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'Cashier' });
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/users');
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.username || !form.password || !form.name) {
      setFormError('Please fill in all details');
      return;
    }

    try {
      const { data } = await axios.post('/api/users', form);
      if (data.success) {
        alert('Staff account created successfully!');
        setForm({ username: '', password: '', name: '', role: 'Cashier' });
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error creating user account');
    }
  };

  const handleToggleActive = async (id, name) => {
    if (!window.confirm(`Are you sure you want to change the active status for ${name}?`)) return;
    try {
      const { data } = await axios.put(`/api/users/${id}/toggle`);
      if (data.success) {
        alert(data.message);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-card p-12 text-center rounded-[20px] border border-brand-border space-y-3">
        <Shield size={48} className="mx-auto text-brand-danger stroke-[1.5]" />
        <h3 className="font-bold text-base text-brand-dark">Unauthorized Access</h3>
        <p className="text-xs text-brand-muted">Only Supermarket Administrators are permitted to manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none pb-6">
      {/* Left side Create Form */}
      <div className="glass-card p-5 rounded-[20px] border border-brand-border h-fit">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-4 border-b border-brand-border pb-3">
          <UserPlus size={18} className="text-brand-primary" />
          Create Staff Account
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold rounded-xl text-center">{formError}</div>}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase block">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name..."
              className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase block">Login Username *</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              placeholder="username..."
              className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase block">Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Temporary password..."
                className="w-full pl-9 pr-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-semibold text-brand-dark outline-none focus:border-brand-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase block">ERP Role Permission *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3.5 py-2 border border-brand-border rounded-xl bg-white text-xs font-bold text-brand-dark outline-none focus:border-brand-primary"
            >
              <option value="Cashier">Cashier</option>
              <option value="Manager">Manager</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full glass-btn-primary py-2.5 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            Create Staff Profile
          </button>
        </form>
      </div>

      {/* Right side Active Accounts list */}
      <div className="lg:col-span-2 glass-card p-5 rounded-[20px] border border-brand-border">
        <div className="flex items-center gap-2 text-sm font-bold text-brand-dark mb-4 border-b border-brand-border pb-3">
          <UsersIcon size={18} className="text-brand-primary" />
          Active Staff Accounts List
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="h-9 w-9 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-brand-muted">Loading System Accounts...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs font-medium text-brand-muted">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="py-3.5 text-brand-dark font-bold">{u.name}</td>
                    <td className="py-3.5 font-mono text-brand-dark">{u.username}</td>
                    <td className="py-3.5 font-bold text-brand-primary">{u.role}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        u.active 
                          ? 'bg-brand-success/15 text-brand-success' 
                          : 'bg-brand-danger/15 text-brand-danger'
                      }`}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(u._id, u.name)}
                        className={`p-1.5 rounded-xl border transition ${
                          u.active 
                            ? 'bg-brand-danger/10 text-brand-danger border-brand-danger/25 hover:bg-brand-danger hover:text-white' 
                            : 'bg-brand-success/10 text-brand-success border-brand-success/25 hover:bg-brand-success hover:text-white'
                        }`}
                        title={u.active ? 'Deactivate user' : 'Activate user'}
                      >
                        <Power size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
