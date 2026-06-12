import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    if (!mounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />

            {/* Content */}
            <div className="relative z-[101] h-full bg-gray-950 border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
                {children}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 z-[102] rounded-full p-2 bg-gray-900/50 text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>,
        document.body
    );
};

// Simplified SheetContent just rendering children directly since our Sheet handles the container
interface SheetContentProps {
    children: React.ReactNode;
    className?: string;
}

const SheetContent = ({ children, className }: SheetContentProps) => {
    return (
        <div className={cn("h-full flex flex-col", className)}>
            {children}
        </div>
    );
};

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);

const SheetTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold text-white", className)} {...props} />
);

const SheetDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("text-sm text-gray-500", className)} {...props} />
);

export { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
