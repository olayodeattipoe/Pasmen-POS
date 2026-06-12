import axios from 'axios';
import { Category, MenuItemFormData, Customizable, RawItem, Supplier, Purchase, RecipeItem, Sale, PaginatedResponse, LoginRequest, LoginResponse, TokenRefreshResponse, ApiResponse, RecipeItemProduct, RecipeItemCustomizable, User, Alert, BatchName, BatchProductionRecipe, BatchProductionLog } from './models';

const baseUrl = import.meta.env.VITE_API_BASE_URL; // API endpoint base

export const getCategories = async () => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/categories/`);
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch categories:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch categories");
  }
};

export const editCategory = async (category: Category) => {
  try {
    const response = await axios.patch(`${baseUrl}/inventory/categories/${category.id}/`, { "category_name": category.category_name });
    return response.data;
  } catch (error: any) {
    console.error("Failed to edit category:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to edit category");
  }
};

export const deleteCategory = async (category: Category) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/categories/${category.id}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete category:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete category");
  }
};

export const addCategory = async (category_name: string) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addcategory/`, { category_name: category_name });
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

      const response = await axios.post(`${baseUrl}/inventory/addproduct/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No image, send as JSON
      const { image, ...dataWithoutImage } = menuItem;
      const response = await axios.post(`${baseUrl}/inventory/addproduct/`, dataWithoutImage);
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
    const response = await axios.get(`${baseUrl}/inventory/getproductsbycategory/${category.id}/`);
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

      const response = await axios.put(`${baseUrl}/inventory/updateproduct/${menuItem.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No image, send as JSON
      const { image, id, ...dataWithoutImage } = menuItem;
      const response = await axios.put(`${baseUrl}/inventory/updateproduct/${id}/`, dataWithoutImage);
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
    const response = await axios.get(`${baseUrl}/inventory/getcustomizableheaders/`);
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch customizable headers:", error);
    //throw new Error(error.response?.data?.detail || "Failed to fetch customizable headers");
  }
};

export const addCustomizableHeaders = async (header_name: string) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addcustomizableheader/`, { header: header_name });
    console.log(response.data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch customizable headers:", error);
    //throw new Error(error.response?.data?.detail || "Failed to fetch customizable headers");
  }
};

export const getCustomizablesByHeader = async (headerId: number) => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getcustomizablesbyheader/${headerId}/`);
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

      const response = await axios.put(`${baseUrl}/inventory/updatecustomizable/${customizable.id}/`, formData, {
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
      const response = await axios.put(`${baseUrl}/inventory/updatecustomizable/${id}/`, payload);
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
    const response = await axios.delete(`${baseUrl}/inventory/updatecustomizable/${customizableId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete customizable:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete customizable");
  }
};

export const deleteProduct = async (productId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/updateproduct/${productId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete product:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete product");
  }
};

export const deleteCustomizableHeader = async (headerId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/getcustomizablesbyheader/${headerId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete customizable header:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete customizable header");
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

      const response = await axios.post(`${baseUrl}/inventory/addcustomizable/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // No image file, send as JSON
      const { image, ...dataWithoutImage } = customizable;
      const response = await axios.post(`${baseUrl}/inventory/addcustomizable/`, dataWithoutImage);
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
    const response = await axios.patch(`${baseUrl}/inventory/pairproductcustom/${productId}/`, {
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
    const response = await axios.get(`${baseUrl}/inventory/getallrawitems/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch raw items:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch raw items");
  }
};

export const getAllMainStoreRawItems = async () => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getallmainstorerawitems/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch main store raw items:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch main store raw items");
  }
};


export const getAllProducts = async () => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getallproducts/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch all products:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch all products");
  }
};

export const getAllCustomizables = async () => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getallcustomizables/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch all customizables:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch all customizables");
  }
};

export const updateProductInventory = async (productId: number, self_required_quantity?: number, self_quantity_in_stock?: number, should_read_alerts?: boolean) => {
  try {
    const payload: any = {};
    if (self_required_quantity !== undefined) payload.self_required_quantity = self_required_quantity;
    if (self_quantity_in_stock !== undefined) payload.self_quantity_in_stock = self_quantity_in_stock;
    if (should_read_alerts !== undefined) payload.should_read_alerts = should_read_alerts;

    const response = await axios.patch(`${baseUrl}/inventory/updateproduct/${productId}/`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update product inventory:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update product inventory");
  }
};

export const updateCustomizableInventory = async (customizableId: number, self_required_quantity?: number, self_quantity_in_stock?: number, should_read_alerts?: boolean) => {
  try {
    const payload: any = {};
    if (self_required_quantity !== undefined) payload.self_required_quantity = self_required_quantity;
    if (self_quantity_in_stock !== undefined) payload.self_quantity_in_stock = self_quantity_in_stock;
    if (should_read_alerts !== undefined) payload.should_read_alerts = should_read_alerts;

    const response = await axios.patch(`${baseUrl}/inventory/updatecustomizable/${customizableId}/`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update customizable inventory:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update customizable inventory");
  }
};

export const getSuppliers = async () => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getallsuppliers/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch suppliers:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch suppliers");
  }
};

export const addSupplier = async (supplier: Supplier) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addsupplier/`, supplier);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add supplier:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to add supplier");
  }
};

export const addPurchase = async (purchase: Omit<Purchase, 'id' | 'purchase_date'>) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addpurchase/`, purchase);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add purchase:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to add purchase");
  }
};

export const getAllPurchases = async (filters?: { startDate?: string, endDate?: string, rawItemId?: string, supplierId?: string }, page: number = 1) => {
  try {
    let url = `${baseUrl}/inventory/getallpurchases/`;
    const params = new URLSearchParams();

    params.append('page', page.toString());

    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.rawItemId) params.append('raw_item', filters.rawItemId);
    if (filters?.supplierId) params.append('supplier', filters.supplierId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch purchases:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch purchases");
  }
};

export const addRawItem = async (rawItem: RawItem) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addrawitem/`, rawItem);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add raw item:", error.message);
    console.error("Error details:", error.response?.data);
    throw new Error(error.response?.data?.detail || "Failed to add raw item");
  }
};

