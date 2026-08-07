import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('dataverse_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
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
      setLoading(false);
    }
  };

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

  const logout = () => {
    setToken(null);
    setUser(null);
    setStudent(null);
    localStorage.removeItem('dataverse_token');
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
