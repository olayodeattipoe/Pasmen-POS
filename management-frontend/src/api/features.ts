import axios from 'axios';
import { Category, MenuItemFormData, Customizable, RawItem, Order } from './models';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

import { LoginRequest, LoginResponse, TokenRefreshResponse, ApiResponse, BatchName, BatchProductionLog, PaginatedResponse } from './models';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: baseUrl,
});

// Add request interceptor to inject token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle 401 errors
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried refreshing yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Queue this request while refresh is in progress
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshTokenValue = getRefreshToken();
            if (!refreshTokenValue) {
                isRefreshing = false;
                logout();
                window.location.href = '/auth';
                return Promise.reject(error);
            }

            try {
                const res = await refreshToken(refreshTokenValue);
                if (res.data) {
                    storeTokens(res.data.access, refreshTokenValue);
                    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
                    originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                    processQueue(null, res.data.access);
                    isRefreshing = false;
                    return api(originalRequest);
                } else {
                    processQueue(error, null);
                    isRefreshing = false;
                    logout();
                    window.location.href = '/auth';
                    return Promise.reject(error);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;
                logout();
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Helper to handle response parsing
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        return { error: error.detail || 'An error occurred' };
    }
    const data = await response.json();
    return { data };
}

// Login
export async function login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
        const response = await fetch(`${baseUrl}/api/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return handleResponse<LoginResponse>(response);
    } catch (error) {
        return { error: 'Network error.' };
    }
}

// Refresh Token
export async function refreshToken(refreshToken: string): Promise<ApiResponse<TokenRefreshResponse>> {
    try {
        const response = await fetch(`${baseUrl}/api/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        });
        return handleResponse<TokenRefreshResponse>(response);
    } catch (error) {
        return { error: 'Network error.' };
    }
}

// Token Management Helpers
export function logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
}

export function getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
}

export function getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
}

export function storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
}

export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

export function decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) { return null; }
}

export function isTokenValid(token: string): boolean {
    const decoded = decodeToken(token);
    return decoded && decoded.exp > Date.now() / 1000;
}

// Get current user details from backend
export async function getCurrentUser(userId: string): Promise<any> {
    try {
        const response = await api.get(`${baseUrl}/inventory/getusers/`);
        // Find the user with matching ID from the paginated results
        const users = response.data.results || [];
        return users.find((u: any) => u.id.toString() === userId.toString());
    } catch (error: any) {
        console.error("Failed to fetch current user:", error.message);
        return null;
    }
}

// Authenticated Fetch Wrapper
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = getAccessToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
    } as HeadersInit;
    return fetch(url, { ...options, headers });
}

export const getCategories = async () => {
    try {
        const response = await api.get(`${baseUrl}/inventory/categories/`);
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch categories:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch categories");
    }
};

export const editCategory = async (category: Category) => {
    try {
        const response = await api.patch(`${baseUrl}/inventory/categories/${category.id}/`, { "category_name": category.category_name });
        return response.data;
    } catch (error: any) {
        console.error("Failed to edit category:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to edit category");
    }
};

export const deleteCategory = async (category: Category) => {
    try {
        const response = await api.delete(`${baseUrl}/inventory/categories/${category.id}/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to delete category:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to delete category");
    }
};

export const addCategory = async (category_name: string) => {
    try {
        const response = await api.post(`${baseUrl}/inventory/addcategory/`, { category_name: category_name });
        return response.data;
    } catch (error: any) {
        console.error("Failed to add category:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to add category");
    }
};

export const addMenuItem = async (menuItem: MenuItemFormData) => {
    try {
        // If there's an image, use FormData for multipart/form-data encoding
        if (menuItem.image) {
            const formData = new FormData();

            // Append all fields to FormData
            formData.append('name', menuItem.name);
            formData.append('category', menuItem.category.toString());
            formData.append('unit', menuItem.unit);
            formData.append('price', menuItem.price.toString());
            formData.append('type', menuItem.type);
            formData.append('pricing_type', menuItem.pricing_type);
            formData.append('is_available', menuItem.is_available.toString());
            formData.append('adjustable', menuItem.adjustable.toString());

            // Append optional fields if they exist
            if (menuItem.description) formData.append('description', menuItem.description);
            if (menuItem.alias) formData.append('alias', menuItem.alias);
            if (menuItem.self_required_quantity) formData.append('self_required_quantity', menuItem.self_required_quantity.toString());
            if (menuItem.self_quantity_in_stock) formData.append('self_quantity_in_stock', menuItem.self_quantity_in_stock.toString());

            // Append conditional fields
            if (menuItem.quantity_if_package) formData.append('quantity_if_package', menuItem.quantity_if_package.toString());
            if (menuItem.price_if_package) formData.append('price_if_package', menuItem.price_if_package.toString());
            if (menuItem.array_if_fixed_variable) formData.append('array_if_fixed_variable', JSON.stringify(menuItem.array_if_fixed_variable));

            // Append image file
            formData.append('image', menuItem.image);

            const response = await api.post(`${baseUrl}/inventory/addproduct/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No image, send as JSON
            const { image, ...dataWithoutImage } = menuItem;
            const response = await api.post(`${baseUrl}/inventory/addproduct/`, dataWithoutImage);
            return response.data;
        }
    } catch (error: any) {
        console.error("Failed to add menu item:", error.message);
        console.error("Error details:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Failed to add menu item");
    }
};

