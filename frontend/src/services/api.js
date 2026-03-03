import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getCategories: () => api.get('/products/categories'),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
};

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  getToday: () => api.get('/sales/today'),
  getByDate: (params) => api.get('/sales/by-date', { params }),
  getByPayment: (params) => api.get('/sales/by-payment', { params }),
};

export const expensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getById: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getToday: () => api.get('/expenses/today'),
  getByCategory: (params) => api.get('/expenses/by-category', { params }),
  getCategories: () => api.get('/expenses/categories'),
};

export const reportsAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getDailyProfit: (params) => api.get('/reports/daily-profit', { params }),
  getCategoryProfit: (params) => api.get('/reports/category-profit', { params }),
  getInventory: () => api.get('/reports/inventory'),
  getSalesTrends: (params) => api.get('/reports/sales-trends', { params }),
  getDashboard: () => api.get('/reports/dashboard'),
};

export default api;
