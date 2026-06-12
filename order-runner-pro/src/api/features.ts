import type {
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    ApiResponse,
    Sale,
    SaleItem,
    RawSaleItem,
    User,
} from './models';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL


// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        return { error: error.detail || 'An error occurred' };
    }

    if (response.status === 204) {
        return {};
    }

    const data = await response.json();
    return { data };
}

// Authentication Features

/**
 * Login user with username and password
 * @param credentials - Username and password
 * @returns Access and refresh tokens
 */
export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        return handleResponse<LoginResponse>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Refresh access token using refresh token
 * @param refreshToken - The refresh token
 * @returns New access token
 */
export async function refreshToken(refreshToken: string): Promise<ApiResponse<TokenRefreshResponse>> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        return handleResponse<TokenRefreshResponse>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/users/me/`);
        return handleResponse<User>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Get next kitchen order from queue
 * Uses long polling mechanism (handled by caller)
 * Returns 204 if no orders in queue
 */
export async function getNextKitchenOrder(): Promise<ApiResponse<Sale>> {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/getnextkitchenorder/`);
        return handleResponse<Sale>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Get sale items (basket) for a specific sale
 * @param saleId - The ID of the sale
 */
export async function getSaleItems(saleId: string | number): Promise<ApiResponse<RawSaleItem[]>> {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/getsaleitem/${saleId}/`);
        return handleResponse<RawSaleItem[]>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Get completed orders for the current user
 */
export async function getCompletedOrders(): Promise<ApiResponse<Sale[]>> {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/getcompletedorders/`);
        return handleResponse<Sale[]>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Mark an order as completed
 * @param saleId - The ID of the sale to mark as completed
 */
export async function markOrderAsCompleted(saleId: string | number): Promise<ApiResponse<{ detail: string }>> {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/inventory/markorderascompleted/${saleId}/`, {
            method: 'POST',
        });
        return handleResponse<{ detail: string }>(response);
    } catch (error) {
        return { error: 'Network error. Please check your connection.' };
    }
}

/**
 * Logout user (client-side token removal)
 * Note: Django REST Framework JWT doesn't have a server-side logout endpoint by default
 * Tokens are stateless and expire naturally
 */
export function logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

/**
 * Get stored refresh token
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
}

/**
 * Store authentication tokens
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

/**
 * Create authenticated fetch wrapper
 * Automatically adds Authorization header with access token
 * Handles proactive token refreshing if access token is expired or close to expiry
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let accessToken = getAccessToken();
    const refreshTokenValue = getRefreshToken();

    // Check if token is expired or about to expire (within 1 minute)
    if (accessToken && refreshTokenValue) {
        const decoded = decodeToken(accessToken);
        const currentTime = Date.now() / 1000;
        const buffer = 60; // 1 minute buffer

        if (decoded && decoded.exp && (decoded.exp - currentTime < buffer)) {
            // Token is expiring soon or expired, try to refresh
            try {
                const refreshResponse = await refreshToken(refreshTokenValue);
                if (refreshResponse.data && refreshResponse.data.access) {
                    accessToken = refreshResponse.data.access;
                    storeTokens(accessToken, refreshTokenValue); // Update storage
                } else {
                    // Refresh failed (maybe refresh token expired), potentially clear tokens or let 401 happen
                    // We'll let the 401 happen so the UI can prompt the user
                }
            } catch (e) {
                // Network error on refresh, proceed with old token
            }
        }
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
    };

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Decode JWT token to get payload
 */
export function decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

/**
 * Check if token is valid and not expired
 */
export function isTokenValid(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return false;

    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
}
