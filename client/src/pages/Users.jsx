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
      <div className="glass-card p-12 text-center border border-glass-border">
        <Shield size={48} className="mx-auto text-accent-danger mb-3 stroke-[1.5]" />
        <h3 className="font-heading font-bold text-sm text-text-primary">Unauthorized Access</h3>
        <p className="text-xs text-text-secondary mt-1">Only Administrators are allowed to manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
      {/* Left side Create Form */}
      <div className="glass-card p-5 rounded-3xl border border-glass-border h-fit">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-4 border-b border-glass-border pb-3">
          <UserPlus size={18} className="text-accent-primary" />
          Create Staff Account
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-accent-danger text-xs font-semibold rounded-lg text-center">{formError}</div>}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name..."
              className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Login Username *</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
              placeholder="Username..."
              className="w-full px-3.5 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
                <Lock size={14} />
              </span>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Temporary password..."
                className="w-full pl-9 pr-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-text-secondary uppercase">ERP Role Permission *</label>
            <select
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-glass-border rounded-xl bg-white/40 text-xs font-semibold outline-none focus:bg-white"
            >
              <option value="Cashier">Cashier</option>
              <option value="Manager">Manager</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-accent-primary hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs transition"
          >
            Create Staff Profile
          </button>
        </form>
      </div>

      {/* Right side Active Accounts list */}
      <div className="lg:col-span-2 glass-card p-5 rounded-3xl border border-glass-border">
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-text-primary mb-4 border-b border-glass-border pb-3">
          <UsersIcon size={18} className="text-text-secondary" />
          Active staff accounts list
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-xs font-bold text-text-secondary uppercase tracking-wider">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-xs font-medium text-text-secondary">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-white/10 transition-colors">
                    <td className="py-3.5 text-text-primary font-bold">{u.name}</td>
                    <td className="py-3.5 font-mono">{u.username}</td>
                    <td className="py-3.5 font-bold text-accent-primary">{u.role}</td>
                    <td className="py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                        u.active 
                          ? 'bg-green-500/10 text-accent-success' 
                          : 'bg-red-500/10 text-accent-danger'
                      }`}>
                        {u.active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 text-center">
                      <button
                        onClick={() => handleToggleActive(u._id, u.name)}
                        className={`p-1.5 rounded-lg border transition ${
                          u.active 
                            ? 'bg-red-500/10 text-accent-danger border-red-500/25 hover:bg-accent-danger hover:text-white' 
                            : 'bg-green-500/10 text-accent-success border-green-500/25 hover:bg-accent-success hover:text-white'
                        }`}
                        title={u.active ? 'Deactivate user' : 'Activate user'}
                      >
                        <Power size={12} />
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
