import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8085',
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (!error.response) {
      // Rețea down sau backend oprit
      if (window.location.pathname !== '/500') {
        window.location.href = "/500";
      }
      return Promise.reject(error);
    }

    if (status === 401) {
      // Neautentificat → redirect la login
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
