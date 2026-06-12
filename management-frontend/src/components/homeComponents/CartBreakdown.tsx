import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Settings, ChefHat, Loader2, Copy } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Basket, PrintData } from '@/api/models';
import { addSaleSaleItem } from "@/api/features";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../context/AuthContext";

interface CartBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartBreakdown({ isOpen, onClose }: CartBreakdownProps) {
    const {
        baskets,
        totalAmount,
        order,
        removeFromCart,
        clearCart,
        openEditModal,
        paymentMethod,
        setPaymentMethod,
        specificDescription,
        setSpecificDescription,
        isDelivery,
        setIsDelivery,
        deliveryNumber,
        setDeliveryNumber,
        saveAsPackage,
        duplicateBasket,
        triggerPrint
    } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const calculateBasketTotal = (basket: Basket) => {
        // Helper to normalize pricing type
        const getPricingType = (type?: string) => {
            const raw = type?.toUpperCase().trim() || '';
            if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
            if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
            if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
            return raw.toLowerCase();
        };

        // Calculate main product price
        const productPricingType = getPricingType(basket.product_pricing_type);
        const base = productPricingType === 'fixed'
            ? Number(basket.product_price_sold) * basket.product_quantity
            : Number(basket.product_price_sold); // For VAR/FIX_VAR, quantity = price, so just use price

        // Calculate customizations price
        const customs = basket.customizations.reduce((acc: number, c: any) => {
            const customPricingType = getPricingType(c.pricing_type);
            const customTotal = customPricingType === 'fixed'
                ? Number(c.custom_price_sold) * c.custom_quantity
                : Number(c.custom_price_sold); // For VAR/FIX_VAR, quantity = price, so just use price
            return acc + customTotal;
        }, 0);

        return base + customs;
    };

    const groupIdenticalBaskets = (items: Basket[]) => {
        const groups: { basket: Basket; count: number; ids: string[]; identity: string }[] = [];

        items.forEach(item => {
            // Create a stable identity key for this bowl configuration
            const sortedCustoms = [...item.customizations].sort((a, b) => a.custom_id - b.custom_id);
            const identity = `${item.product_id}-${item.product_quantity}-${item.product_price_sold}-` +
                sortedCustoms.map(c => `${c.custom_id}:${c.custom_quantity}:${c.custom_price_sold}`).join('|');

            const existingGroup = groups.find(g => g.identity === identity);

            if (existingGroup) {
                existingGroup.count += 1;
                existingGroup.ids.push(item.id!);
            } else {
                groups.push({ basket: item, count: 1, ids: [item.id!], identity });
            }
        });

        return groups;
    };

