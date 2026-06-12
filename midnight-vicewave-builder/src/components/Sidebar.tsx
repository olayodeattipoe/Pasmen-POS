import { Home, BarChart3, Package, ShoppingCart, Users, Settings, ChevronLeft, ChevronRight, AlertTriangle, FileText, Truck, UtensilsCrossed, LogOut, Store } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    isMobileOpen?: boolean;
    onCloseMobile?: () => void;
}

const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: Store, label: "Main Store", path: "/main-store", hideOnMobile: true },
    { icon: Package, label: "Production", path: "/production", hideOnMobile: true },
    { icon: UtensilsCrossed, label: "Menu Items", path: "/menu-items", hideOnMobile: true },
    { icon: BarChart3, label: "Analytics", path: "/analytics" },
    { icon: Package, label: "Inventory", path: "/inventory", hideOnMobile: true },
    { icon: Users, label: "Users", path: "/users" },
    { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
];

export const Sidebar = ({ collapsed, onToggle, isMobileOpen, onCloseMobile }: SidebarProps) => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <>
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 280 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                    "h-screen bg-card border-r border-border flex flex-col transition-transform duration-300",
                    "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-border px-4">
                    <motion.div
                        animate={{ scale: collapsed ? 0.9 : 1 }}
                        className="font-bold text-xl text-primary"
                    >
                        {collapsed ? "C" : "CALABASH POS"}
                    </motion.div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 overflow-y-auto space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                                    item.hideOnMobile ? "hidden md:flex" : "flex",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && (
                                    <span className="text-sm font-medium">{item.label}</span>
                                )}
                                {collapsed && (
                                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Toggle Button */}
                <div className="p-3 border-t border-border space-y-2">
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors group relative"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">Logout</span>}
                        {collapsed && (
                            <div className="absolute left-full ml-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                Logout
                            </div>
                        )}
                    </button>

                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                        {!collapsed && <span className="text-sm font-medium">Collapse</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Backdrop overlay */}
            {isMobileOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCloseMobile}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                />
            )}
        </>
    );
};
