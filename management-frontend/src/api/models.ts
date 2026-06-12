export interface Category {
    id: number;
    category_name: string;
}

export interface MenuItemFormData {
    // Required fields
    id?: number;
    name: string;
    category: number; //in actual snse category_id
    unit: string;
    price: number;
    type: string;
    pricing_type: string;
    is_available: boolean;
    // Optional fields
    description?: string;
    image?: File | null;
    alias?: string;
    adjustable: boolean;
    self_required_quantity?: number;
    self_quantity_in_stock?: number;

    // Conditional fields
    quantity_if_package?: number;
    price_if_package?: number;
    array_if_fixed_variable?: number[];
    products_customs?: Array<number | Customizable>;
}


export interface AddMenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSubmit: (formData: MenuItemFormData) => void;
    item?: MenuItemFormData | null; // Optional item for editing
}

export interface CustomizableHeader {
    id: number;
    header: string;
}

export interface Customizable {
    id?: number;
    name: string;
    description?: string;
    is_available: boolean;
    unit: string;
    price: number;
    image?: File | string | null;
    quantity_if_package?: number;
    price_if_package?: number;
    adjustable: boolean;
    self_required_quantity?: number;
    self_quantity_in_stock?: number;
    alias?: string;
    pricing_type: string;
    array_if_fixed_variable?: number[];
    customizable_header: number;
}

export interface AddCustomizableModalProps {
    isOpen: boolean;
    onClose: () => void;
    headers: CustomizableHeader[];
    selectedHeaderId: number | null;
    onSubmit: (formData: Customizable) => void;
    item?: Customizable | null; // Optional item for editing
}



export interface RawItem {
    id?: number;
    name: string;
    unit: string;
    type: string;
    description: string;
    quantity_in_stock: number;
    unit_batch_quantity: number;
    supplied_by: number[]; // Array of supplier IDs
    reorder_level: number;
}

export interface AddTransformableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: RawItem) => void;
    item?: RawItem | null; // Optional item for editing
}

export interface RecipeItem {
    id?: number;
    raw_item: number; // Raw item ID
    quantity_required: number;
    raw_item_name?: string; // For display purposes
    raw_item_unit?: string; // For display purposes
}

export interface RecipeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: number;
    itemName: string;
    itemType: 'product' | 'custom';
    rawItems: RawItem[];
    existingRecipes?: RecipeItem[];
    onRecipeAdded?: () => void;
}

export type ProductType = 'STANDALONE' | 'PACKAGES' | 'DEFAULT';

export interface BasketCustomization {
    custom_id: number;
    custom_name: string;
    custom_price_sold: number;
    custom_quantity: number;
    pricing_type?: string; // To determine display logic (VAR, FIX, FIX_VAR)
}

export interface Basket {
    id?: string; // Client-side unique ID for the basket/line-item
    product_id: number;
    product_name: string;
    product_price_sold: number;
    product_quantity: number;
    product_type: string;
    product_pricing_type?: string; // To determine display logic (VAR, FIX, FIX_VAR)
    customizations: BasketCustomization[];
    isTemplate?: boolean;
}

export interface Order {
    total_amount: string;
    payment_method: string;
    specific_description: string;
    prepared_by_id: number;
    processed_by_id: number;
    baskets: Basket[];
    is_delivery?: boolean;
    delivery_number?: string;
}

export interface PrintData {
    orderNumber: string;
    baskets: Basket[];
    totalAmount: string;
    paymentMethod: string;
    description: string;
    date?: string;
    serverName?: string;
    isDelivery?: boolean;
    deliveryNumber?: string;
}

export interface PackageTemplateCustomization {
    custom_id: number;
    custom_name: string;
    custom_quantity: number;
    custom_price_sold: number;
    pricing_type?: string;
}

export interface PackageTemplate {
    id: string;
    name: string;
    product_id: number;
    product_name: string;
    product_price_sold: number;
    product_quantity: number;
    product_type: string;
    product_pricing_type?: string;
    customizations: PackageTemplateCustomization[];
}

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

export interface User {
    id: string;
    username: string;
    groups?: string[];
    [key: string]: any;
}



export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface CustomerInfo {
    id: number | null;
    username: string;
    first_name: string;
    last_name: string;
}

// Sale related models
export interface Sale {
    id: number;
    sales_id: string;
    sale_date: string;
    total_amount: string;
    payment_method: string;
    daily_sequence_number: number;
    specific_description: string;
    customer: CustomerInfo;
    prepared_by: { id: number; username: string } | null;
    processed_by: { id: number; username: string } | null;
    sale_status: string;
    is_delivery: boolean;
    delivery_number: string;
}

export interface SaleItem {
    id: number;
    item_type: 'PRODUCT' | 'CUSTOM';
    product: number | null;
    custom: number | null;
    item_name: string;
    pricing_type: string;
    quantity: number;
    price_sold: string;
}

// Wrapper for API responses
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export interface BatchName {
    id: number;
    name: string;
    date_created: string;
}

export interface BatchProductionLog {
    id: number;
    batch: number;
    batch_name_display?: string;
    multiplier: number | string;
    produced_at: string;
    produced_by: number | null;
    produced_by_name?: string;
    is_reversed: boolean;
}

export interface BatchProductionRecipe {
    id: number;
    batch_name: number;
    batch_name_display?: string;
    raw_item: number;
    raw_item_name_display?: string;
    unit_display?: string;
    quantity_required: number;
}