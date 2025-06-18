import axios from 'axios';

// Set the base URL for all API requests
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://144.76.160.218:81';

// Add a request interceptor to include the auth token
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors
axios.interceptors.response.use(
    (response) => {
        return response;

    },
    (error) => {
        if (error.response) {
            // Handle specific error cases
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear auth data and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - user doesn't have permission
                    console.error('Access forbidden:', error);
                    break;
                case 404:
                    // Not found
                    console.error('Resource not found:', error);
                    break;
                case 500:
                    // Server error
                    console.error('Server error:', error);
                    break;
                default:
                    console.error('API error:', error);
            }
        } else if (error.request) {
            // Network error
            console.error('Network error:', error);
        } else {
            // Other error
            console.error('Error:', error);
        }
        return Promise.reject(error);
    }
);

export default axios; 