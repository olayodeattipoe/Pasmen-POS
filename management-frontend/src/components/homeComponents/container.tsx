import { Settings } from "lucide-react";
import { Basket } from "@/api/models";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "../context/CartContext";

export default function Container() {
    const { baskets, activeBasketIndex, setActiveBasketIndex, openEditModal } = useCart();

    const calculateBasketTotal = (basket: Basket) => {
        // Helper to normalize pricing type
        const getPricingType = (type?: string) => {
            const raw = type?.toUpperCase().trim() || '';
            if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
            if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
            if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
            return raw.toLowerCase();
        };

        const productType = getPricingType(basket.product_pricing_type);
        const base = productType === 'fixed' 
            ? Number(basket.product_price_sold) * basket.product_quantity
            : Number(basket.product_price_sold); // For VAR/FIX_VAR, quantity = price
        
        const customs = basket.customizations.reduce((acc, c) => {
            const customType = getPricingType(c.pricing_type);
            const customTotal = customType === 'fixed'
                ? Number(c.custom_price_sold) * c.custom_quantity
                : Number(c.custom_price_sold); // For VAR/FIX_VAR, quantity = price
            return acc + customTotal;
        }, 0);
        
        return base + customs;
    };

    return (
        <div className="relative bg-gray-900/30 border-b border-white/5 py-3 font-sans">
            <div className="overflow-x-auto flex gap-4 px-6 hide-scrollbar pb-1"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none'
                }}>
                <div className="flex gap-4 min-w-max items-center">
                    {baskets.length === 0 ? (
                        <div className="flex items-center justify-center w-[260px] h-[60px] rounded-xl border border-dashed border-white/10 bg-gray-800/10 text-gray-500 text-xs italic">
                            No active baskets
                        </div>
                    ) : (
                        baskets.map((basket, index) => {
                            const isSelected = activeBasketIndex === index;

                            return (
                                <div
                                    key={basket.id || index}
                                    onClick={() => setActiveBasketIndex(index)}
                                    className={cn(
                                        "flex-shrink-0 transition-all duration-300 transform cursor-pointer group",
                                        isSelected ? 'scale-[1.02]' : 'scale-100 opacity-60 hover:opacity-90'
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl border backdrop-blur-md transition-all duration-300 min-w-[170px]",
                                        isSelected
                                            ? 'bg-yellow-400/10 border-yellow-400/30 shadow-[0_4px_15px_rgba(250,204,21,0.08)]'
                                            : 'bg-gray-800/20 border-white/5 hover:bg-gray-800/40'
                                    )}>
                                        {/* Basket Label */}
                                        <div className="flex flex-col items-center justify-center min-w-fit">
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.1em]",
                                                isSelected ? "text-yellow-500" : "text-gray-500"
                                            )}>Basket</span>
                                            <span className={cn(
                                                "text-sm font-black tabular-nums leading-none",
                                                isSelected ? "text-white" : "text-gray-400"
                                            )}>#{index + 1}</span>
                                        </div>

                                        {/* Divider */}
                                        <div className="w-[1px] h-5 bg-white/10" />

                                        {/* Dish Info */}
                                        <div className="flex flex-col min-w-0 max-w-[90px]">
                                            <span className={cn(
                                                "text-[11px] font-black truncate leading-tight",
                                                isSelected ? "text-white" : "text-gray-300"
                                            )}>
                                                {basket.product_name}
                                            </span>
                                            <span className="text-[7px] text-gray-500 font-bold uppercase tracking-tighter opacity-70">
                                                {basket.customizations.length > 0 ? `+${basket.customizations.length}` : 'Std'}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center gap-1.5 bg-black/20 rounded-lg px-2 py-1 border border-white/5 ml-auto">
                                            <span className="text-[9px] font-bold text-yellow-500/80 uppercase">GHS</span>
                                            <span className="text-[12px] font-black text-white tabular-nums">
                                                {calculateBasketTotal(basket).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Edit Trigger */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(basket);
                                            }}
                                            className={cn(
                                                "h-7 w-7 rounded-lg transition-all border border-transparent shrink-0",
                                                isSelected
                                                    ? "bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 border-yellow-400/20"
                                                    : "text-gray-500 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Settings className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
