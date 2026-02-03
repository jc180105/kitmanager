export const getApiUrl = () => {
    // 1. Env Var (Priority)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Vercel Production Fallback
    if (window.location.hostname.includes('vercel.app')) {
        return 'https://kitmanager-production.up.railway.app';
    }

    // 3. Localhost Fallback
    return 'http://localhost:3002';
};

export const API_URL = getApiUrl();
