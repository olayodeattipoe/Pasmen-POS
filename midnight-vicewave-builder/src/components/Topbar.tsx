import { Search, Bell, User, Sun, Moon, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface TopbarProps {
    onMenuClick?: () => void;
}

export const Topbar = ({ onMenuClick }: TopbarProps) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
            {/* Mobile Menu Toggle */}
            {onMenuClick && (
                <button
                    onClick={onMenuClick}
                    className="md:hidden mr-3 p-2 -ml-2 rounded-lg hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
            )}

            {/* Search */}
            <div className="flex-1 max-w-md hidden sm:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                >
                    {theme === 'dark' ? (
                        <Moon className="w-5 h-5" />
                    ) : (
                        <Sun className="w-5 h-5" />
                    )}
                </button>

                {/* Notifications */}
                <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                </button>

                {/* User */}
                <button className="flex items-center gap-2 pl-2 pr-3 h-10 rounded-lg hover:bg-accent transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="text-left hidden md:block">
                        <div className="text-sm font-medium">{user?.username || 'Admin'}</div>
                        <div className="text-xs text-muted-foreground">{user?.email || (user?.username ? `${user.username}@pasmen.com` : 'admin@gb3k3.com')}</div>
                    </div>
                </button>
            </div>
        </header>
    );
};
