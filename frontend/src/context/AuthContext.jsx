import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [organisation, setOrganisation] = useState(() => {
    try {
      const saved = localStorage.getItem('organisation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setOrganisation(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      const payload = res.data?.data || res.data;
      const currentUser = payload.user || payload;
      const currentOrg = payload.organisation || currentUser?.organisation || null;

      setUser(currentUser);
      setOrganisation(currentOrg);
      localStorage.setItem('user', JSON.stringify(currentUser));
      if (currentOrg) {
        localStorage.setItem('organisation', JSON.stringify(currentOrg));
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('organisation');
      setUser(null);
      setOrganisation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const payload = res.data?.data || res.data;
    const token = payload.token || res.data?.token;
    const loggedInUser = payload.user || payload;
    const loggedInOrg = payload.organisation || loggedInUser?.organisation || null;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (loggedInUser) {
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
    }
    if (loggedInOrg) {
      setOrganisation(loggedInOrg);
      localStorage.setItem('organisation', JSON.stringify(loggedInOrg));
    }

    return payload;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const payload = res.data?.data || res.data;
    const token = payload.token || res.data?.token;
    const registeredUser = payload.user || payload;
    const registeredOrg = payload.organisation || registeredUser?.organisation || null;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (registeredUser) {
      setUser(registeredUser);
      localStorage.setItem('user', JSON.stringify(registeredUser));
    }
    if (registeredOrg) {
      setOrganisation(registeredOrg);
      localStorage.setItem('organisation', JSON.stringify(registeredOrg));
    }

    return payload;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('organisation');
    setUser(null);
    setOrganisation(null);
  };

  const updateOrganisationState = (newOrg) => {
    setOrganisation(newOrg);
    localStorage.setItem('organisation', JSON.stringify(newOrg));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organisation,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        fetchMe,
        updateOrganisationState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
