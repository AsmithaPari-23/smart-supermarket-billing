import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  ClipboardList, 
  History, 
  TrendingUp, 
  Settings, 
  LogOut, 
  UserSquare2,
  Menu,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Billing POS', path: '/billing', icon: ShoppingCart, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Customers (CRM)', path: '/customers', icon: Users, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Products Catalog', path: '/products', icon: Package, roles: ['Administrator', 'Manager'] },
    { name: 'Inventory Alerts', path: '/inventory', icon: ClipboardList, roles: ['Administrator', 'Manager'] },
    { name: 'Billing History', path: '/history', icon: History, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Sales Reports', path: '/reports', icon: TrendingUp, roles: ['Administrator', 'Manager'] },
    { name: 'Staff Management', path: '/staff', icon: UserSquare2, roles: ['Administrator'] },
    { name: 'Store Settings', path: '/settings', icon: Settings, roles: ['Administrator'] }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg text-brand-dark font-sans">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Floating Glass Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-64 glass-panel m-0 lg:m-4 lg:mr-0 lg:rounded-[20px] 
        flex flex-col justify-between py-6 px-4 no-print select-none transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo Branding */}
          <div className="flex items-center justify-between px-2 mb-7">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-brand-primary to-brand-secondary p-2.5 rounded-2xl shadow-primary text-white flex items-center justify-center">
                <ShoppingCart size={22} className="stroke-[2.2]" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-base leading-tight tracking-tight text-brand-primary flex items-center gap-1.5">
                  APEX BILLING
                </h1>
                <p className="text-[10px] text-brand-muted font-medium tracking-wider uppercase">SMART SUPERMARKET ERP</p>
              </div>
            </div>
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-brand-muted hover:text-brand-dark"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              if (link.roles && !link.roles.includes(user?.role)) return null;
              
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-primary scale-[1.02]'
                      : 'text-brand-muted hover:bg-brand-primary/10 hover:text-brand-primary'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                  <span className="truncate">{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-brand-border pt-4 mt-4 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1.5 bg-brand-bg/60 rounded-xl border border-brand-border/60">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary text-white font-bold text-sm flex items-center justify-center shadow-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <h2 className="text-xs font-bold text-brand-dark truncate leading-tight">{user?.name}</h2>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-brand-primary" />
                <p className="text-[10px] text-brand-muted font-medium truncate">{user?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-brand-danger bg-brand-danger/10 hover:bg-brand-danger hover:text-white transition-all duration-200"
          >
            <LogOut size={16} className="stroke-[2]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden m-0 lg:m-4">
        {/* Header Bar */}
        <header className="glass-panel px-4 lg:px-6 py-3.5 rounded-none lg:rounded-[20px] flex items-center justify-between mb-0 lg:mb-4 no-print select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-brand-dark hover:bg-brand-primary/10 rounded-xl"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="font-heading font-bold text-base lg:text-lg leading-tight text-brand-dark flex items-center gap-2">
                {navLinks.find(link => link.path === location.pathname)?.name || 'Dashboard'}
                <Sparkles size={16} className="text-brand-gold animate-pulse" />
              </h1>
              <p className="text-[10px] text-brand-muted font-medium tracking-wide">
                Terminal active for <span className="text-brand-primary font-semibold">{user?.name}</span> ({user?.role})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-brand-dark bg-white px-3.5 py-1.5 rounded-xl border border-brand-border shadow-card">
              <span className="h-2 w-2 rounded-full bg-brand-success animate-ping" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* Content Body Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-0 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
