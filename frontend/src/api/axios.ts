import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8085',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adaugă token la fiecare request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (!error.response) {
      if (window.location.pathname !== '/500') {
        window.location.href = "/500";
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem('jwt_token');
      if (window.location.pathname !== '/login') {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (status === 500) {
      if (window.location.pathname !== '/500') {
        window.location.href = "/500";
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;