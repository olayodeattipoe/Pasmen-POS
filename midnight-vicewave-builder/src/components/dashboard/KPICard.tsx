import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KPICardProps {
 title: string;
 value: string;
 change: string;
 icon: LucideIcon;
 trend: "up" | "down";
 color: "golden" | "purple" | "cyan" | "pink";
}

const colorClasses = {
 golden: "border-glow-golden hover-glow-golden",
 purple: "border-glow-purple ",
 cyan: "border-glow-golden ",
 pink: "border-glow-purple ",
};

const iconColorClasses = {
 golden: "text-golden",
 purple: "text-purple-accent",
 cyan: "text-cyan-soft",
 pink: "text-pink-accent",
};

const iconBgClasses = {
 golden: "bg-golden-city/10",
 purple: "bg-deep-purple/30",
 cyan: "bg-muted",
 pink: "bg-muted",
};

export const KPICard = ({ title, value, change, icon: Icon, trend, color }: KPICardProps) => {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 whileHover={{ scale: 1.02 }}
 transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
 className={cn(
 "glass shimmer rounded-2xl p-7 border card-elevated relative overflow-hidden transition-smooth",
 colorClasses[color]
 )}
 >
 <div className="flex items-start justify-between relative z-10">
 <div className="flex-1 space-y-3">
 <p className="text-muted-foreground text-xs uppercase tracking-widest font-futuristic font-medium">
 {title}
 </p>
 <h3 className="font-vicewave text-depth leading-none">
 {value}
 </h3>
 <div className={cn(
 "inline-flex items-center gap-1.5 text-sm font-futuristic font-medium px-3 py-1.5 rounded-full",
 trend === "up" 
 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
 : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
 )}>
 <span className="text-base font-bold">{trend === "up" ? "↑" : "↓"}</span>
 <span>{change}</span>
 </div>
 </div>
 
 <div className={cn(
 "p-4 rounded-2xl transition-smooth backdrop-blur-sm",
 iconBgClasses[color],
 iconColorClasses[color]
 )}>
 <Icon className="w-8 h-8" strokeWidth={2.5} />
 </div>
 </div>
 </motion.div>
 );
};
