import React, { createContext, useState, useEffect } from 'react';
import { accountsAPI } from '../api/accounts';

// We export this so the Hook can access it
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await accountsAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await accountsAPI.login(identifier, password);
      const { access, refresh, user: userData } = response;
      
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await accountsAPI.register(userData);
      const { access, refresh, user: newUser } = response;
      
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);
      
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    // Note: Ensure your backend returns uppercase strings to match these
    isProducer: user?.role === 'PRODUCER',
    isShowroom: user?.role === 'SHOWROOM',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
