import axios from 'axios';

/**
 * Axios instance with interceptors
 * - Automatically adds Authorization header with Bearer token
 * - Handles 401 errors by redirecting to login
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor — add Authorization + X-Correlation-ID headers
 */
api.interceptors.request.use(
  (config) => {
    // Add Authorization header
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add (or forward) X-Correlation-ID header
    // Use browser's built-in crypto.randomUUID() or stored correlation ID
    if (!config.headers['X-Correlation-ID']) {
      const storedId = sessionStorage.getItem('correlationId');
      config.headers['X-Correlation-ID'] = storedId || crypto.randomUUID();
      // // For HTTPS
      // // config.headers['X-Correlation-ID'] = storedId || crypto.randomUUID();
      //  // Simple UUID v4 generator (compatible with HTTP)
      // const generateUUID = () => {
      //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      //     const r = Math.trunc(Math.random() * 16);
      //     const v = c === 'x' ? r : Math.trunc((r & 0x3) | 0x8);
      //     return v.toString(16);
      //   });
      // };
      // config.headers['X-Correlation-ID'] = storedId || generateUUID();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor — handle 401 errors + store correlation ID
 */
api.interceptors.response.use(
  (response) => {
    // Store correlation ID from response for tracing
    const correlationId = response.headers['x-correlation-id'];
    if (correlationId) {
      sessionStorage.setItem('correlationId', correlationId);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on 401
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