export const addMainStoreRawItem = async (rawItem: RawItem) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addmainstorerawitem/`, rawItem);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add raw item:", error.message);
    console.error("Error details:", error.response?.data);
    throw new Error(error.response?.data?.detail || "Failed to add raw item");
  }
};


export const updateRawItem = async (rawItemId: number, rawItem: Partial<RawItem>) => {
  try {
    const response = await axios.patch(`${baseUrl}/inventory/updaterawitem/${rawItemId}/`, rawItem);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update raw item:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update raw item");
  }
};




export const updateMainStoreRawItem = async (rawItemId: number, rawItem: Partial<RawItem>) => {
  try {
    const response = await axios.patch(`${baseUrl}/inventory/updatemainstorerawitem/${rawItemId}/`, rawItem);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update raw item:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update raw item");
  }
};

export const addProductRecipe = async (productId: number, rawItemId: number, quantity_required: number) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addproductrecipe/`, {
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

export const getSales = async (
  page: number = 1,
  startDate?: string,
  endDate?: string,
  userId?: number,
  status?: string,
  customerName?: string,
  preparedBy?: string,
  processedBy?: string,
  paymentMethod?: string,
  search?: string
): Promise<PaginatedResponse<Sale>> => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getsales/`, {
      params: {
        page,
        start_date: startDate,
        end_date: endDate,
        user_id: userId,
        status: status,
        customer_name: customerName,
        prepared_by: preparedBy,
        processed_by: processedBy,
        payment_method: paymentMethod,
        search: search
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch sales:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch sales");
  }
};

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

// Get Current User Info
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    const response = await authenticatedFetch(`${baseUrl}/inventory/users/me/`);
    return handleResponse<User>(response);
  } catch (error) {
    return { error: 'Network error.' };
  }
}

export const getAlerts = async (isRead?: boolean): Promise<Alert[]> => {
  const url = new URL(`${baseUrl}/inventory/alerts/`);
  if (isRead !== undefined) {
    url.searchParams.append('is_read', isRead.toString());
  }
  const response = await authenticatedFetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const markAlertAsRead = async (alertId: number): Promise<{ message: string }> => {
  const response = await authenticatedFetch(`${baseUrl}/inventory/alerts/${alertId}/read/`, {
    method: 'POST'
  });
  return response.json();
};

export const markAllAlertsAsRead = async (): Promise<{ message: string }> => {
  const response = await authenticatedFetch(`${baseUrl}/inventory/alerts/read-all/`, {
    method: 'POST'
  });
  return response.json();
};

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

// Authenticated Fetch Wrapper
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    ...options.headers,
  };
  return fetch(url, { ...options, headers });
}

// Recipe Management
export const getProductRecipe = async (productId: number): Promise<RecipeItemProduct[]> => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getproductrecipe/${productId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch product recipe:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch product recipe");
  }
};

export const getCustomRecipe = async (customId: number): Promise<RecipeItemCustomizable[]> => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getcustomrecipe/${customId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch custom recipe:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch custom recipe");
  }
};

export const adminCreateUser = async (userData: any) => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/createuser/`, userData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create user:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to create user");
  }
};

