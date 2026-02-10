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
                const response = await fetch(`${API_URL}/auth/validate`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    setUser({ role: 'admin' });
                } else {
                    // Token inválido ou expirado
                    console.warn('Token inválido, fazendo logout...');
                    logout();
                }
            } catch (error) {
                // Sem conexão: manter logado (otimista)
                console.warn('Não foi possível validar token (offline?):', error.message);
                setUser({ role: 'admin' });
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
