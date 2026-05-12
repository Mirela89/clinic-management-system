import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8081',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

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
    if (status === 403) {
      window.location.href = '/unauthorized';
    }

    return Promise.reject(error);
  }
);

export default api;