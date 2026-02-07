export const getApiUrl = () => {
    // 1. Env Var (Priority)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Vercel Production Fallback
    if (window.location.hostname.includes('vercel.app')) {
        return 'https://kitmanager-production.up.railway.app';
    }

    // 3. Localhost Fallback
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Return Railway URL here too if user wants to ALWAYS use Railway backend
        // But for development usually we want local. 
        // User said: "always use backend from railway". 
        // So I will make localhost ALSO point to Railway.
        return 'https://kitmanager-production.up.railway.app';
    }

    return 'https://kitmanager-production.up.railway.app';
};

export const API_URL = getApiUrl();