export const getProductsbyCategories = async (category: Category) => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getproductsbycategory/${category.id}/`);
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch products by category:", error);
        //throw new Error(error.response?.data?.detail || "Failed to fetch products by category");
    }
};

export const updateMenuItem = async (menuItem: MenuItemFormData) => {
    try {
        if (!menuItem.id) {
            throw new Error("Menu item ID is required for update");
        }

        // If there's an image, use FormData for multipart/form-data encoding
        if (menuItem.image) {
            const formData = new FormData();

            // Append all fields to FormData
            formData.append('name', menuItem.name);
            formData.append('category', menuItem.category.toString());
            formData.append('unit', menuItem.unit);
            formData.append('price', menuItem.price.toString());
            formData.append('type', menuItem.type);
            formData.append('pricing_type', menuItem.pricing_type);
            formData.append('is_available', menuItem.is_available.toString());
            formData.append('adjustable', menuItem.adjustable.toString());

            // Append optional fields if they exist
            if (menuItem.description) formData.append('description', menuItem.description);
            if (menuItem.alias) formData.append('alias', menuItem.alias);
            if (menuItem.self_required_quantity) formData.append('self_required_quantity', menuItem.self_required_quantity.toString());
            if (menuItem.self_quantity_in_stock) formData.append('self_quantity_in_stock', menuItem.self_quantity_in_stock.toString());

            // Append conditional fields
            if (menuItem.quantity_if_package) formData.append('quantity_if_package', menuItem.quantity_if_package.toString());
            if (menuItem.price_if_package) formData.append('price_if_package', menuItem.price_if_package.toString());
            if (menuItem.array_if_fixed_variable) formData.append('array_if_fixed_variable', JSON.stringify(menuItem.array_if_fixed_variable));

            // Append image file
            formData.append('image', menuItem.image);

            const response = await api.put(`${baseUrl}/inventory/updateproduct/${menuItem.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No image, send as JSON
            const { image, id, ...dataWithoutImage } = menuItem;
            const response = await api.put(`${baseUrl}/inventory/updateproduct/${id}/`, dataWithoutImage);
            return response.data;
        }
    } catch (error: any) {
        console.error("Failed to update menu item:", error.message);
        console.error("Error details:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Failed to update menu item");
    }
};

export const getCustomizableHeaders = async () => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getcustomizableheaders/`);
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch customizable headers:", error);
        //throw new Error(error.response?.data?.detail || "Failed to fetch customizable headers");
    }
};

export const addCustomizableHeaders = async (header_name: string) => {
    try {
        const response = await api.post(`${baseUrl}/inventory/addcustomizableheader/`, { header: header_name });
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch customizable headers:", error);
        //throw new Error(error.response?.data?.detail || "Failed to fetch customizable headers");
    }
};

export const addSaleSaleItem = async (order_data: Order) => {
    try {
        const response = await api.post(`${baseUrl}/inventory/addsalesaleitem/`, order_data);
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to add sale sale item:", error);
        //throw new Error(error.response?.data?.detail || "Failed to add sale sale item");
    }
};

export const getCustomizablesByHeader = async (headerId: number) => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getcustomizablesbyheader/${headerId}/`);
        console.log(response.data);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch customizables by header:", error);
        //throw new Error(error.response?.data?.detail || "Failed to fetch customizables by header");
    }
};

