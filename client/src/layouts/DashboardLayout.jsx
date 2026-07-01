import React from 'react';
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
  UserSquare2 
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Billing', path: '/billing', icon: ShoppingCart, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Customers (CRM)', path: '/customers', icon: Users, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Products Catalog', path: '/products', icon: Package, roles: ['Administrator', 'Manager'] },
    { name: 'Inventory Alerts', path: '/inventory', icon: ClipboardList, roles: ['Administrator', 'Manager'] },
    { name: 'Billing History', path: '/history', icon: History, roles: ['Administrator', 'Manager', 'Cashier'] },
    { name: 'Sales Reports', path: '/reports', icon: TrendingUp, roles: ['Administrator', 'Manager'] },
    { name: 'Staff Management', path: '/staff', icon: UserSquare2, roles: ['Administrator'] },
    { name: 'Store Settings', path: '/settings', icon: Settings, roles: ['Administrator'] }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-primary text-text-primary">
      {/* Glass Sidebar */}
      <aside className="w-64 glass-panel m-4 mr-0 rounded-2xl flex flex-col justify-between py-6 px-4 no-print select-none">
        <div>
          {/* Logo Title */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="bg-accent-primary p-2.5 rounded-xl shadow-lg shadow-blue-500/20 text-white">
              <ShoppingCart size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight tracking-tight text-accent-primary">APEX BILLING</h1>
              <p className="text-[10px] text-text-secondary font-medium tracking-wider">SUPERMARKET ERP</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              if (link.roles && !link.roles.includes(user?.role)) return null;
              
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-accent-primary text-white shadow-md shadow-blue-500/25'
                      : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-glass-border pt-4 mt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-10 w-10 rounded-full bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center font-heading font-semibold text-accent-primary">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-semibold truncate leading-tight">{user?.name}</h2>
              <p className="text-[10px] text-text-secondary font-medium mt-0.5 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-accent-danger hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={18} className="stroke-[1.8]" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden m-4">
        {/* Top Header Bar */}
        <header className="glass-panel px-6 py-4 rounded-2xl flex items-center justify-between mb-4 no-print select-none">
          <div className="flex flex-col">
            <h1 className="font-heading font-bold text-lg leading-tight text-text-primary">
              {navLinks.find(link => link.path === location.pathname)?.name || 'Admin Panel'}
            </h1>
            <p className="text-[10px] text-text-secondary font-medium tracking-wide">
              Logged in as {user?.name} ({user?.role})
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-text-secondary bg-white/40 px-3 py-1.5 rounded-lg border border-glass-border">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content body container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