    const groupedBaskets = groupIdenticalBaskets(baskets);

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] bg-background border-foreground/10 p-0 flex flex-col font-sans">
                <SheetHeader className="px-6 py-4 bg-card/80 border-b border-foreground/10 sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-400 rounded-lg">
                                <ShoppingBag className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-foreground uppercase tracking-tight">
                                    Checkout
                                </SheetTitle>
                                <SheetDescription className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-0.5">
                                    {baskets.length} Bowl{baskets.length !== 1 ? 's' : ''} in your cart
                                </SheetDescription>
                            </div>
                        </div>
                        {baskets.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 text-[10px] font-bold uppercase tracking-widest gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-6">
                    {baskets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                <ShoppingBag className="w-10 h-10 text-gray-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-300">Your cart is empty</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-[200px]">Looks like you haven't added anything to your order yet.</p>
                            </div>
                            <Button
                                onClick={onClose}
                                className="bg-yellow-400 text-black font-bold hover:bg-yellow-500 px-8 rounded-xl"
                            >
                                Browse Menu
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="space-y-6">
                                {groupedBaskets.map((group, index) => {
                                    const { basket, count, ids, identity } = group;
                                    return (
                                        <div key={identity} className="group relative">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center text-[10px] font-bold text-yellow-500">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-foreground group-hover:text-yellow-600 transition-colors uppercase tracking-tight flex items-center gap-2">
                                                            Bowl {index + 1}
                                                            {count > 1 && (
                                                                <span className="bg-yellow-400 text-black px-1.5 py-0.5 rounded text-[9px] font-black animate-in zoom-in-75 duration-300">
                                                                    x{count}
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest">
                                                            {1 + basket.customizations.length} Items Total
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            openEditModal(basket);
                                                            onClose();
                                                        }}
                                                        className="h-8 px-3 rounded-lg hover:bg-yellow-400/20 text-muted-foreground hover:text-yellow-600 border border-transparent hover:border-yellow-400/10 text-[10px] font-bold uppercase tracking-widest gap-2"
                                                    >
                                                        <Settings className="w-3.5 h-3.5" />
                                                        Modify
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFromCart(ids[0])}
                                                        className="h-8 w-8 rounded-lg hover:bg-red-400/20 text-muted-foreground hover:text-red-500 border border-transparent hover:border-red-400/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => duplicateBasket(ids[0])}
                                                        title="Duplicate Bowl"
                                                        className="h-8 w-8 rounded-lg hover:bg-blue-400/20 text-muted-foreground hover:text-blue-400 border border-transparent hover:border-blue-400/10"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const name = prompt("Enter a name for this package:", basket.product_name);
                                                            if (name) {
                                                                saveAsPackage(basket, name);
                                                                toast({
                                                                    title: "Package Saved",
                                                                    description: `"${name}" has been added to your packages.`,
                                                                });
                                                            }
                                                        }}
                                                        className="h-8 px-2 rounded-lg hover:bg-purple-400/20 text-purple-400 border border-transparent hover:border-purple-400/10 text-[9px] font-bold uppercase tracking-widest"
                                                    >
                                                        Save Pkg
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl overflow-hidden">
                                                {/* Main Product */}
                                                <div className="p-4 flex items-center justify-between bg-foreground/[0.03]">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-foreground line-clamp-1 uppercase tracking-tight">{basket.product_name}</span>
                                                            <span className="text-[8px] text-muted-foreground font-semibold uppercase tracking-widest">Main Product</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        {/* Only show quantity for FIXED pricing type */}
                                                        {(() => {
                                                            const getPricingType = (type?: string) => {
                                                                const raw = type?.toUpperCase().trim() || '';
                                                                if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
                                                                if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
                                                                if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
                                                                return raw.toLowerCase();
                                                            };
                                                            const pricingType = getPricingType(basket.product_pricing_type);
                                                            const displayPrice = pricingType === 'fixed'
                                                                ? Number(basket.product_price_sold) * basket.product_quantity
                                                                : Number(basket.product_price_sold); // For VAR/FIX_VAR, qty=price, so don't multiply

                                                            return (
                                                                <>
                                                                    {pricingType === 'fixed' && (
                                                                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">x{basket.product_quantity}</span>
                                                                    )}
                                                                    <span className="text-[11px] font-bold text-foreground tabular-nums">
                                                                        GHS {displayPrice.toFixed(2)}
                                                                    </span>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>

                                                {/* Customizations */}
                                                {basket.customizations.map((custom, cIdx) => {
                                                    // Normalize pricing type
                                                    const getPricingType = (type?: string) => {
                                                        const raw = type?.toUpperCase().trim() || '';
                                                        if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
                                                        if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
                                                        if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
                                                        return raw.toLowerCase();
                                                    };

                                                    const pricingType = getPricingType(custom.pricing_type);
                                                    const isFixed = pricingType === 'fixed';

                                                    return (
                                                        <div key={cIdx} className="px-4 py-3 flex items-center justify-between border-t border-foreground/5">
                                                            <div className="flex items-center gap-3 pl-4">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                                                                <span className="text-xs font-bold text-muted-foreground">{custom.custom_name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                {/* Only show quantity for FIXED type */}
                                                                {isFixed && (
                                                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">x{custom.custom_quantity}</span>
                                                                )}
                                                                <span className="text-xs font-bold text-foreground/80 tabular-nums">
                                                                    GHS {(isFixed
                                                                        ? Number(custom.custom_price_sold) * custom.custom_quantity
                                                                        : Number(custom.custom_price_sold)
                                                                    ).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Basket Subtotal */}
                                                <div className="px-4 py-2.5 bg-foreground/[0.04] flex items-center justify-between border-t border-foreground/10">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Subtotal {count > 1 && `(x${count})`}</span>
                                                    <span className="text-xs font-bold text-foreground tabular-nums">
                                                        GHS {(calculateBasketTotal(basket) * count).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Payment Method & Description Section */}
                            <div className="space-y-5 pt-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    Payment Method
                                </label>
                                <div className="p-1 bg-foreground/[0.03] border border-foreground/5 rounded-xl flex gap-1">
                                    <button
                                        onClick={() => setPaymentMethod('CASH')}
                                        className={`
                                                flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all
                                                ${paymentMethod === 'CASH'
                                                ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/10 translate-y-[-1px]'
                                                : 'text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5'}
                                            `}
                                    >
                                        Cash
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('MoM0')}
                                        className={`
                                                flex-1 h-10 rounded-lg flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all
                                                ${paymentMethod === 'MoM0'
                                                ? 'bg-card text-foreground shadow-sm ring-1 ring-foreground/10 translate-y-[-1px]'
                                                : 'text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5'}
                                            `}
                                    >
                                        MoMo
                                    </button>
                                </div>
                            </div>

                            {/* Delivery Section */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                        Is Delivery?
                                    </label>
                                    <button
                                        onClick={() => setIsDelivery(!isDelivery)}
                                        className={`
                                            w-12 h-6 rounded-full transition-all relative
                                            ${isDelivery ? 'bg-yellow-400' : 'bg-foreground/10'}
                                        `}
                                    >
                                        <div className={`
                                            absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                                            ${isDelivery ? 'left-7' : 'left-1'}
                                        `} />
                                    </button>
                                </div>

                                {isDelivery && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                            Delivery Contact / Number
                                        </label>
                                        <input
                                            type="text"
                                            value={deliveryNumber}
                                            onChange={(e) => setDeliveryNumber(e.target.value)}
                                            placeholder="Enter phone number or delivery ref..."
                                            className="w-full h-10 rounded-xl bg-foreground/[0.03] border border-foreground/[0.08] px-4 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all font-bold"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    Specific Description
                                    <span className="text-[8px] font-medium text-muted-foreground/30 ml-auto">Optional</span>
                                </label>
                                <textarea
                                    value={specificDescription}
                                    onChange={(e) => setSpecificDescription(e.target.value)}
                                    placeholder="Add any specific instructions for the kitchen..."
                                    className="w-full h-20 rounded-xl bg-foreground/[0.03] border border-foreground/[0.08] p-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-yellow-400/50 focus:border-yellow-400/50 focus:bg-background/80 resize-none transition-all"
                                />
                            </div>
                        </div>
                    )}
                </ScrollArea>

                {baskets.length > 0 && (
                    <div className="px-6 py-6 bg-card border-t border-foreground/10 space-y-4">
                        <div className="flex flex-col gap-2 p-5 bg-foreground/[0.02] rounded-2xl border border-foreground/[0.08]">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Payable</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[11px] font-black text-yellow-500 uppercase tracking-tighter">GHS</span>
                                    <span className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                                        {Number(totalAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 bg-yellow-400 hover:bg-yellow-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-yellow-500/10 transition-all duration-300 group disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                            onClick={async () => {
                                try {
                                    setIsSubmitting(true);
                                    console.log("--- SENDING ORDER TO KITCHEN ---", order);
                                    console.log("🚚 Delivery Info:", {
                                        is_delivery: order.is_delivery,
                                        delivery_number: order.delivery_number,
                                        isDelivery_state: isDelivery,
                                        deliveryNumber_state: deliveryNumber
                                    });
                                    const result = await addSaleSaleItem(order);

                                    if (result) {
                                        console.log("Order Successful:", result);
                                        const orderNum = result["Order Number"] || "???";
                                        const formattedOrderNum = typeof orderNum === 'number'
                                            ? `#${orderNum.toString().padStart(3, '0')}`
                                            : `#${orderNum}`;

                                        // Prepare data for printing
                                        const printJob: PrintData = {
                                            orderNumber: formattedOrderNum,
                                            baskets: [...baskets],
                                            totalAmount: totalAmount,
                                            paymentMethod: paymentMethod,
                                            description: specificDescription,
                                            serverName: user?.username || 'Admin',
                                            isDelivery: isDelivery,
                                            deliveryNumber: deliveryNumber
                                        };

                                        // Trigger global print
                                        triggerPrint(printJob);

                                        clearCart();
                                        onClose();

                                        toast({
                                            title: "Order Sent to Kitchen",
                                            description: (
                                                <div className="flex flex-col gap-3 py-2">
                                                    <span className="text-sm font-medium">Order processed successfully.</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Order ID:</span>
                                                        <span className="text-4xl font-black text-white bg-yellow-500 px-4 py-2 rounded-xl tabular-nums shadow-2xl shadow-yellow-500/40 animate-in zoom-in-75 duration-500">
                                                            {formattedOrderNum}
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                            duration: 20000, // 20 seconds
                                        });
                                    }
                                } catch (error) {
                                    console.error("Order failed:", error);
                                    toast({
                                        title: "Order Failed",
                                        description: "Failed to send order to kitchen. Please try again.",
                                        variant: "destructive",
                                    });
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                            ) : (
                                <ChefHat className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                            )}
                            {isSubmitting ? "Processing..." : "Send to Kitchen"}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