export const getUsers = async (page: number = 1, filters?: { search?: string, group?: string }) => {
  try {
    let url = `${baseUrl}/inventory/getusers/`;
    const params = new URLSearchParams();
    params.append('page', page.toString());

    if (filters?.search) params.append('search', filters.search);
    if (filters?.group) params.append('group', filters.group);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch users:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch users");
  }
};
export const getSalesAnalytics = async (filters?: { startDate?: string, endDate?: string }) => {
  try {
    let url = `${baseUrl}/inventory/salesanalytics/`;
    const params = new URLSearchParams();

    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch sales analytics:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch sales analytics");
  }
};

export const getSaleItems = async (sales_id: number) => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getsaleitem/${sales_id}/`);
    // The backend returns a list of items directly
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch sale items:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch sale items");
  }
};

export const updateSaleStatus = async (saleId: number, status: 'INQUEUE' | 'CANCELLED' | 'COMPLETED') => {
  try {
    // If status is COMPLETED, use the specific completion endpoint which handles inventory logic
    if (status === 'COMPLETED') {
      const response = await axios.post(`${baseUrl}/inventory/markorderascompleted/${saleId}/`);
      return response.data;
    } else {
      // For other status updates (INQUEUE, CANCELLED)
      const response = await axios.patch(`${baseUrl}/inventory/updatesalestatus/${saleId}/`, { status });
      return response.data;
    }
  } catch (error: any) {
    console.error("Failed to update sale status:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update sale status");
  }
};

export const adjustStock = async (adjustment: {
  item_type: 'PRODUCT' | 'CUSTOM' | 'RAW' | 'MAIN_STORE_RAW',
  item_id: number,
  adjustment_type: string,
  quantity: number,
  reason?: string
}) => {
  try {
    const accessToken = getAccessToken();
    const response = await axios.post(`${baseUrl}/inventory/adjuststock/`, adjustment, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to adjust stock:", error.message);
    throw new Error(error.response?.data?.error || "Failed to adjust stock");
  }
};

export const getInventoryLedger = async (params: {
  item_type: 'PRODUCT' | 'CUSTOM' | 'RAW' | 'MAIN_STORE_RAW',
  item_id: number,
  startDate?: string,
  endDate?: string
}) => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/inventoryledger/`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch inventory ledger:", error.message);
    throw new Error(error.response?.data?.error || "Failed to fetch inventory ledger");
  }
};
export const deleteUser = async (userId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/deleteuser/${userId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete user:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete user");
  }
};

export const deleteSupplier = async (supplierId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/deletesupplier/${supplierId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete supplier:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete supplier");
  }
};

export const deleteProductRecipeItem = async (productId: number, rawItemId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/deleteproductrecipe/${productId}/${rawItemId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete product recipe item:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete recipe item");
  }
};

