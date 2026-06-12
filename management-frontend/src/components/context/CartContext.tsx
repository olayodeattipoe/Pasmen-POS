import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Basket, Order, MenuItemFormData, BasketCustomization, PackageTemplate, PrintData } from '@/api/models';
import Receipt from '../homeComponents/Receipt';

interface CartContextType {
    baskets: Basket[];
    activeBasketIndex: number;
    setActiveBasketIndex: (index: number) => void;
    addToCart: (item: MenuItemFormData, customizations: BasketCustomization[], quantity: number) => void;
    removeFromCart: (basketId: string) => void;
    updateQuantity: (basketId: string, delta: number) => void;
    updateBasket: (basketId: string, item: MenuItemFormData, customizations: BasketCustomization[], quantity: number) => void;
    clearCart: () => void;
    totalAmount: string;
    order: Order;

    // Global Edit State
    editingBasket: Basket | null;
    isEditModalOpen: boolean;
    openEditModal: (basket: Basket) => void;
    closeEditModal: () => void;

    // Order Extras
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    specificDescription: string;
    setSpecificDescription: (desc: string) => void;
    isDelivery: boolean;
    setIsDelivery: (isDelivery: boolean) => void;
    deliveryNumber: string;
    setDeliveryNumber: (num: string) => void;

    // Packages
    packages: PackageTemplate[];
    loadTemplate: (template: PackageTemplate) => void;
    saveAsPackage: (basket: Basket, name: string) => void;
    deletePackage: (id: string) => void;
    duplicateBasket: (basketId: string) => void;
    triggerPrint: (data: PrintData) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [baskets, setBaskets] = useState<Basket[]>([]);
    const [activeBasketIndex, setActiveBasketIndex] = useState(0);

    // Edit Modal State
    const [editingBasket, setEditingBasket] = useState<Basket | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Order Extras State
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [specificDescription, setSpecificDescription] = useState('');
    const [isDelivery, setIsDelivery] = useState(false);
    const [deliveryNumber, setDeliveryNumber] = useState('');

    // Global Print State
    const [printData, setPrintData] = useState<PrintData | null>(null);

    // Packages State
    const [packages, setPackages] = useState<PackageTemplate[]>(() => {
        const saved = localStorage.getItem('pos_order_packages');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('pos_order_packages', JSON.stringify(packages));
    }, [packages]);

    useEffect(() => {
        if (baskets.length > 0 && activeBasketIndex >= baskets.length) {
            setActiveBasketIndex(baskets.length - 1);
        }
    }, [baskets.length, activeBasketIndex]);

    const totalAmount = useMemo(() => {
        // Helper to normalize pricing type
        const getPricingType = (type?: string) => {
            const raw = type?.toUpperCase().trim() || '';
            if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
            if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
            if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
            return raw.toLowerCase();
        };

        const total = baskets.reduce((acc, b) => {
            // Calculate product total
            const productType = getPricingType(b.product_pricing_type);
            const itemBase = productType === 'fixed'
                ? Number(b.product_price_sold) * b.product_quantity
                : Number(b.product_price_sold); // For VAR/FIX_VAR, quantity = price

            // Calculate customizations total
            const itemCustoms = b.customizations.reduce((cAcc, c) => {
                const customType = getPricingType(c.pricing_type);
                const customTotal = customType === 'fixed'
                    ? Number(c.custom_price_sold) * c.custom_quantity
                    : Number(c.custom_price_sold); // For VAR/FIX_VAR, quantity = price
                return cAcc + customTotal;
            }, 0);

            return acc + itemBase + itemCustoms;
        }, 0);
        return total.toFixed(2);
    }, [baskets]);

    const addToCart = (item: MenuItemFormData, customizations: BasketCustomization[], quantity: number) => {
        setBaskets(prev => {
            const isHeavy = ['DEFAULT', 'PACKAGES'].includes(item.type?.toUpperCase());
            const newBaskets = [...prev];
            const currentBasket = newBaskets[activeBasketIndex];
            const currentIsHeavy = currentBasket ? ['DEFAULT', 'PACKAGES'].includes(currentBasket.product_type?.toUpperCase()) : false;

            if (isHeavy) {
                if (currentIsHeavy || !currentBasket) {
                    const newId = Math.random().toString(36).substr(2, 9);
                    const newBasket: Basket = {
                        id: newId,
                        product_id: item.id || 0,
                        product_name: item.name,
                        product_price_sold: item.price,
                        product_quantity: quantity,
                        product_type: item.type,
                        product_pricing_type: item.pricing_type,
                        customizations: customizations
                    };
                    const updated = [...newBaskets, newBasket];
                    setActiveBasketIndex(updated.length - 1);
                    return updated;
                } else {
                    const oldMain: BasketCustomization = {
                        custom_id: currentBasket.product_id,
                        custom_name: currentBasket.product_name,
                        custom_price_sold: currentBasket.product_price_sold,
                        custom_quantity: currentBasket.product_quantity
                    };
                    newBaskets[activeBasketIndex] = {
                        ...currentBasket,
                        product_id: item.id || 0,
                        product_name: item.name,
                        product_price_sold: item.price,
                        product_quantity: quantity,
                        product_type: item.type,
                        product_pricing_type: item.pricing_type,
                        customizations: [...currentBasket.customizations, oldMain, ...customizations]
                    };
                    return newBaskets;
                }
            } else {
                if (currentBasket) {
                    const newCustom: BasketCustomization = {
                        custom_id: item.id || 0,
                        custom_name: item.name,
                        custom_price_sold: item.price,
                        custom_quantity: quantity
                    };
                    newBaskets[activeBasketIndex] = {
                        ...currentBasket,
                        customizations: [...currentBasket.customizations, newCustom]
                    };
                    return newBaskets;
                } else {
                    return [{
                        id: Math.random().toString(36).substr(2, 9),
                        product_id: item.id || 0,
                        product_name: item.name,
                        product_price_sold: item.price,
                        product_quantity: quantity,
                        product_type: item.type,
                        product_pricing_type: item.pricing_type,
                        customizations: customizations
                    }];
                }
            }
        });
    };

