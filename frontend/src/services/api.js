import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to add JWT Authorization header
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('dataverse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
