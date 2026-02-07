export const getApiUrl = () => {
    // 1. Env Var (Priority)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 2. Vercel Production Fallback
    if (window.location.hostname.includes('vercel.app')) {
        return 'https://kitmanager-production.up.railway.app';
    }

    // 3. Localhost Fallback
    // Return Railway URL here too if user wants to ALWAYS use Railway backend
    return 'https://kitmanager-production.up.railway.app';
};

export const API_URL = getApiUrl();
