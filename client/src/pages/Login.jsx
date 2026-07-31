import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, ShieldCheck, Lock, User, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4 select-none relative overflow-hidden">
      {/* Soft ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-gold/15 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-[20px] shadow-2xl border border-brand-border">
        {/* Brand Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-brand-primary to-brand-secondary text-white p-4 rounded-2xl shadow-primary mb-3">
            <ShoppingBag size={32} className="stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-2xl text-brand-dark tracking-tight">Apex Supermarket</h1>
          <p className="text-xs text-brand-muted font-medium tracking-wide mt-1">Smart Billing POS & Management ERP</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-xs font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <User size={18} />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your login username"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:border-brand-primary outline-none transition text-xs text-brand-dark placeholder:text-brand-muted/50 font-semibold shadow-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Password</label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <Lock size={18} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:border-brand-primary outline-none transition text-xs text-brand-dark placeholder:text-brand-muted/50 font-semibold shadow-sm"
                required
              />
            </div>
          </div>

          {/* Options: Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-brand-muted select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary cursor-pointer accent-brand-primary"
              />
              Remember Me
            </label>
            
            <span className="text-brand-muted font-medium hover:text-brand-primary cursor-pointer transition-colors duration-150 text-[11px]">
              Forgot Password?
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 glass-btn-primary py-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <ShieldCheck size={18} />
                Secure Login Access
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Panel */}
        <div className="mt-8 border-t border-brand-border pt-6 select-text text-center">
          <p className="text-[11px] font-bold text-brand-muted uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-brand-gold" /> System Demo Credentials
          </p>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-medium text-brand-muted">
            <div className="bg-brand-bg/80 border border-brand-border p-2.5 rounded-xl">
              <p className="font-bold text-brand-primary">Admin</p>
              <p className="mt-0.5 font-mono text-brand-dark">admin</p>
              <p className="font-mono text-brand-muted">admin123</p>
            </div>
            <div className="bg-brand-bg/80 border border-brand-border p-2.5 rounded-xl">
              <p className="font-bold text-brand-primary">Manager</p>
              <p className="mt-0.5 font-mono text-brand-dark">manager</p>
              <p className="font-mono text-brand-muted">manager123</p>
            </div>
            <div className="bg-brand-bg/80 border border-brand-border p-2.5 rounded-xl">
              <p className="font-bold text-brand-primary">Cashier</p>
              <p className="mt-0.5 font-mono text-brand-dark">cashier</p>
              <p className="font-mono text-brand-muted">cashier123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