export const deleteCustomRecipeItem = async (customId: number, rawItemId: number) => {
  try {
    const response = await axios.delete(`${baseUrl}/inventory/deletecustomrecipe/${customId}/${rawItemId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete custom recipe item:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete recipe item");
  }
};

export const getActivityLogs = async (page: number = 1, filters?: { user?: number, action?: string, startDate?: string, endDate?: string }) => {
  try {
    const accessToken = getAccessToken();
    let url = `${baseUrl}/inventory/activitylogs/`;
    const params = new URLSearchParams();

    params.append('page', page.toString());

    if (filters?.user) params.append('user', filters.user.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch activity logs:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch activity logs");
  }
}; export const getRevenueTrend = async (days: number = 7) => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/revenue-trend/`, {
      params: { days }
    });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch revenue trend:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch revenue trend");
  }
};

/**
 * Disburse a raw item to a branch.
 * branchHost should be "host:port" with no protocol (e.g. "localhost:8001").
 * The backend then contacts that branch internally.
 */
export const disburseRawItem = async (rawItemId: number, branchHost: string, quantity: number) => {
  try {
    const response = await axios.patch(
      `${baseUrl}/inventory/disberse_rawItem/${rawItemId}/${branchHost}/`,
      { quantity }
    );
    return response.data;
  } catch (error: any) {
    console.error("Failed to disburse raw item:", error.message);
    throw new Error(
      error.response?.data?.detail || error.response?.data?.error || "Failed to disburse raw item"
    );
  }
};

export const getBatchNames = async (page: number = 1, filters?: { search?: string, start_date?: string, end_date?: string }): Promise<PaginatedResponse<BatchName>> => {
  try {
    const params = { page, ...filters };
    const response = await axios.get(`${baseUrl}/inventory/getbatchnames/`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch batch names:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch batch names");
  }
};

export const addBatchName = async (name: string): Promise<BatchName> => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addbatchname/`, { name });
    return response.data;
  } catch (error: any) {
    console.error("Failed to add batch name:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to add batch name");
  }
};

export const deleteBatchName = async (batchId: number): Promise<void> => {
  try {
    await axios.delete(`${baseUrl}/inventory/deletebatchname/${batchId}/`);
  } catch (error: any) {
    console.error("Failed to delete batch name:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete batch name");
  }
};

export const getBatchProductionRecipes = async (): Promise<BatchProductionRecipe[]> => {
  try {
    const response = await axios.get(`${baseUrl}/inventory/getbatchproductionrecipes/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch batch production recipes:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch batch recipes");
  }
};

export const addBatchProductionRecipe = async (data: { batch_name: number, raw_item: number, quantity_required: number }): Promise<BatchProductionRecipe> => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/addbatchproductionrecipe/`, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to add batch recipe:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to add batch recipe");
  }
};

export const updateBatchProductionRecipe = async (recipeId: number, data: Partial<BatchProductionRecipe>): Promise<BatchProductionRecipe> => {
  try {
    const response = await axios.patch(`${baseUrl}/inventory/updatebatchproductionrecipe/${recipeId}/`, data);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update batch recipe:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to update batch recipe");
  }
};

export const deleteBatchProductionRecipe = async (recipeId: number): Promise<void> => {
  try {
    await axios.delete(`${baseUrl}/inventory/updatebatchproductionrecipe/${recipeId}/`);
  } catch (error: any) {
    console.error("Failed to delete batch recipe:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete batch recipe");
  }
};

export const cookBatch = async (batchId: number, multiplier: number = 1): Promise<{ detail: string }> => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/markbatchcooked/${batchId}/`, { multiplier });
    return response.data;
  } catch (error: any) {
    console.error("Failed to mark batch as cooked:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to mark batch as cooked");
  }
};

export const undoBatchCooking = async (logId: number): Promise<{ detail: string }> => {
  try {
    const response = await axios.post(`${baseUrl}/inventory/undobatchcooking/${logId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to undo batch cooking:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to undo batch cooking");
  }
};

export const getBatchLogs = async (page: number = 1, filters?: { search?: string, start_date?: string, end_date?: string, batch_id?: number }): Promise<PaginatedResponse<BatchProductionLog>> => {
  try {
    const params = { page, ...filters };
    const response = await axios.get(`${baseUrl}/inventory/getbatchlogs/`, { params });
    return response.data;
  } catch (error: any) {
    console.error("Failed to fetch batch logs:", error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch batch logs");
  }
};
