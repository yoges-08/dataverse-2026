import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dataverse_token') || null);
  const [loading, setLoading] = useState(true);

  const isFetchingRef = useRef(false);
  const userRef = useRef(user);
  const tokenRef = useRef(token);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStudent(null);
    localStorage.removeItem('dataverse_token');
  }, []);

  const fetchMe = useCallback(async () => {
    // Ensure only one in-flight request runs at a time
    if (isFetchingRef.current) return;

    const currentToken = tokenRef.current || localStorage.getItem('dataverse_token');
    if (!currentToken) {
      setLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        setStudent(res.data.student);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Fetch user error:', err);
      logout();
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token, fetchMe]);

  // Handle visibility change and pageshow (e.g. backgrounding tab, switching apps, recent tabs)
  useEffect(() => {
    const handleResume = (event) => {
      const isVisible = document.visibilityState === 'visible';
      const isPageShow = event?.type === 'pageshow';

      if (isVisible || isPageShow) {
        const storedToken = localStorage.getItem('dataverse_token');
        if (storedToken && (!userRef.current || isFetchingRef.current === false)) {
          fetchMe();
        }
      }
    };

    document.addEventListener('visibilitychange', handleResume);
    window.addEventListener('pageshow', handleResume);

    return () => {
      document.removeEventListener('visibilitychange', handleResume);
      window.removeEventListener('pageshow', handleResume);
    };
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem('dataverse_token', res.data.token);
        setUser(res.data.user);
        setStudent(res.data.student);
        return res.data;
      } else {
        throw new Error(res.data.message || 'Login failed');
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Login failed');
    }
  };

  const registerStudent = async (formData) => {
    try {
      // Omit explicit Content-Type header so Axios automatically sets boundary for FormData
      const res = await API.post('/auth/register-student', formData);
      if (res.data.success) {
        setToken(res.data.token);
        localStorage.setItem('dataverse_token', res.data.token);
        setUser(res.data.user);
        setStudent(res.data.student);
        return res.data;
      } else {
        throw new Error(res.data.message || 'Registration failed');
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Registration failed');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      student,
      token,
      loading,
      login,
      registerStudent,
      logout,
      fetchMe
    }}>
      {children}
    </AuthContext.Provider>
  );
};
