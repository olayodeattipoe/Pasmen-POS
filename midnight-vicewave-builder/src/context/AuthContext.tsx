import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../api/models';
import * as api from '../api/features';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (u: string, p: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const refreshAuthToken = async () => {
        const refresh = api.getRefreshToken();
        if (refresh) {
            const res = await api.refreshToken(refresh);
            if (res.data) {
                api.storeTokens(res.data.access, refresh);
                const userRes = await api.getCurrentUser();
                if (userRes.data) setUser(userRes.data);

                // Schedule next refresh
                setupTokenRefresh(res.data.access);
                return true;
            }
        }
        api.logout();
        setUser(null);
        return false;
    };

    const setupTokenRefresh = (token: string) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp * 1000;
            const now = Date.now();
            // Refresh 1 minute before expiry
            const refreshTime = exp - now - 60000;

            if (refreshTime > 0) {
                setTimeout(refreshAuthToken, refreshTime);
            } else {
                refreshAuthToken();
            }
        } catch (e) {
            console.error("Token decoding failed", e);
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const token = api.getAccessToken();
            if (token && api.isTokenValid(token)) {
                const res = await api.getCurrentUser();
                if (res.data) {
                    setUser(res.data);
                    setupTokenRefresh(token);
                } else {
                    setUser({ id: '1', username: 'User' }); // Fallback
                    setupTokenRefresh(token);
                }
            } else if (token) {
                await refreshAuthToken();
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        const res = await api.login({ username, password });
        if (res.data) {
            api.storeTokens(res.data.access, res.data.refresh);
            const userRes = await api.getCurrentUser();
            if (userRes.data) {
                setUser(userRes.data);
            } else {
                setUser({ id: '1', username });
            }
            setupTokenRefresh(res.data.access);
            setIsLoading(false);
            return true;
        }
        setIsLoading(false);
        return false;
    };

    const logout = () => {
        api.logout();
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
