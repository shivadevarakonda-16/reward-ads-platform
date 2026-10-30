import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, userApi } from '../api/client.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('reward_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('reward_token'));
  const [loading, setLoading] = useState(true);

  // Initialize or get device fingerprint
  const getDeviceFingerprint = () => {
    let fp = localStorage.getItem('reward_device_fp');
    if (!fp) {
      fp = 'dfp_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('reward_device_fp', fp);
    }
    return fp;
  };

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('reward_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('reward_user', JSON.stringify(res.user));
        }
      } catch (error) {
        console.warn('Session verification failed, clearing auth:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const deviceFingerprint = getDeviceFingerprint();
    const res = await authApi.login({ email, password, deviceFingerprint });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('reward_token', res.token);
      localStorage.setItem('reward_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Login failed');
  };

  const register = async (userData) => {
    const deviceFingerprint = getDeviceFingerprint();
    const res = await authApi.register({ ...userData, deviceFingerprint });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('reward_token', res.token);
      localStorage.setItem('reward_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error(res.error || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('reward_token');
    localStorage.removeItem('reward_user');
  };

  const refreshUser = async () => {
    try {
      const res = await userApi.getProfile();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('reward_user', JSON.stringify(res.user));
        return res.user;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        refreshUser,
        getDeviceFingerprint
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