export const updateCustomizable = async (customizable: Customizable) => {
    try {
        if (!customizable.id) {
            throw new Error("Customizable ID is required for update");
        }

        // If there's an image file, use FormData
        if (customizable.image && typeof customizable.image !== 'string') {
            const formData = new FormData();

            formData.append('name', customizable.name);
            formData.append('unit', customizable.unit);
            formData.append('price', customizable.price.toString());
            formData.append('pricing_type', customizable.pricing_type);
            formData.append('is_available', customizable.is_available.toString());
            formData.append('adjustable', customizable.adjustable.toString());
            formData.append('customizable_header', customizable.customizable_header.toString());

            if (customizable.description) formData.append('description', customizable.description);
            if (customizable.alias) formData.append('alias', customizable.alias);
            if (customizable.self_required_quantity) formData.append('self_required_quantity', customizable.self_required_quantity.toString());
            if (customizable.self_quantity_in_stock) formData.append('self_quantity_in_stock', customizable.self_quantity_in_stock.toString());
            if (customizable.quantity_if_package) formData.append('quantity_if_package', customizable.quantity_if_package.toString());
            if (customizable.price_if_package) formData.append('price_if_package', customizable.price_if_package.toString());
            if (customizable.array_if_fixed_variable) formData.append('array_if_fixed_variable', JSON.stringify(customizable.array_if_fixed_variable));

            formData.append('image', customizable.image as File);

            const response = await api.put(`${baseUrl}/inventory/updatecustomizable/${customizable.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No image file, send as JSON
            const { image, id, ...dataWithoutImage } = customizable;
            // Ensure customizable_header is sent as a number (ID)
            const payload = {
                ...dataWithoutImage,
                customizable_header: typeof dataWithoutImage.customizable_header === 'object' && dataWithoutImage.customizable_header !== null
                    ? (dataWithoutImage.customizable_header as any).id
                    : dataWithoutImage.customizable_header
            };
            const response = await api.put(`${baseUrl}/inventory/updatecustomizable/${id}/`, payload);
            return response.data;
        }
    } catch (error: any) {
        console.error("Failed to update customizable:", error.message);
        console.error("Error details:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Failed to update customizable");
    }
};

export const deleteCustomizable = async (customizableId: number) => {
    try {
        const response = await api.delete(`${baseUrl}/inventory/deletecustomizable/${customizableId}/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to delete customizable:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to delete customizable");
    }
};

export const addCustomizable = async (customizable: Customizable) => {
    try {
        // If there's an image file, use FormData
        if (customizable.image && typeof customizable.image !== 'string') {
            const formData = new FormData();

            formData.append('name', customizable.name);
            formData.append('unit', customizable.unit);
            formData.append('price', customizable.price.toString());
            formData.append('pricing_type', customizable.pricing_type);
            formData.append('is_available', customizable.is_available.toString());
            formData.append('adjustable', customizable.adjustable.toString());
            formData.append('customizable_header', customizable.customizable_header.toString());

            if (customizable.description) formData.append('description', customizable.description);
            if (customizable.alias) formData.append('alias', customizable.alias);
            if (customizable.self_required_quantity) formData.append('self_required_quantity', customizable.self_required_quantity.toString());
            if (customizable.self_quantity_in_stock) formData.append('self_quantity_in_stock', customizable.self_quantity_in_stock.toString());
            if (customizable.quantity_if_package) formData.append('quantity_if_package', customizable.quantity_if_package.toString());
            if (customizable.price_if_package) formData.append('price_if_package', customizable.price_if_package.toString());
            if (customizable.array_if_fixed_variable) formData.append('array_if_fixed_variable', JSON.stringify(customizable.array_if_fixed_variable));

            formData.append('image', customizable.image as File);

            const response = await api.post(`${baseUrl}/inventory/addcustomizable/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } else {
            // No image file, send as JSON
            const { image, ...dataWithoutImage } = customizable;
            const response = await api.post(`${baseUrl}/inventory/addcustomizable/`, dataWithoutImage);
            return response.data;
        }
    } catch (error: any) {
        console.error("Failed to add customizable:", error.message);
        console.error("Error details:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Failed to add customizable");
    }
};

export const updateProductCustomLinks = async (productId: number, customIds: number[]) => {
    try {
        const response = await api.patch(`${baseUrl}/inventory/pairproductcustom/${productId}/`, {
            products_customs: customIds,
        });
        return response.data;
    } catch (error: any) {
        console.error("Failed to update product custom links:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to update product links");
    }
};

export const getAllRawItems = async () => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getallrawitems/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch raw items:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch raw items");
    }
};

export const getAllProducts = async () => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getallproducts/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch all products:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch all products");
    }
};

export const getProductById = async (productId: number) => {
    try {
        // Fallback: Fetch all products and filter, as the single product endpoint pattern is inconsistent
        const allProducts = await getAllProducts();
        const product = allProducts.find((p: MenuItemFormData) => p.id === productId);
        if (!product) throw new Error("Product not found");
        return product;
    } catch (error: any) {
        console.error(`Failed to fetch product ${productId}:`, error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch product");
    }
};

export const getAllCustomizables = async () => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getallcustomizables/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch all customizables:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch all customizables");
    }
};

export const updateProductInventory = async (productId: number, self_required_quantity?: number, self_quantity_in_stock?: number) => {
    try {
        const payload: any = {};
        if (self_required_quantity !== undefined) payload.self_required_quantity = self_required_quantity;
        if (self_quantity_in_stock !== undefined) payload.self_quantity_in_stock = self_quantity_in_stock;

        const response = await api.patch(`${baseUrl}/inventory/updateproduct/${productId}/`, payload);
        return response.data;
    } catch (error: any) {
        console.error("Failed to update product inventory:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to update product inventory");
    }
};

export const updateCustomizableInventory = async (customizableId: number, self_required_quantity?: number, self_quantity_in_stock?: number) => {
    try {
        const payload: any = {};
        if (self_required_quantity !== undefined) payload.self_required_quantity = self_required_quantity;
        if (self_quantity_in_stock !== undefined) payload.self_quantity_in_stock = self_quantity_in_stock;

        const response = await api.patch(`${baseUrl}/inventory/updatecustomizable/${customizableId}/`, payload);
        return response.data;
    } catch (error: any) {
        console.error("Failed to update customizable inventory:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to update customizable inventory");
    }
};



export const addRawItem = async (rawItem: RawItem) => {
    try {
        const response = await api.post(`${baseUrl}/inventory/addrawitem/`, rawItem);
        return response.data;
    } catch (error: any) {
        console.error("Failed to add raw item:", error.message);
        console.error("Error details:", error.response?.data);
        throw new Error(error.response?.data?.detail || "Failed to add raw item");
    }
};

export const updateRawItem = async (rawItemId: number, rawItem: Partial<RawItem>) => {
    try {
        const response = await api.patch(`${baseUrl}/inventory/updaterawitem/${rawItemId}/`, rawItem);
        return response.data;
    } catch (error: any) {
        console.error("Failed to update raw item:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to update raw item");
    }
};

export const addProductRecipe = async (productId: number, rawItemId: number, quantity_required: number) => {
    try {
        const response = await api.post(`${baseUrl}/inventory/addproductrecipe/`, {
            product: productId,
            raw_item: rawItemId,
            quantity_required: quantity_required
        });
        return response.data;
    } catch (error: any) {
        console.error("Failed to add product recipe:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to add product recipe");
    }
};

export const addCustomRecipe = async (customId: number, rawItemId: number, quantity_required: number) => {
    try {
        const response = await axios.post(`${baseUrl}/inventory/addcustomrecipe/`, {
            custom: customId,
            raw_item: rawItemId,
            quantity_required: quantity_required
        });
        return response.data;
    } catch (error: any) {
        console.error("Failed to add custom recipe:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to add custom recipe");
    }
};








export const getSaleItems = async (saleId: number) => {
    try {
        const response = await api.get(`${baseUrl}/inventory/getsaleitem/${saleId}/`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to fetch sale items for sale ${saleId}:`, error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch sale items");
    }
};

export const getSales = async (params?: {
    start_date?: string;
    end_date?: string;
    product_id?: number;
    custom_id?: number;
    sale_status?: string;
    search?: string;
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.start_date) queryParams.append('start_date', params.start_date);
        if (params?.end_date) queryParams.append('end_date', params.end_date);
        if (params?.product_id) queryParams.append('product_id', params.product_id.toString());
        if (params?.custom_id) queryParams.append('custom_id', params.custom_id.toString());
        if (params?.sale_status) queryParams.append('sale_status', params.sale_status);
        if (params?.search) queryParams.append('search', params.search);

        const response = await api.get(`${baseUrl}/inventory/getsales/${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch sales:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch sales");
    }
};
export const getBatchNames = async (page: number = 1, filters?: { search?: string, start_date?: string, end_date?: string }): Promise<PaginatedResponse<BatchName>> => {
    try {
        const params = { page, ...filters };
        const response = await api.get(`${baseUrl}/inventory/getbatchnames/`, { params });
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch batch names:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch batch names");
    }
};

export const cookBatch = async (batchId: number, multiplier: number = 1): Promise<{ detail: string }> => {
    try {
        const response = await api.post(`${baseUrl}/inventory/markbatchcooked/${batchId}/`, { multiplier });
        return response.data;
    } catch (error: any) {
        console.error("Failed to mark batch as cooked:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to mark batch as cooked");
    }
};

export const undoBatchCooking = async (logId: number): Promise<{ detail: string }> => {
    try {
        const response = await api.post(`${baseUrl}/inventory/undobatchcooking/${logId}/`);
        return response.data;
    } catch (error: any) {
        console.error("Failed to undo batch cooking:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to undo batch cooking");
    }
};

export const getBatchLogs = async (page: number = 1, filters?: { search?: string, start_date?: string, end_date?: string, batch_id?: number }): Promise<PaginatedResponse<BatchProductionLog>> => {
    try {
        const params = { page, ...filters };
        const response = await api.get(`${baseUrl}/inventory/getbatchlogs/`, { params });
        return response.data;
    } catch (error: any) {
        console.error("Failed to fetch batch logs:", error.message);
        throw new Error(error.response?.data?.detail || "Failed to fetch batch logs");
    }
};
