import axios from 'axios';

// Base URL configuration - Empty allows Vite proxy to catch requests relative to origin
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// A singleton reference to store JWT in memory (not localStorage)
let inMemoryToken = null;

export const setAuthToken = (token) => {
  inMemoryToken = token;
};

export const getAuthToken = () => inMemoryToken;

// Axios Request Interceptor
api.interceptors.request.use(
  (config) => {
    // If we have the token, attach it to every request
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios Response Interceptor (for catching global 401 unauths)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and optionally force a logout by throwing an event
      setAuthToken(null);
      // It is usually cleanly handled in AuthContext to reroute on 401s
    }
    return Promise.reject(error);
  }
);

export default api;
