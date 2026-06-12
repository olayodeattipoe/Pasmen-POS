import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface LayoutProps {
    children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobileOpen={isMobileMenuOpen}
                onCloseMobile={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col overflow-hidden w-full">
                <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};
