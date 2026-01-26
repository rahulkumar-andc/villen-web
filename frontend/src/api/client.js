import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      const errorMessage = {
        400: data?.detail || 'Bad request. Please check your input.',
        403: 'You do not have permission to access this resource.',
        404: 'The requested resource was not found.',
        429: 'Too many requests. Please try again later.',
        500: 'Server error. Please try again later.',
        503: 'Service unavailable. Please try again later.',
      }[status] || `Error ${status}: ${data?.detail || 'Unknown error'}`;

      console.error(`API Error ${status}:`, errorMessage);
      
      return Promise.reject({
        status,
        message: errorMessage,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Network error:', error.request);
      return Promise.reject({
        status: 'network',
        message: 'Network error. Please check your connection.',
        data: null,
      });
    } else {
      // Error in request setup
      console.error('Error:', error.message);
      return Promise.reject({
        status: 'unknown',
        message: error.message || 'An unknown error occurred.',
        data: null,
      });
    }
  }
);

export default apiClient;
