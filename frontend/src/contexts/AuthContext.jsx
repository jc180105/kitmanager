import { createContext, useState, useEffect, useContext } from 'react';
import { API_URL } from '../utils/config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Optional: Validate token with backend
                // For now, we trust existence + decoding (or basic fetch check later)
                // Let's do a quick verify call if we want to be strict, 
                // OR just trust it until a 401 happens (Optimistic).
                // Given "Login Once" requirement, we want to be persistent.

                // Let's assume valid and let api.js handle 401s
                setUser({ role: 'admin' }); // Mock user object for now
            } catch (error) {
                console.error("Token invalid", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        validateToken();
    }, [token]);

    const login = async (password) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha no login');
            }

            if (data.token) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
