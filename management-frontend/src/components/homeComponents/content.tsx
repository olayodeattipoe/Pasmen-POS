import { useState, useEffect } from 'react';
import MenuCard from './menuCard';
import Container from './container';
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategories, getProductsbyCategories, getProductById } from '@/api/features';
import { Category, MenuItemFormData } from '@/api/models';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '../context/CartContext';
import { Sheet, SheetContent } from "@/components/ui/sheet";
import CustomizePanel from './CustomizePanel';
import { Button } from '@/components/ui/button';

export default function Content() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [items, setItems] = useState<MenuItemFormData[]>([]);
    const [loading, setLoading] = useState(false);
    const [catsLoading, setCatsLoading] = useState(true);
    const [isPackagesActive, setIsPackagesActive] = useState(false);

    const { isEditModalOpen, closeEditModal, editingBasket, packages, loadTemplate, deletePackage } = useCart();
    const [editingProduct, setEditingProduct] = useState<MenuItemFormData | null>(null);
    const [editLoading, setEditLoading] = useState(false);

    // Fetch product details for editing when editingBasket changes
    useEffect(() => {
        const fetchProduct = async () => {
            if (editingBasket?.product_id) {
                setEditLoading(true);
                try {
                    const product = await getProductById(editingBasket.product_id);
                    setEditingProduct(product);
                } catch (err) {
                    console.error("Failed to fetch editing product:", err);
                } finally {
                    setEditLoading(false);
                }
            } else {
                setEditingProduct(null);
            }
        };
        fetchProduct();
    }, [editingBasket]);

    // Initial load of categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const cats = await getCategories();
                setCategories(cats || []);
                if (cats && cats.length > 0) {
                    setSelectedCategory(cats[0]);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setCatsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    // Fetch items when category changes
    useEffect(() => {
        const fetchItems = async () => {
            if (!selectedCategory) return;

            setLoading(true);
            try {
                const fetchedItems = await getProductsbyCategories(selectedCategory);
                setItems(fetchedItems || []);
            } catch (err) {
                console.error("Failed to fetch products:", err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [selectedCategory]);

    return (
        <div className="flex h-full min-h-0 w-full">
            {/* Sidebar - RESTORED INITIAL DESIGN */}
            <div className="w-[280px] bg-card/80 border-r border-foreground/5 flex flex-col backdrop-blur-sm z-30">
                <div className="p-5 border-b border-foreground/5">
                    <h2 className="text-sm uppercase tracking-wider font-bold text-muted-foreground">Categories</h2>
                </div>

                <div className="flex-1 py-4 px-2 overflow-hidden">
                    <div className="relative h-full">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col py-2 pr-4 space-y-1">
                                {catsLoading ? (
                                    Array(8).fill(0).map((_, i) => (
                                        <div key={i} className="h-14 w-full bg-white/5 rounded-xl animate-pulse mb-1" />
                                    ))
                                ) : (
                                    categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => {
                                                setSelectedCategory(category);
                                                setIsPackagesActive(false);
                                            }}
                                            className={cn(
                                                "group flex items-center gap-3 px-4 py-3.5 text-left rounded-xl transition-all duration-200 relative w-full",
                                                selectedCategory?.id === category.id
                                                    ? 'bg-yellow-400/10 text-yellow-500'
                                                    : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                                            )}
                                        >
                                            {selectedCategory?.id === category.id && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-yellow-400 rounded-r-full" />
                                            )}

                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-200",
                                                selectedCategory?.id === category.id
                                                    ? "bg-yellow-400 text-gray-900 border-yellow-400 shadow-md shadow-yellow-400/20"
                                                    : "bg-foreground/5 border-foreground/10 group-hover:border-foreground/20 group-hover:bg-foreground/10"
                                            )}>
                                                <span className="text-lg font-bold">{category.category_name[0]}</span>
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                selectedCategory?.id === category.id ? "font-bold" : ""
                                            )}>
                                                {category.category_name}
                                            </span>
                                        </button>
                                    ))
                                )}

                                {/* Packages Tab */}
                                <div className="pt-4 mt-4 border-t border-foreground/5 px-2">
                                    <h2 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-3 px-2">Custom</h2>
                                    <button
                                        onClick={() => {
                                            setIsPackagesActive(true);
                                            setSelectedCategory(null);
                                        }}
                                        className={cn(
                                            "group flex items-center gap-3 px-4 py-3.5 text-left rounded-xl transition-all duration-200 relative w-full",
                                            isPackagesActive
                                                ? 'bg-purple-500/10 text-purple-400'
                                                : 'text-muted-foreground hover:bg-foreground/5 hover:text-foreground'
                                        )}
                                    >
                                        {isPackagesActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-purple-500 rounded-r-full" />
                                        )}

                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-200",
                                            isPackagesActive
                                                ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/20"
                                                : "bg-foreground/5 border-foreground/10 group-hover:border-foreground/20 group-hover:bg-foreground/10"
                                        )}>
                                            <span className="text-lg font-bold">P</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-sm font-medium transition-colors",
                                                isPackagesActive ? "font-bold" : ""
                                            )}>
                                                Packages
                                            </span>
                                            <span className="text-[10px] opacity-70">Saved Templates</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Gradient Overlay */}
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20
                                bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
                    </div>
                </div>
            </div>

            {/* Main Display Area */}
            <div className="flex-1 flex flex-col min-h-0 relative bg-background overflow-hidden">
                {/* Background Blob Effects */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[20%] right-[10%] w-96 h-96
                                  bg-yellow-400/5 rounded-full
                                  mix-blend-overlay filter blur-[120px]
                                  opacity-40 animate-blob"></div>
                    <div className="absolute bottom-[20%] left-[10%] w-80 h-80
                                  bg-purple-500/5 rounded-full
                                  mix-blend-overlay filter blur-[100px]
                                  opacity-30 animate-blob animation-delay-2000"></div>
                </div>

                {/* Container / Basket Bar - MOVED INTO CONTENT */}
                <div className="shrink-0 z-20 shadow-xl shadow-foreground/5">
                    <Container />
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-hidden relative z-10">
                    <ScrollArea className="h-full">
                        <div className="relative px-6 pt-6 pb-24">
                            {/* Category Label */}
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-6 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                                    <h2 className="text-xl font-bold text-foreground">
                                        {isPackagesActive ? 'Order Packages' : selectedCategory?.category_name || 'Select a Category'}
                                    </h2>
                                </div>
                                {!loading && !catsLoading && !isPackagesActive && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-foreground/5 border border-foreground/5 text-xs text-muted-foreground">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                        {items.length} Items Available
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                    <p className="text-sm font-medium">Loading items...</p>
                                </div>
                            ) : (
                                <>
                                    {isPackagesActive ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mx-auto">
                                            {packages.map((pkg) => (
                                                <div
                                                    key={pkg.id}
                                                    className="group relative rounded-xl shadow-lg bg-card/40 backdrop-blur-md 
                                                            border border-foreground/5 flex flex-col h-full overflow-hidden 
                                                            hover:border-purple-400/30 hover:shadow-purple-400/5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                                    onClick={() => loadTemplate(pkg)}
                                                >
                                                    <div className="p-4 bg-purple-500/5 h-24 flex items-center justify-center">
                                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                            <span className="text-2xl font-bold text-purple-400">P</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 flex flex-col gap-2">
                                                        <h4 className="font-bold text-lg text-foreground group-hover:text-purple-400 transition-colors">
                                                            {pkg.name}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-foreground/5 text-muted-foreground uppercase">
                                                                {pkg.product_name}
                                                            </span>
                                                            {pkg.customizations.length > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase">
                                                                    +{pkg.customizations.length} Add-ons
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 italic mt-1">
                                                            Includes: {pkg.customizations.map(c => c.custom_name).join(', ') || 'No extra items'}
                                                        </p>
                                                    </div>
                                                    <div className="px-4 py-3 bg-card/80 flex justify-between items-center border-t border-foreground/5">
                                                        <Button
                                                            size="sm"
                                                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                loadTemplate(pkg);
                                                            }}
                                                        >
                                                            Load Template
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-2 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (window.confirm("Are you sure you want to delete this package?")) {
                                                                    deletePackage(pkg.id);
                                                                }
                                                            }}
                                                        >
                                                            Del
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {packages.length === 0 && (
                                                <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-500 gap-4 border-2 border-dashed border-white/5 rounded-3xl bg-foreground/[0.02]">
                                                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-purple-400">P</span>
                                                    </div>
                                                    <div className="text-center px-8">
                                                        <p className="text-lg font-bold text-foreground mb-1">Your Package list is empty</p>
                                                        <p className="text-sm text-muted-foreground max-w-sm">
                                                            Configure any meal with your preferred add-ons and click <span className="text-purple-400 font-bold">"Save as Pkg"</span> to create your own custom templates here.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {items.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mx-auto">
                                                    {items.map((item) => (
                                                        <div key={item.id} className="w-full">
                                                            <MenuCard item={item} />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-2 border-2 border-dashed border-white/5 rounded-2xl">
                                                    {!selectedCategory ? (
                                                        <p className="text-base font-medium">Please select a category or Packages</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-base font-medium">No items found in this category</p>
                                                            <p className="text-sm italic">Try selecting another category or check your inventory.</p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Global Edit Sheet */}
            <Sheet open={isEditModalOpen} onOpenChange={(open) => !open && closeEditModal()}>
                <SheetContent className="w-full sm:max-w-md bg-background p-0 border-l border-foreground/10">
                    {editLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                            <p className="text-sm">Loading product details...</p>
                        </div>
                    ) : editingProduct ? (
                        <CustomizePanel item={editingProduct} onClose={closeEditModal} />
                    ) : null}
                </SheetContent>
            </Sheet>
        </div>
    );
}
