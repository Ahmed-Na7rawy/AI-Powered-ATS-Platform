import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Memory storage for JWT
let memoryToken = null;

export const setAuthToken = (token) => {
  memoryToken = token;
};

// Request interceptor injects token directly into headers dynamically without persistent storage exposing it
api.interceptors.request.use(
  (config) => {
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
