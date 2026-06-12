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
    should_read_alerts?: boolean;
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
    should_read_alerts?: boolean;
}

export interface AddCustomizableModalProps {
    isOpen: boolean;
    onClose: () => void;
    headers: CustomizableHeader[];
    selectedHeaderId: number | null;
    onSubmit: (formData: Customizable) => void;
    item?: Customizable | null; // Optional item for editing
}

export interface Supplier {
    id: number;
    name: string;
    contact_info: string;
    address: string;
}

export interface Purchase {
    id: number;
    raw_item: number;
    quantity: number;
    purchase_date: string;
    supplier: number;
    total_cost: number;
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
    should_read_alerts?: boolean;
}

export interface AddTransformableModalProps {
    isOpen: boolean;
    onClose: () => void;
    suppliers: Supplier[];
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

export enum SaleStatus {
    INQUEUE = 'In Queue',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
    CASH = 'CASH',
    MOMO = 'MoMO'
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

// Wrapper for API responses
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}

export interface User {
    id: number | string;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
}

export interface Sale {
    id: number;
    sales_id: string;
    sale_date: string;
    total_amount: string;
    payment_method: PaymentMethod;
    specific_description?: string;
    customer?: User;
    prepared_by?: User;
    processed_by?: User;
    sale_status: SaleStatus;
    is_delivery: boolean;
    delivery_number?: string;
}

export interface Products extends MenuItemFormData { }

export interface SaleItem {
    id: number;
    sale: number;
    item_type: 'PRODUCT' | 'CUSTOM';
    product?: Products;
    custom?: Customizable;
    item_name?: string;
    quantity: number;
    price_sold: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
    total_sales_volume?: number;
    total_orders_count?: number;
    completed_orders_count?: number;
}

export interface RecipeItemProduct {
    id: number;
    raw_item: number;
    product: number;
    quantity_required: number;
    product_name?: string;
    recipe_name?: string;
}

export interface RecipeItemCustomizable {
    id: number;
    raw_item: number;
    custom: number;
    quantity_required: number;
    custom_name?: string;
    recipe_name?: string;
}

export enum AdjustmentType {
    WASTAGE = 'WASTAGE',
    SPOILAGE = 'SPOILAGE',
    LEFTOVER = 'LEFTOVER',
    CUSTOM_ADD = 'CUSTOM_ADD',
    CUSTOM_DEDUCT = 'CUSTOM_DEDUCT',
    SYSTEM_CORRECTION_ADD = 'SYSTEM_CORRECTION_ADD',
    SYSTEM_CORRECTION_DEDUCT = 'SYSTEM_CORRECTION_DEDUCT'
}

export interface StockAdjustment {
    id: number;
    item_type: 'PRODUCT' | 'CUSTOM' | 'RAW' | 'MAIN_STORE_RAW';
    product?: number;
    custom?: number;
    raw_item?: number;
    adjustment_type: AdjustmentType;
    quantity: number;
    reason?: string;
    adjusted_by: number;
    adjusted_by_name: string;
    item_name: string;
    created_at: string;
}

export interface LedgerMovement {
    date: string;
    type: string;
    reference: string;
    change: number;
    balance: number;
    reason: string;
}

export interface InventoryLedger {
    item_name: string;
    opening_stock: number;
    closing_stock: number;
    movements: LedgerMovement[];
}

export enum AlertType {
    LOW_STOCK = 'LOW_STOCK',
    OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum AlertSeverity {
    WARN = 'WARN',
    CRITICAL = 'CRITICAL'
}

export interface Alert {
    id: number;
    item_type: 'PRODUCT' | 'CUSTOM' | 'RAW';
    product?: number;
    custom?: number;
    raw_item?: number;
    item_name: string;
    alert_type: AlertType;
    severity: AlertSeverity;
    message: string;
    is_active: boolean;
    is_read: boolean;
    created_at: string;
    updated_at: string;
}

export interface ActivityLog {
    id: number;
    user: string; // Username from backend (source='user.username')
    action: string;
    endpoint: string;
    timestamp: string;
    details: any;
    ip_address: string | null;
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