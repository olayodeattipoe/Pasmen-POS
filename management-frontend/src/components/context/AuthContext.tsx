import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@/api/models';
import * as api from '@/api/features';

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

    useEffect(() => {
        const initAuth = async () => {
            const token = api.getAccessToken();
            if (token && api.isTokenValid(token)) {
                // Decode token to get user ID
                const decoded = api.decodeToken(token);
                if (decoded && decoded.user_id) {
                    try {
                        const fullUser = await api.getCurrentUser(decoded.user_id);
                        if (fullUser) {
                            setUser({
                                id: fullUser.id.toString(),
                                username: fullUser.username,
                                groups: fullUser.groups || []
                            });
                        } else {
                            // Fallback if fetch fails but token is valid
                            setUser({
                                id: decoded.user_id?.toString() || '1',
                                username: decoded.username || 'User',
                                groups: decoded.groups || []
                            });
                        }
                    } catch (error) {
                        console.error("Failed to fetch user details:", error);
                        // Fallback
                        setUser({
                            id: decoded.user_id?.toString() || '1',
                            username: decoded.username || 'User',
                            groups: decoded.groups || []
                        });
                    }
                } else {
                    // Should not happen if token is valid but decoded fails
                    setUser({ id: '1', username: 'User' });
                }
            } else if (token) {
                // Try refresh
                const refresh = api.getRefreshToken();
                if (refresh) {
                    const res = await api.refreshToken(refresh);
                    if (res.data) {
                        api.storeTokens(res.data.access, refresh);
                        const decoded = api.decodeToken(res.data.access);
                        if (decoded && decoded.user_id) {
                            try {
                                const fullUser = await api.getCurrentUser(decoded.user_id);
                                if (fullUser) {
                                    setUser({
                                        id: fullUser.id.toString(),
                                        username: fullUser.username,
                                        groups: fullUser.groups || []
                                    });
                                } else {
                                    setUser({
                                        id: decoded.user_id?.toString() || '1',
                                        username: decoded.username || 'User',
                                        groups: decoded.groups || []
                                    });
                                }
                            } catch (error) {
                                console.error("Failed to fetch user details on refresh:", error);
                                setUser({
                                    id: decoded.user_id?.toString() || '1',
                                    username: decoded.username || 'User',
                                    groups: decoded.groups || []
                                });
                            }
                        } else {
                            setUser({ id: '1', username: 'User' });
                        }
                    } else {
                        api.logout();
                    }
                } else {
                    api.logout();
                }
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
            const decoded = api.decodeToken(res.data.access);
            if (decoded && decoded.user_id) {
                try {
                    const fullUser = await api.getCurrentUser(decoded.user_id);
                    if (fullUser) {
                        setUser({
                            id: fullUser.id.toString(),
                            username: fullUser.username,
                            groups: fullUser.groups || []
                        });
                    } else {
                        // Fallback
                        setUser({
                            id: decoded.user_id?.toString() || '1',
                            username: decoded.username || username,
                            groups: decoded.groups || []
                        });
                    }
                } catch (error) {
                    console.error("Failed to fetch user after login:", error);
                    setUser({
                        id: decoded.user_id?.toString() || '1',
                        username: decoded.username || username,
                        groups: decoded.groups || []
                    });
                }
            } else {
                setUser({ id: '1', username });
            }
            setIsLoading(false);
            return true;
        }
        setIsLoading(false);
        return false;
    };

    const logout = () => {
        api.logout();
        setUser(null);
        navigate('/auth');
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
