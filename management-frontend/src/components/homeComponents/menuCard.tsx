import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Settings, ShoppingBag } from 'lucide-react';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import CustomizePanel from "./CustomizePanel";
import { MenuItemFormData } from '@/api/models';

interface MenuCardProps {
    item: MenuItemFormData;
}

import { useCart } from '../context/CartContext';
import { getImageUrl } from '@/lib/utils';

export default function MenuCard({ item }: MenuCardProps) {
    const { name, type: food_type, description, image, price: base_price, is_available } = item;
    const { addToCart } = useCart();
    const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
    const image_url = getImageUrl(image) || '';

    const isLinkedProduct = (type: string) => {
        const normalizedType = type?.toLowerCase();
        return normalizedType === 'default' || normalizedType === 'packages';
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!is_available) return;

        if (isLinkedProduct(food_type)) {
            setIsCustomizeOpen(true);
        } else {
            // Standalone: add 1 directly to cart
            addToCart(item, [], 1);
        }
    };

    return (
        <>
            <div
                className="group relative rounded-xl shadow-lg bg-card/40 backdrop-blur-md 
                        border border-foreground/5 flex flex-col h-full overflow-hidden 
                        hover:border-yellow-400/30 hover:shadow-yellow-400/5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => is_available && isLinkedProduct(food_type) && setIsCustomizeOpen(true)}
            >

                {/* Image Section */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
                    {image_url ? (
                        <img
                            src={image_url}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foreground/5">
                            <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Price Tag Overlay */}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-background/60 backdrop-blur-md border border-foreground/10">
                        <span className="text-xs font-bold text-yellow-500">GHS {Number(base_price).toFixed(2)}</span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-2 bg-card/40 flex-grow flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-foreground text-xs leading-tight">
                            <span className="line-clamp-2 group-hover:text-yellow-500 transition-colors duration-200">
                                {name}
                            </span>
                        </h4>
                    </div>

                    {description && (
                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                            {description}
                        </p>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between">
                        <div className="flex gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-foreground/5 text-muted-foreground uppercase tracking-wide border border-foreground/5">
                                {food_type}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-2 py-1.5 bg-card/80 flex justify-between items-center border-t border-foreground/5 gap-2">
                    <Button
                        variant="ghost"
                        className="w-full h-7 bg-foreground/5 hover:bg-yellow-400 hover:text-gray-900 
                                text-foreground/80 text-xs font-semibold rounded-lg border border-foreground/5 
                                transition-all duration-200 flex items-center justify-center gap-2"
                        disabled={!is_available}
                        onClick={handleAdd}
                    >
                        {isLinkedProduct(food_type) ? (
                            <>
                                <Settings className="w-3.5 h-3.5" />
                                Customize
                            </>
                        ) : (
                            <>
                                <Plus className="w-3.5 h-3.5" />
                                Add to Cart
                            </>
                        )}
                    </Button>
                </div>

                {/* Unavailable Overlay */}
                {!is_available && (
                    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm
                                flex items-center justify-center border border-foreground/5 rounded-xl">
                        <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-bold uppercase tracking-wide">
                            Sold Out
                        </span>
                    </div>
                )}
            </div>

            <Sheet open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
                <SheetContent className="w-full sm:max-w-md bg-background p-0 border-l border-foreground/10">
                    <CustomizePanel item={item} onClose={() => setIsCustomizeOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}

