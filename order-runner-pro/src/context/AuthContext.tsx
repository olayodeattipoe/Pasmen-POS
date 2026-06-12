import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { User, AuthTokens } from '@/api/models';
import {
    login as apiLogin,
    logout as apiLogout,
    refreshToken as apiRefreshToken,
    storeTokens,
    getAccessToken,
    getRefreshToken,
    isAuthenticated as checkIsAuthenticated,
    isTokenValid,
    getCurrentUser,
} from '@/api/features';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    // Check authentication status on mount
    useEffect(() => {
        const initAuth = async () => {
            const accessToken = getAccessToken();

            if (accessToken) {
                // Check if token is valid (not expired)
                if (isTokenValid(accessToken)) {
                    // Fetch real user info
                    const userResponse = await getCurrentUser();
                    if (userResponse.data) {
                        setUser(userResponse.data);
                    } else {
                        // Failed to get user info despite valid token?
                        logout();
                    }
                } else {
                    // Token expired, try to refresh
                    const success = await refreshAccessToken();
                    if (success) {
                        // Fetch real user info after refresh
                        const userResponse = await getCurrentUser();
                        if (userResponse.data) {
                            setUser(userResponse.data);
                        } else {
                            logout();
                        }
                    } else {
                        // Refresh failed, clear everything
                        logout();
                    }
                }
            } else {
                // No token found
                if (checkIsAuthenticated()) {
                    // Check logic says yes but no token? consistency check
                    logout();
                }
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    // Auto-refresh token before expiry (optional enhancement)
    useEffect(() => {
        if (!user) return;

        // JWT tokens from Django typically expire in 5 minutes for access tokens
        // Refresh every 4 minutes to be safe (though api/features.ts now handles proactive refresh too)
        const refreshInterval = setInterval(async () => {
            await refreshAccessToken();
        }, 4 * 60 * 1000); // 4 minutes

        return () => clearInterval(refreshInterval);
    }, [user]);

    const login = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);

        try {
            const result = await apiLogin({ username, password });

            if (result.error || !result.data) {
                toast.error('Login failed', {
                    description: result.error || 'Invalid credentials',
                });
                setIsLoading(false);
                return false;
            }

            // Store tokens
            storeTokens(result.data.access, result.data.refresh);

            // Fetch user info
            const userResult = await getCurrentUser();
            if (userResult.data) {
                setUser(userResult.data);
                toast.success(`Welcome back, ${userResult.data.username}!`, {
                    description: 'System ready for orders.',
                });
            } else {
                // Fallback if user fetch fails (unlikely if login worked)
                setUser({ id: '1', username });
                toast.success('Welcome back!', {
                    description: 'System ready, but user info limited.',
                });
            }

            setIsLoading(false);
            return true;
        } catch (error) {
            toast.error('Login failed', {
                description: 'An unexpected error occurred',
            });
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        apiLogout();
        setUser(null);
        toast.info('Logged out', {
            description: 'See you next time!',
        });
        navigate('/login');
    };

    const refreshAccessToken = async (): Promise<boolean> => {
        const refreshTokenValue = getRefreshToken();

        if (!refreshTokenValue) {
            logout();
            return false;
        }

        const result = await apiRefreshToken(refreshTokenValue);

        if (result.error || !result.data) {
            // Refresh token expired or invalid, logout user
            logout();
            return false;
        }

        // Update access token
        const currentRefresh = getRefreshToken();
        if (currentRefresh) {
            storeTokens(result.data.access, currentRefresh);
        }

        return true;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                refreshAccessToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