    const removeFromCart = (basketId: string) => {
        setBaskets(prev => prev.filter(b => b.id !== basketId));
    };

    const updateQuantity = (basketId: string, delta: number) => {
        setBaskets(prev => prev.map(b =>
            b.id === basketId
                ? { ...b, product_quantity: Math.max(1, b.product_quantity + delta) }
                : b
        ));
    };

    const updateBasket = (basketId: string, item: MenuItemFormData, customizations: BasketCustomization[], quantity: number) => {
        setBaskets(prev => prev.map(b =>
            b.id === basketId
                ? {
                    ...b,
                    product_id: item.id || 0,
                    product_name: item.name,
                    product_price_sold: item.price,
                    product_quantity: quantity,
                    product_type: item.type,
                    product_pricing_type: item.pricing_type,
                    customizations: customizations
                }
                : b
        ));
    };

    const openEditModal = (basket: Basket) => {
        setEditingBasket(basket);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setEditingBasket(null);
        setIsEditModalOpen(false);
    };

    const clearCart = () => {
        setBaskets([]);
        setPaymentMethod('CASH');
        setSpecificDescription('');
        setIsDelivery(false);
        setDeliveryNumber('');
    };

    const loadTemplate = (template: PackageTemplate) => {
        const mockBasket: Basket = {
            id: 'temp-' + Math.random().toString(36).substr(2, 9),
            product_id: template.product_id,
            product_name: template.product_name,
            product_price_sold: template.product_price_sold || 0,
            product_quantity: template.product_quantity,
            product_type: template.product_type,
            product_pricing_type: template.product_pricing_type,
            isTemplate: true,
            customizations: template.customizations.map(c => ({
                custom_id: c.custom_id,
                custom_name: c.custom_name,
                custom_price_sold: c.custom_price_sold || 0,
                custom_quantity: c.custom_quantity,
                pricing_type: c.pricing_type
            }))
        };
        openEditModal(mockBasket);
    };

    const saveAsPackage = (basket: Basket, name: string) => {
        const newPackage: PackageTemplate = {
            id: 'pkg-' + Math.random().toString(36).substr(2, 9),
            name: name,
            product_id: basket.product_id,
            product_name: basket.product_name,
            product_price_sold: basket.product_price_sold,
            product_quantity: basket.product_quantity,
            product_type: basket.product_type,
            product_pricing_type: basket.product_pricing_type,
            customizations: basket.customizations.map(c => ({
                custom_id: c.custom_id,
                custom_name: c.custom_name,
                custom_price_sold: c.custom_price_sold,
                custom_quantity: c.custom_quantity,
                pricing_type: c.pricing_type
            }))
        };
        setPackages(prev => [...prev, newPackage]);
    };

    const deletePackage = (id: string) => {
        setPackages(prev => prev.filter(p => p.id !== id));
    };

    const duplicateBasket = (basketId: string) => {
        setBaskets(prev => {
            const index = prev.findIndex(b => b.id === basketId);
            if (index === -1) return prev;

            const basketToClone = prev[index];
            const clonedBasket: Basket = {
                ...basketToClone,
                id: Math.random().toString(36).substr(2, 9),
                customizations: basketToClone.customizations.map(c => ({ ...c }))
            };

            const newBaskets = [...prev];
            newBaskets.splice(index + 1, 0, clonedBasket);
            return newBaskets;
        });
    };

    const triggerPrint = (data: PrintData) => {
        setPrintData(data);
        // Delay print to allow component to render
        setTimeout(() => {
            window.print();
            // Clear print data after dialog is closed/handled
            setTimeout(() => setPrintData(null), 1000);
        }, 500);
    };

    const getOrder = (): Order => {
        const order = {
            total_amount: totalAmount,
            payment_method: paymentMethod,
            specific_description: specificDescription,
            prepared_by_id: 0,
            processed_by_id: 0,
            baskets: baskets,
            is_delivery: isDelivery,
            delivery_number: deliveryNumber
        };
        console.log('🔍 CartContext - getOrder() called:', {
            is_delivery: order.is_delivery,
            delivery_number: order.delivery_number,
            full_order: order
        });
        return order;
    };

    return (
        <CartContext.Provider value={{
            baskets,
            activeBasketIndex,
            setActiveBasketIndex,
            addToCart,
            removeFromCart,
            updateQuantity,
            updateBasket,
            clearCart,
            totalAmount,
            order: getOrder(),
            editingBasket,
            isEditModalOpen,
            openEditModal,
            closeEditModal,
            paymentMethod,
            setPaymentMethod,
            specificDescription,
            setSpecificDescription,
            isDelivery,
            setIsDelivery,
            deliveryNumber,
            setDeliveryNumber,
            packages,
            loadTemplate,
            saveAsPackage,
            deletePackage,
            duplicateBasket,
            triggerPrint
        }}>
            {children}
            {/* Hidden Receipt for Printing (Global) */}
            {printData && (
                <div className="print-only">
                    <Receipt
                        orderNumber={printData.orderNumber}
                        baskets={printData.baskets}
                        totalAmount={printData.totalAmount}
                        paymentMethod={printData.paymentMethod}
                        description={printData.description}
                        serverName={printData.serverName}
                        isDelivery={printData.isDelivery}
                        deliveryNumber={printData.deliveryNumber}
                    />
                </div>
            )}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};
