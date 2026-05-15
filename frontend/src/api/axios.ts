import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    // Eroare de retea sau backend oprit
    if (!error.response) {
      window.location.href = '/500';
      return Promise.reject(error);
    }

    if (status === 500) {
      window.location.href = '/500';
    }

    // 403 si 401 - lasam componentele sa gestioneze

    return Promise.reject(error);
  }
);

export default api;
