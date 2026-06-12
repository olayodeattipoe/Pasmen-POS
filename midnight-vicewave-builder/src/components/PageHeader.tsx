import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
 title: string;
 description: string;
 icon?: LucideIcon;
}

export const PageHeader = ({ title, description, icon: Icon }: PageHeaderProps) => {
 return (
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="mb-8"
 >
 <div className="flex items-center gap-4 mb-3">
 {Icon && (
 <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 glow-golden">
 <Icon className="w-6 h-6 text-golden" strokeWidth={2.5} />
 </div>
 )}
 <h1 className="text-4xl md:text-5xl font-vicewave text-foregrounden tracking-tight">
 {title}
 </h1>
 </div>
 <p className="text-muted-foreground font-futuristic text-lg ml-16">
 {description}
 </p>
 </motion.div>
 );
};

