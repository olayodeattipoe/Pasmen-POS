import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export const FloatingButton = () => {
 return (
 <motion.button
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.95 }}
 transition={{ type: "spring", stiffness: 400, damping: 17 }}
 className="fixed bottom-8 right-8 bg-gradient-to-r from-muted/50 to-transparent p-4 rounded-full shadow-2xl z-50 group"
 style={{
 boxShadow: "0 0 30px hsl(177 100% 50% / 0.6), 0 0 60px hsl(177 100% 50% / 0.3)",
 }}
 >
 <Plus className="w-6 h-6 text-background group-hover:rotate-90 transition-transform duration-300" />
 
 <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-border">
 New Sale
 </span>
 </motion.button>
 );
};
