import * as React from "react"

import { cn } from "@/lib/utils"

// Since I cannot install radix-ui/react-scroll-area right now without confirming dependency, 
// I will implement a simple CSS-based fallback that mimics the API if dependencies are missing,
// OR better yet, I will add the dependency now. The prompt said "Recreate ONLY UI", using standard shadcn usually requires radix.
// I'll stick to a pure CSS implementation for simplicity and zero-runtime-dep if possible, 
// BUT to be pixel perfect and "modern", a custom scrollbar is key.
// "ScrollArea" was imported in the source.
// Let's implement a div with custom scrollbar styling instead of full Radix to reduce dependency overhead if not strictly needed,
// OR just install the dep. The user wanted "visual only". 
// A div with `overflow-auto` and styled scrollbars (which I added to index.css) is sufficient.

const ScrollArea = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("relative overflow-auto", className)}
        {...props}
    >
        {children}
    </div>
))
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
