// Authentication Models
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface TokenRefreshRequest {
    refresh: string;
}

export interface TokenRefreshResponse {
    access: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface User {
    id: string;
    username: string;
    // Add other fields as needed based on the backend serializer
    [key: string]: any;
}

export enum SaleStatus {
    INQUEUE = 'INQUEUE',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface Sale {
    id: string | number;
    sale_status: SaleStatus;
    prepared_by: User | null;
    sale_date: string;
    // Add other fields as needed based on the backend serializer
    [key: string]: any;
}

export interface SaleCustomization {
    custom_id: number;
    custom_name: string;
    custom_price_sold: number | string;
    custom_quantity: number;
}

export interface RawSaleItem {
    id: number;
    item_type: 'PRODUCT' | 'CUSTOM';
    item_name: string;
    quantity: number;
    price_sold: string;
    pricing_type?: 'FIX' | 'VAR' | 'FIX_VAR';
    sale: number;
    product: number | null;
    custom: number | null;
}

export interface SaleItem {
    product_id: number;
    product_name: string;
    product_price_sold: number | string;
    product_quantity: number;
    customizations: SaleCustomization[];
}

export type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed';

export interface Customization {
    custom_id: number;
    custom_name: string;
    custom_price_sold: number;
    custom_quantity: number;
    pricing_type?: 'FIX' | 'VAR' | 'FIX_VAR';
}

export interface BasketItem {
    product_id: number;
    product_name: string;
    product_price_sold: number;
    product_quantity: number;
    pricing_type?: 'FIX' | 'VAR' | 'FIX_VAR';
    customizations: Customization[];
}

export interface Order {
    id: string; // Internal UUID
    orderNumber: string; // Display number
    customer: {
        id: number;
        name: string;
        phone: string;
    };
    order: {
        total_amount: string;
        payment_method: string;
        specific_description: string;
        prepared_by_id: number;
        processed_by_id: number;
        baskets: BasketItem[];
    };
    status: OrderStatus;
    createdAt: Date;
    priority: 'normal' | 'rush';
}

export interface AuthError {
    detail: string;
}

// API Response wrapper
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
