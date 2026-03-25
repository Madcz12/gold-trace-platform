import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add token from localStorage on init
const savedToken = localStorage.getItem('gt_token');
if (savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Response interceptor for auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('gt_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
