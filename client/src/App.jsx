import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Scanner from './pages/Scanner';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary">
        <div className="h-8 w-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const DashboardRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/history" element={<History />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/staff" element={<Users />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<Login />} />
            
            {/* Mobile Barcode Scanner - Optimized screen, no Dashboard Layout */}
            <Route path="/scanner" element={<Scanner />} />

            {/* Dashboard Protected Routes */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <DashboardRoutes />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
