import { API_URL } from './config';

// Helper to get token
const getToken = () => localStorage.getItem('token');

// Custom fetch wrapper
export const api = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

const request = async (endpoint, options = {}) => {
    const token = getToken();

    // Ensure HEADERS exist
    options.headers = options.headers || {};

    // Add Content-Type if we have a body (and not FormData)
    if (options.body && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    // Add Authorization header
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Helpers to handle full URL vs relative path
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, options);

        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            // Only redirect if we are NOT on the login page already (to avoid loops)
            if (!window.location.pathname.includes('/login')) {
                console.warn('Sessão expirada. Redirecionando para login...');
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(new Error('Sessão expirada'));
            }
        }

        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

export const fetchWithAuth = request;
