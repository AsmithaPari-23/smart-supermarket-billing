import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure Axios Defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      if (data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, rememberMe) => {
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      if (data.success) {
        localStorage.setItem('token', data.token);
        if (rememberMe) {
          localStorage.setItem('remembered_username', username);
        } else {
          localStorage.removeItem('remembered_username');
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return { success: true };
      }
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Login failed. Connection error.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAdmin: user?.role === 'Administrator',
    isManager: user?.role === 'Manager' || user?.role === 'Administrator',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
