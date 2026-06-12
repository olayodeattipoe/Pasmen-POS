import { useState, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Check, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { MenuItemFormData, Customizable, CustomizableHeader, BasketCustomization, Basket } from '@/api/models';
import { getCustomizableHeaders, getCustomizablesByHeader } from '@/api/features';
import { useCart } from '../context/CartContext';

interface CustomizePanelProps {
    item: MenuItemFormData;
    onClose: () => void;
}

interface GroupedOptions {
    header: string;
    items: Customizable[];
}

export default function CustomizePanel({ item, onClose }: CustomizePanelProps) {
    const [groupedOptions, setGroupedOptions] = useState<GroupedOptions[]>([]);
    const [loading, setLoading] = useState(true);
    const [selections, setSelections] = useState<Record<number, boolean>>({});
    const [quantities, setQuantities] = useState<Record<number, number>>({});
    const [baseQuantity, setBaseQuantity] = useState(1);
    const { addToCart, updateBasket, baskets, activeBasketIndex, editingBasket, saveAsPackage } = useCart();

    // Effect to pre-populate data if editing
    useEffect(() => {
        if (editingBasket && editingBasket.product_id === item.id) {
            // For main product: restore baseQuantity from product_quantity
            // But for VAR/FIX_VAR, we need to reverse-engineer the step from the price
            const mainType = getNormalizedType(item.pricing_type);

            if (mainType === 'fixed') {
                // For FIXED: quantity is the actual quantity
                setBaseQuantity(editingBasket.product_quantity);
            } else if (mainType === 'variable') {
                // For VAR: quantity = price, so step = price
                setBaseQuantity(Number(editingBasket.product_price_sold));
            } else if (mainType === 'fixed variable') {
                // For FIX_VAR: quantity = price, find which step this price corresponds to
                const savedPrice = Number(editingBasket.product_price_sold);
                if (Number(item.price) === savedPrice) {
                    setBaseQuantity(1); // Base price
                } else if (item.array_if_fixed_variable) {
                    const idx = item.array_if_fixed_variable.findIndex(p => Number(p) === savedPrice);
                    if (idx !== -1) {
                        setBaseQuantity(idx + 2); // Step 2 = array[0], Step 3 = array[1], etc.
                    }
                }
            }

            const initialSelections: Record<number, boolean> = {};
            const initialQuantities: Record<number, number> = {};

            editingBasket.customizations.forEach(c => {
                initialSelections[c.custom_id] = true;
                // For customizations, we'll restore quantities in the next useEffect
                // after groupedOptions are loaded
                initialQuantities[c.custom_id] = c.custom_quantity;
            });

            setSelections(initialSelections);
            setQuantities(initialQuantities);
        }
    }, [editingBasket, item.id, item.pricing_type, item.price, item.array_if_fixed_variable]);

    useEffect(() => {
        const prepareData = async () => {
            setLoading(true);
            try {
                // Get strictly the IDs of linked products from the item
                const linkedIds = new Set((item.products_customs || [])
                    .map(c => typeof c === 'number' ? c : c.id)
                    .filter((id): id is number => id !== undefined));

                if (linkedIds.size === 0) {
                    setGroupedOptions([]);
                    return;
                }

                // Apply the 'trick': Fetch all headers and then their respective options
                const headers = await getCustomizableHeaders();
                if (!headers || headers.length === 0) {
                    setGroupedOptions([]);
                    return;
                }

                const groupsData = await Promise.all(
                    headers.map(async (header: CustomizableHeader) => {
                        const allOptions = (await getCustomizablesByHeader(header.id)) || [];
                        // Filter for only those that are linked to this product
                        const linkedOptions = allOptions.filter((opt: Customizable) => opt.id && linkedIds.has(opt.id));

                        return {
                            header: header.header,
                            items: linkedOptions
                        };
                    })
                );

                // Only show groups that actually have linked items
                setGroupedOptions(groupsData.filter(group => group.items.length > 0));
            } catch (err) {
                console.error("Failed to prepare customization data:", err);
            } finally {
                setLoading(false);
            }
        };

        prepareData();
    }, [item]);

    // Effect to adjust quantities for Variable/Fixed Variable types when editing
    // Because we save them with Qty=Price, we need to reverse-map Price -> Step on load.
    useEffect(() => {
        if (!loading && groupedOptions.length > 0 && editingBasket) {
            setQuantities(prev => {
                const next = { ...prev };
                let hasChanges = false;

                groupedOptions.forEach(group => {
                    group.items.forEach(c => {
                        const inBasket = editingBasket.customizations.find(b => b.custom_id === c.id);
                        if (inBasket && c.id) {
                            const type = getNormalizedType(c.pricing_type);

                            if (type === 'fixed') {
                                // For Fixed items, quantity is the actual quantity - already loaded correctly
                                // No changes needed
                            } else if (type === 'variable') {
                                // For VAR: quantity = price, so step = price
                                const savedPrice = Number(inBasket.custom_price_sold);
                                if (prev[c.id] !== savedPrice) {
                                    next[c.id] = savedPrice;
                                    hasChanges = true;
                                }
                            } else if (type === 'fixed variable') {
                                // For FIX_VAR: quantity = price, find which step this price corresponds to
                                const savedPrice = Number(inBasket.custom_price_sold);

                                // Step 1 = Base Price
                                if (Number(c.price) === savedPrice) {
                                    if (prev[c.id] !== 1) {
                                        next[c.id] = 1;
                                        hasChanges = true;
                                    }
                                } else if (c.array_if_fixed_variable) {
                                    // Step N = Array[N-2]
                                    const idx = c.array_if_fixed_variable.findIndex(p => Number(p) === savedPrice);
                                    if (idx !== -1) {
                                        const derivedStep = idx + 2;
                                        if (prev[c.id] !== derivedStep) {
                                            next[c.id] = derivedStep;
                                            hasChanges = true;
                                        }
                                    }
                                }
                            }
                        }
                    });
                });

                return hasChanges ? next : prev;
            });
        }
    }, [loading, groupedOptions, editingBasket]);

    const getNormalizedType = (type?: string) => {
        const raw = type?.toUpperCase().trim() || '';
        if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
        if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
        if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
        return raw.toLowerCase();
    };

    const toggleSelection = (customId: number) => {
        setSelections(prev => ({
            ...prev,
            [customId]: !prev[customId]
        }));
    };

    const updateQuantity = (customId: number, delta: number) => {
        setQuantities(prev => {
            const current = prev[customId] || 1;
            const itemOption = groupedOptions.flatMap(g => g.items).find(i => i.id === customId);

            const isFixedVariable = itemOption ? getNormalizedType(itemOption.pricing_type) === 'fixed variable' : false;
            const max = (isFixedVariable && itemOption?.array_if_fixed_variable)
                ? 1 + itemOption.array_if_fixed_variable.length  // base price + array length
                : Infinity;

            return {
                ...prev,
                [customId]: Math.min(max, Math.max(1, current + delta))
            };
        });
    };

    const getItemPrice = (basePrice: number, step: number, pricingType: string, fixedVariableArray?: number[]) => {
        const type = getNormalizedType(pricingType);
        const price = Number(basePrice);

        if (type === 'variable') {
            // For Variable type: step is the price itself
            // step 1 → price 1, step 4 → price 4, step 5 → price 5
            return step;
        }

        if (type === 'fixed variable' && fixedVariableArray && fixedVariableArray.length > 0) {
            // FIX_VAR cycles through: base price, array[0], array[1], array[2], ...
            // Step 1 → base price, Step 2 → array[0], Step 3 → array[1], Step 4 → array[2]
            // Example: base=15, array=[20,25,30] → step 1=15, step 2=20, step 3=25, step 4=30
            if (step === 1) {
                return price; // Base price first
            }
            // Step 2 onwards: use array (step 2 → index 0, step 3 → index 1, etc.)
            const arrayIndex = step - 2;
            return Number(fixedVariableArray[arrayIndex]);
        }

        // Default: Fixed (Price * Quantity)
        return price * step;
    };

    const calculateTotal = () => {
        let total = getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable);

        groupedOptions.forEach(group => {
            group.items.forEach(c => {
                if (c.id && selections[c.id]) {
                    const step = quantities[c.id] || 1;
                    total += getItemPrice(c.price, step, c.pricing_type, c.array_if_fixed_variable);
                }
            });
        });
        return total;
    };

    const handleAddToCart = () => {
        const selectedCustoms: BasketCustomization[] = [];
        groupedOptions.forEach(group => {
            group.items.forEach(c => {
                if (c.id && selections[c.id]) {
                    const step = quantities[c.id] || 1;
                    const type = getNormalizedType(c.pricing_type);

                    let finalPrice = 0;
                    let finalQty = 0;

                    if (type === 'fixed') {
                        // Fixed: Price is unit price, Quantity is step
                        finalPrice = Number(c.price);
                        finalQty = step;
                    } else {
                        // Variable & Fixed Variable: 
                        // For these types, quantity equals price
                        finalPrice = getItemPrice(c.price, step, c.pricing_type, c.array_if_fixed_variable);
                        finalQty = finalPrice; // Quantity = Price
                    }

                    selectedCustoms.push({
                        custom_id: c.id,
                        custom_name: c.name,
                        custom_price_sold: finalPrice,
                        custom_quantity: finalQty,
                        pricing_type: c.pricing_type
                    });
                }
            });
        });

        // Apply the same pricing logic to the main product
        const mainProductType = getNormalizedType(item.pricing_type);
        let mainProductPrice = 0;
        let mainProductQty = 0;

        if (mainProductType === 'fixed') {
            // Fixed: Price is unit price, Quantity is baseQuantity
            mainProductPrice = Number(item.price);
            mainProductQty = baseQuantity;
        } else {
            // Variable & Fixed Variable: 
            // For these types, quantity equals price
            mainProductPrice = getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable);
            mainProductQty = mainProductPrice; // Quantity = Price
        }

        // Create a modified item with correct price for VAR/FIX_VAR
        const itemForCart: MenuItemFormData = {
            ...item,
            price: mainProductPrice
        };

        if (editingBasket && !editingBasket.isTemplate) {
            updateBasket(editingBasket.id!, itemForCart, selectedCustoms, mainProductQty);
        } else {
            addToCart(itemForCart, selectedCustoms, mainProductQty);
        }
        onClose();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                <p className="text-sm">Preparing options...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-950 text-white">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-900 border-b border-white/5 sticky top-0 z-10 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-100">
                        Customize Order
                    </h2>
                    <p className="text-xs text-gray-400">{item.name}</p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 bg-yellow-400/10 px-3 py-1 rounded-lg border border-yellow-400/20 mb-1">
                        <span className="text-[10px] text-yellow-500 uppercase font-black tracking-widest">GHS</span>
                        <span className="text-sm font-black text-white tabular-nums">
                            {Number(calculateTotal()).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Target Basket Info Bar - Simplified & Horizontal */}
            <div className="bg-gray-900/40 px-6 py-2 border-b border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 min-w-fit">
                        <Settings className="w-3 h-3 text-yellow-500/70" />
                        <span className="font-black text-yellow-500/90 uppercase tracking-tighter">Basket #{activeBasketIndex + 1}</span>
                    </div>

                    {baskets[activeBasketIndex] && (
                        <div className="flex items-center gap-2 border-l border-white/10 pl-4 overflow-hidden">
                            <span className="text-gray-500 font-bold uppercase tracking-tight whitespace-nowrap">Current Dish:</span>
                            <span className="text-gray-300 font-medium line-clamp-1">{baskets[activeBasketIndex].product_name}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1.5 bg-yellow-400/5 px-2 py-0.5 rounded border border-yellow-400/10">
                    <span className="font-bold text-yellow-500/60 uppercase text-[8px]">Subtotal</span>
                    <span className="font-black text-white tabular-nums">
                        GHS {calculateTotal().toFixed(2)}
                    </span>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">

                    {/* Base Item Info */}
                    <div className="p-4 rounded-xl bg-gray-800/30 border border-white/5">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-lg">{item.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-500 font-medium uppercase tracking-wider border border-yellow-400/20">
                                        {item.pricing_type}
                                    </span>
                                    {getNormalizedType(item.pricing_type) === 'fixed' && (
                                        <span className="text-xs font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                            GHS {getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                {getNormalizedType(item.pricing_type) === 'fixed variable' && item.array_if_fixed_variable && (
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {/* Show base price first, then array prices */}
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 font-bold">
                                            GHS {Number(item.price).toFixed(0)}
                                        </span>
                                        {item.array_if_fixed_variable.map((p, i) => (
                                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">
                                                GHS {Number(p).toFixed(0)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                {getNormalizedType(item.pricing_type) === 'fixed' ? (
                                    // FIX: Show quantity controls with price calculation
                                    <div className="flex items-center gap-3 bg-gray-900/50 p-1 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => setBaseQuantity(q => Math.max(1, q - 1))}
                                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Minus className="w-4 h-4 text-gray-400" />
                                        </button>

                                        <div className="flex flex-col items-center min-w-[3rem]">
                                            <span className="font-bold text-sm tabular-nums">
                                                {baseQuantity}
                                            </span>
                                            <span className="text-[9px] uppercase text-gray-500 font-bold tracking-tighter">
                                                Qty
                                            </span>
                                            <span className="text-[8px] text-yellow-500 font-black tabular-nums">
                                                = GHS {getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable).toFixed(2)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => setBaseQuantity(q => q + 1)}
                                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                ) : (
                                    // VAR/FIX_VAR: Show price selector (no separate quantity)
                                    <div className="flex items-center gap-3 bg-gray-900/50 p-1 rounded-lg border border-white/5">
                                        <button
                                            onClick={() => setBaseQuantity(q => Math.max(1, q - 1))}
                                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Minus className="w-4 h-4 text-gray-400" />
                                        </button>

                                        <div className="flex flex-col items-center min-w-[3rem]">
                                            <span className="text-[9px] uppercase text-gray-500 font-bold tracking-tighter mb-0.5">
                                                Price
                                            </span>
                                            <span className="font-black text-sm tabular-nums text-yellow-500">
                                                GHS {getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable).toFixed(0)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => setBaseQuantity(q => {
                                                const max = (getNormalizedType(item.pricing_type) === 'fixed variable' && item.array_if_fixed_variable)
                                                    ? 1 + item.array_if_fixed_variable.length
                                                    : Infinity;
                                                return Math.min(max, q + 1);
                                            })}
                                            className="p-1 hover:bg-white/10 rounded-md transition-colors"
                                        >
                                            <Plus className="w-4 h-4 text-gray-400" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {groupedOptions.length > 0 ? (
                        groupedOptions.map((group) => (
                            <div key={group.header} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-200 flex items-center gap-2">
                                        {group.header}
                                    </h3>
                                </div>

                                <div className="space-y-2">
                                    {group.items.map((choice) => {
                                        const isSelected = choice.id ? selections[choice.id] : false;

                                        return (
                                            <div
                                                key={choice.id}
                                                onClick={() => choice.id && toggleSelection(choice.id)}
                                                className={cn(
                                                    "group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200",
                                                    isSelected
                                                        ? "bg-yellow-400/10 border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.1)]"
                                                        : "bg-gray-800/20 border-gray-700/30 hover:bg-gray-800/40 hover:border-gray-600"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                                                        isSelected
                                                            ? "bg-yellow-400 border-yellow-400 text-black"
                                                            : "border-gray-600 group-hover:border-gray-500"
                                                    )}>
                                                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-300")}>
                                                            {choice.name}
                                                        </span>
                                                        {choice.description && (
                                                            <span className="text-[10px] text-gray-500 leading-tight">{choice.description}</span>
                                                        )}
                                                        {getNormalizedType(choice.pricing_type) === 'fixed variable' && choice.array_if_fixed_variable && (
                                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                                {/* Show base price first */}
                                                                <span className="text-[8px] px-1 rounded bg-yellow-400/10 text-yellow-500 border border-yellow-400/20 font-bold">
                                                                    {Number(choice.price).toFixed(0)}
                                                                </span>
                                                                {choice.array_if_fixed_variable.map((p, i) => (
                                                                    <span key={i} className="text-[8px] px-1 rounded bg-white/5 text-gray-600 border border-white/5">
                                                                        {Number(p).toFixed(0)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right flex flex-col items-end mr-3">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-gray-100">
                                                                GHS {getItemPrice(choice.price, choice.id ? (quantities[choice.id] || 1) : 1, choice.pricing_type, choice.array_if_fixed_variable).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <span className="text-[8px] text-gray-500 uppercase font-bold tracking-wider">
                                                            {getNormalizedType(choice.pricing_type)}
                                                        </span>
                                                    </div>
                                                    {isSelected && choice.adjustable && (
                                                        <div className="flex items-center gap-2 ml-2 bg-gray-900/50 rounded-md p-1 border border-white/10" onClick={(e) => e.stopPropagation()}>
                                                            <button
                                                                onClick={() => choice.id && updateQuantity(choice.id, -1)}
                                                                className="p-1 hover:text-white text-gray-400"
                                                            >
                                                                <Minus className="w-3.5 h-3.5" />
                                                            </button>

                                                            {getNormalizedType(choice.pricing_type) === 'fixed' ? (
                                                                // FIX: Show quantity
                                                                <div className="flex flex-col items-center min-w-[2.5rem]">
                                                                    <span className="text-xs font-bold tabular-nums text-yellow-500">
                                                                        {choice.id ? (quantities[choice.id] || 1) : 1}
                                                                    </span>
                                                                    <span className="text-[8px] uppercase text-gray-600 font-bold">
                                                                        Qty
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                // VAR/FIX_VAR: Show only price
                                                                <div className="flex flex-col items-center min-w-[2.5rem]">
                                                                    <span className="text-[8px] uppercase text-gray-600 font-bold mb-0.5">
                                                                        Price
                                                                    </span>
                                                                    <span className="text-xs text-yellow-400 font-black tabular-nums">
                                                                        {getItemPrice(choice.price, choice.id ? (quantities[choice.id] || 1) : 1, choice.pricing_type, choice.array_if_fixed_variable).toFixed(0)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => choice.id && updateQuantity(choice.id, 1)}
                                                                className="p-1 hover:text-white text-gray-400"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                            <p className="text-sm">No linked products found for this item.</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-gray-900 border-t border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Button
                        className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold text-sm shadow-lg shadow-yellow-500/20"
                        onClick={handleAddToCart}
                    >
                        {editingBasket && !editingBasket.isTemplate ? 'Update' : 'Add to Cart'}
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-12 border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-bold text-sm"
                        onClick={() => {
                            const name = prompt("Name this package:", item.name);
                            if (name) {
                                // Construct a mock basket for saving
                                const mockBasket: Basket = {
                                    product_id: item.id!,
                                    product_name: item.name,
                                    product_price_sold: getItemPrice(item.price, baseQuantity, item.pricing_type, item.array_if_fixed_variable),
                                    product_quantity: baseQuantity,
                                    product_type: item.type!,
                                    product_pricing_type: item.pricing_type,
                                    customizations: Object.keys(selections)
                                        .filter(id => selections[Number(id)])
                                        .map(id => {
                                            const customId = Number(id);
                                            // Find the custom item in groupedOptions
                                            const choice = groupedOptions.flatMap(g => g.items).find(i => i.id === customId);
                                            const choicePricingType = choice?.pricing_type || 'fixed';
                                            return {
                                                custom_id: customId,
                                                custom_name: choice?.name || 'Unknown',
                                                custom_price_sold: getItemPrice(choice?.price || 0, quantities[customId] || 1, choicePricingType, choice?.array_if_fixed_variable),
                                                custom_quantity: quantities[customId] || 1,
                                                pricing_type: choicePricingType
                                            };
                                        })
                                };
                                saveAsPackage(mockBasket, name);
                                alert("Package saved successfully!");
                                onClose();
                            }
                        }}
                    >
                        Save as Pkg
                    </Button>
                </div>
                <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-yellow-500/80 uppercase">Total: GHS {Number(calculateTotal()).toFixed(2)}</span>
                    <Button variant="ghost" size="sm" className="h-8 text-gray-500 hover:text-white" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
