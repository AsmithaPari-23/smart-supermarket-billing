import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, ShieldCheck, Lock, User } from 'lucide-react';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
    const savedUsername = localStorage.getItem('remembered_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    const result = await login(username, password, rememberMe);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary px-4 select-none">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-success/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl border border-glass-border">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent-primary text-white p-4 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
            <ShoppingCart size={32} className="stroke-[2.5]" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-text-primary tracking-tight">Apex Supermarket</h1>
          <p className="text-xs text-text-secondary font-medium tracking-wide mt-1">Cashier & Management Dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-accent-danger text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-glass-border bg-white/40 focus:bg-white/80 focus:border-accent-primary focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm placeholder:text-text-secondary/50 font-medium"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-secondary">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-glass-border bg-white/40 focus:bg-white/80 focus:border-accent-primary focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 text-sm placeholder:text-text-secondary/50 font-medium"
                required
              />
            </div>
          </div>

          {/* Options: Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-text-secondary select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-glass-border text-accent-primary focus:ring-accent-primary focus:ring-offset-0 cursor-pointer"
              />
              Remember Me
            </label>
            
            <span className="text-text-secondary/60 font-medium hover:text-accent-primary cursor-pointer transition-colors duration-150">
              Forgot Password?
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-accent-primary hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={18} />
                Secure Login
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div className="mt-8 border-t border-glass-border pt-6 select-text text-center">
          <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2.5">Demo Credentials</p>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-text-secondary">
            <div className="bg-white/30 border border-glass-border p-2 rounded-xl">
              <p className="font-bold text-accent-primary">Admin</p>
              <p className="mt-0.5 font-mono">admin</p>
              <p className="font-mono">admin123</p>
            </div>
            <div className="bg-white/30 border border-glass-border p-2 rounded-xl">
              <p className="font-bold text-accent-primary">Manager</p>
              <p className="mt-0.5 font-mono">manager</p>
              <p className="font-mono">manager123</p>
            </div>
            <div className="bg-white/30 border border-glass-border p-2 rounded-xl">
              <p className="font-bold text-accent-primary">Cashier</p>
              <p className="mt-0.5 font-mono">cashier</p>
              <p className="font-mono">cashier123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
