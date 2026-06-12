import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    UserCircle,
    Clock,
    ShoppingBasket,
    Building2,
    LogOut,
    ShoppingBag
} from 'lucide-react';
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartBreakdown from "./CartBreakdown";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import SalesPanel from "./SalesPanel";
import ProductionPanel from "./ProductionPanel";
import { History, Package } from "lucide-react";

export default function Header() {
    const { user, logout: authLogout } = useAuth();
    const { baskets } = useCart();
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
    const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
    const [isProductionOpen, setIsProductionOpen] = useState(false);

    const handleLogout = () => {
        authLogout();
    };

    return (
        <div className="relative border-b border-foreground/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
            <div className="relative px-6 py-4">
                <div className="max-w-[1920px] mx-auto">
                    {/* Top Bar */}
                    <div className="flex items-center justify-between mb-6">
                        {/* Brand Section */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500
                                flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                        <span className="text-3xl font-bold text-gray-900">C</span>
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full 
                                bg-green-500 border-2 border-gray-900 ring-2 ring-gray-900" />
                                </div>

                                <div>
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                        Calabash
                                    </h1>
                                    <div className="flex items-center gap-4 mt-1">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full 
                                  bg-green-500/10 border border-green-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Open Now</span>
                                        </div>
                                        <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                                            <Clock className="h-3.5 w-3.5" />
                                            Until 10 PM
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1.5 font-medium">
                                            <Building2 className="h-3.5 w-3.5" />
                                            Main
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Info with Logout Button */}
                        <div className="flex items-center gap-4">

                            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl
                            bg-foreground/5 border border-foreground/10 hover:bg-foreground/10 transition-colors">
                                <UserCircle className="h-10 w-10 text-yellow-400" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground/90">
                                        {user?.username || 'User'}
                                    </span>
                                    <span className="text-xs text-yellow-500 font-medium">
                                        {user?.groups?.[0] || 'System Admin'}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="flex items-center gap-2 h-auto py-3 px-4 rounded-xl
                         text-red-500 hover:bg-red-500/10 hover:text-red-600
                         border border-transparent hover:border-red-500/20 transition-all font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* Navigation & Cart Actions */}
                    <div className="grid grid-cols-2 gap-8 items-center">
                        <div className="flex items-center justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsSalesHistoryOpen(true)}
                                className="bg-transparent border-white/10 text-gray-300
                         hover:bg-white/5 hover:text-yellow-400 hover:border-yellow-400/30
                         transition-all duration-200 h-11 px-5 font-medium"
                            >
                                <History className="h-4 w-4 mr-2" />
                                Sales History
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsProductionOpen(true)}
                                className="bg-transparent border-white/10 text-gray-300
                         hover:bg-white/5 hover:text-purple-400 hover:border-purple-400/30
                         transition-all duration-200 h-11 px-5 font-medium"
                            >
                                <Package className="h-4 w-4 mr-2" />
                                Production
                            </Button>
                            <Button
                                variant="outline"
                                className="bg-transparent border-white/10 text-gray-300
                         hover:bg-white/5 hover:text-yellow-400 hover:border-yellow-400/30
                         transition-all duration-200 h-11 px-5 font-medium"
                            >
                                <ShoppingBasket className="h-4 w-4 mr-2" />
                                New Container
                            </Button>
                            <Button
                                onClick={() => setIsBreakdownOpen(true)}
                                className="bg-gradient-to-br from-yellow-500 to-yellow-400 
                         text-gray-900 font-bold hover:from-yellow-400 hover:to-yellow-500
                         transition-all duration-200 shadow-lg shadow-yellow-500/20
                         h-11 px-8 rounded-lg flex items-center gap-2 group"
                            >
                                <ShoppingBag className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                Cart ({baskets.length})
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <CartBreakdown isOpen={isBreakdownOpen} onClose={() => setIsBreakdownOpen(false)} />

            {/* Sales History Sheet */}
            <Sheet open={isSalesHistoryOpen} onOpenChange={setIsSalesHistoryOpen}>
                <SheetContent className="w-full sm:max-w-[95%] lg:max-w-[1200px] p-0 border-l border-foreground/10 bg-background/95 backdrop-blur-xl">
                    <div className="h-full overflow-y-auto">
                        <SalesPanel />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Production Sheet */}
            <Sheet open={isProductionOpen} onOpenChange={setIsProductionOpen}>
                <SheetContent className="w-full sm:max-w-[95%] lg:max-w-[1000px] p-0 border-l border-foreground/10 bg-background/95 backdrop-blur-xl">
                    <div className="h-full overflow-y-auto">
                        <ProductionPanel />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
