import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

// Product APIs
export const getProducts = async (params = {}) => {
  const response = await api.get('/api/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/api/products/${id}`);
  return response.data;
};

// Order APIs
export const createOrder = async (orderData) => {
  const response = await api.post('/api/orders', orderData);
  return response.data;
};

export const getUserOrders = async () => {
  const response = await api.get('/api/orders');
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/api/orders/${id}`);
  return response.data;
};

// Payment APIs
export const processBkashPayment = async (paymentData) => {
  const response = await api.post('/api/payments/bkash', paymentData);
  return response.data;
};

export const processCardPayment = async (paymentData) => {
  const response = await api.post('/api/payments/card', paymentData);
  return response.data;
};

export const processCOD = async (orderData) => {
  const response = await api.post('/api/payments/cod', orderData);
  return response.data;
};

// Admin APIs
export const getDashboardStats = async () => {
  const response = await api.get('/api/admin/dashboard');
  return response.data;
};

export const getAllOrders = async (params = {}) => {
  const response = await api.get('/api/admin/orders', { params });
  return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
  const response = await api.put(`/api/admin/orders/${orderId}/status`, { status });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/api/admin/products', productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/api/admin/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/api/admin/products/${productId}`);
  return response.data;
};

export default api;