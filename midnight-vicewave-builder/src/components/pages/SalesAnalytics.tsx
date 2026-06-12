import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
 TrendingUp,
 DollarSign,
 Package,
 Search,
 ArrowLeft,
 Calendar,
 Loader2,
 UtensilsCrossed,
 BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSalesAnalytics } from '@/api/features';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AnalyticsItem {
 id: number;
 name: string;
 image: string | null;
 type: 'Product' | 'Custom';
 quantity: number;
 revenue: number;
}

export default function SalesAnalytics() {
 const { toast } = useToast();
 const [data, setData] = useState<AnalyticsItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedItem, setSelectedItem] = useState<AnalyticsItem | null>(null);

 const fetchAnalytics = async () => {
 try {
 setLoading(true);
 const results = await getSalesAnalytics({
 startDate: startDate || undefined,
 endDate: endDate || undefined
 });
 setData(results || []);
 } catch (error: any) {
 toast({
 title: "Error",
 description: error.message || "Failed to fetch analytics",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchAnalytics();
 }, [startDate, endDate]);

 const filteredItems = data.filter(item =>
 (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
 );

 const getImageUrl = (path: string | null) => {
 if (!path) return null;
 if (typeof path !== 'string') return null;
 if (path.startsWith('http')) return path;

 // Ensure the path starts with /
 let cleanPath = path.startsWith('/') ? path : `/${path}`;

 // Check if the path needs the /media prefix
 // (Existing paths from backend might look like 'products/image.jpg' or '/products/image.jpg')
 if (!cleanPath.startsWith('/media/')) {
 cleanPath = `/media${cleanPath}`;
 }

 return `${API_BASE_URL}${cleanPath}`;
 };

 return (
 <div className="space-y-6 p-6">
 {/* Header Section */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-4"
 >
 <div className="flex items-center gap-3">
 {selectedItem && (
 <Button
 variant="ghost"
 size="icon"
 onClick={() => setSelectedItem(null)}
 className="hover:text-foreground hover:bg-muted transition-all"
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 )}
 <div className="flex-1">
 <h1 className="text-4xl md:text-5xl font-vicewave mb-2 tracking-tight">
 {selectedItem ? selectedItem.name : 'Sales Analytics'}
 </h1>
 <p className="text-muted-foreground font-futuristic">
 {selectedItem ? 'Performance breakdown and insights' : 'Select an item to view detailed performance'}
 </p>
 </div>
 </div>

 {/* Filters - Only show when no item is selected */}
 <AnimatePresence>
 {!selectedItem && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="flex flex-wrap gap-3"
 >
 <div className="relative flex-1 max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search items..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 glass border-border/50 focus:border-foreground/50 transition-all"
 />
 </div>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
 <Input
 type="date"
 value={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 className="pl-9 glass border-border/50 w-[160px]"
 />
 </div>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
 <Input
 type="date"
 value={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 className="pl-9 glass border-border/50 w-[160px]"
 />
 </div>
 <Button
 variant="outline"
 size="default"
 onClick={fetchAnalytics}
 className="glass border-border hover:bg-muted hover:border-foreground transition-all"
 >
 <BarChart3 className="h-4 w-4 mr-2" />
 Refresh
 </Button>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>

 <AnimatePresence mode="wait">
 {!selectedItem ? (
 <motion.div
 key="selection-view"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 >
 {loading ? (
 <div className="flex flex-col items-center justify-center py-32 gap-4">
 <Loader2 className="h-12 w-12 animate-spin text-foreground" />
 <p className="text-muted-foreground font-futuristic">Loading inventory analytics...</p>
 </div>
 ) : filteredItems.length === 0 ? (
 <Card className="glass">
 <CardContent className="flex flex-col items-center justify-center py-20">
 <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
 <p className="text-lg font-medium text-muted-foreground">No items found</p>
 <p className="text-sm text-muted-foreground/70">Try adjusting your filters</p>
 </CardContent>
 </Card>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
 {filteredItems.map((item) => (
 <motion.div
 key={item.id + (item.type === 'Product' ? '-p' : '-c')}
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 whileHover={{ scale: 1.03, y: -4 }}
 whileTap={{ scale: 0.97 }}
 onClick={() => setSelectedItem(item)}
 className="cursor-pointer"
 >
 <Card className={cn(
 "glass border transition-all duration-300 overflow-hidden h-full",
 "bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl",
 "hover:border-foreground/50 hover:shadow-xl hover:shadow-foreground/10"
 )}>
 <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted relative group">
 {item.image ? (
 <img
 src={getImageUrl(item.image) || ''}
 alt={item.name}
 className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <UtensilsCrossed className="h-12 w-12 text-muted-foreground/20" />
 </div>
 )}
 <div className="absolute top-2 right-2">
 <Badge
 variant="outline"
 className={cn(
 "backdrop-blur-sm border font-futuristic text-xs",
 item.type === 'Product'
 ? "bg-muted border-border text-foreground"
 : "bg-muted border-border text-foreground"
 )}
 >
 {item.type}
 </Badge>
 </div>
 </div>
 <CardContent className="p-3">
 <h3 className="font-bold text-sm truncate mb-1">{item.name}</h3>
 <p className="text-xs text-muted-foreground">Click for details</p>
 </CardContent>
 </Card>
 </motion.div>
 ))}
 </div>
 )}
 </motion.div>
 ) : (
 <motion.div
 key="breakdown-view"
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 transition={{ duration: 0.2 }}
 className="space-y-6"
 >
 {/* Item Header Card */}
 <Card className="glass overflow-hidden">
 <div className="grid lg:grid-cols-3 gap-6 p-6">
 <div className="lg:col-span-1">
 <div className="aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-gradient-to-br from-muted/50 to-muted shadow-2xl">
 {selectedItem.image ? (
 <img
 src={getImageUrl(selectedItem.image) || ''}
 alt={selectedItem.name}
 className="w-full h-full object-cover"
 />
 ) : (
 <div className="w-full h-full flex items-center justify-center">
 <UtensilsCrossed className="h-24 w-24 text-muted-foreground/20" />
 </div>
 )}
 </div>
 </div>

 <div className="lg:col-span-2 flex flex-col justify-center space-y-4">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <Badge
 variant="outline"
 className={cn(
 "font-futuristic",
 selectedItem.type === 'Product'
 ? "border-border text-foreground"
 : "border-border text-foreground"
 )}
 >
 {selectedItem.type}
 </Badge>
 <Badge className="bg-muted text-foreground border-border">
 Active
 </Badge>
 </div>
 <h2 className="text-4xl font-bold mb-2">{selectedItem.name}</h2>
 <p className="text-muted-foreground font-futuristic">
 Performance data aggregated from individual sale records
 </p>
 </div>

 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
 <div>
 <p className="text-sm text-muted-foreground mb-1">Average Price</p>
 <p className="text-xl font-bold text-foreground">
 ₵{selectedItem.quantity > 0 ? (Number(selectedItem.revenue) / selectedItem.quantity).toFixed(2) : '0.00'}
 </p>
 </div>
 <div>
 <p className="text-sm text-muted-foreground mb-1">Date Range</p>
 <p className="text-sm font-medium">
 {startDate && endDate ? `${startDate} to ${endDate}` : 'All time'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </Card>

 {/* Stats Grid */}
 <div className="grid md:grid-cols-2 gap-6">
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.1 }}
 >
 <Card className={cn(
 "glass border-t-4 border-t-foreground overflow-hidden",
 "bg-gradient-to-br from-muted/50 to-transparent"
 )}>
 <CardContent className="p-8 relative">
 <div className="absolute right-4 top-4 opacity-10">
 <Package className="h-32 w-32 text-foreground" />
 </div>
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-3">
 <Package className="h-5 w-5 text-foreground" />
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Quantity Sold</p>
 </div>
 <p className="text-6xl font-bold text-foreground mb-2 font-vicewave">{selectedItem.quantity}</p>
 <p className="text-sm text-muted-foreground font-futuristic">Units served in selected period</p>
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className={cn(
 "glass border-t-4 border-t-foreground overflow-hidden",
 "bg-gradient-to-br from-muted/50 to-transparent"
 )}>
 <CardContent className="p-8 relative">
 <div className="absolute right-4 top-4 opacity-10">
 <DollarSign className="h-32 w-32 text-foreground" />
 </div>
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-3">
 <DollarSign className="h-5 w-5 text-foreground" />
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
 </div>
 <p className="text-6xl font-bold text-foreground mb-2 font-vicewave">
 ₵{Number(selectedItem.revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </p>
 <div className="flex items-center gap-2 text-sm text-foreground font-futuristic">
 <TrendingUp className="h-4 w-4" />
 <span>Revenue contribution from this item</span>
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Insights Card */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-foreground">
 <BarChart3 className="h-5 w-5" />
 Performance Insights
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid md:grid-cols-3 gap-6">
 <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
 <p className="text-sm text-muted-foreground mb-1">Data Source</p>
 <p className="font-semibold">SaleItem Records</p>
 </div>
 <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
 <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
 <p className="font-semibold">{selectedItem.quantity} items</p>
 </div>
 <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
 <p className="text-sm text-muted-foreground mb-1">Performance Rating</p>
 <div className="flex items-center gap-2">
 <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
 <div
 className="h-full bg-gradient-to-r from-foreground/50 to-foreground"
 style={{ width: `${Math.min(100, (selectedItem.quantity / Math.max(...data.map(i => i.quantity)) * 100))}%` }}
 />
 </div>
 <span className="text-xs font-medium text-foreground">
 {Math.round((selectedItem.quantity / Math.max(...data.map(i => i.quantity)) * 100))}%
 </span>
 </div>
 </div>
 </div>

 <div className="mt-6 p-6 rounded-lg border border-dashed border-border/50 bg-muted/10">
 <p className="text-center text-muted-foreground font-futuristic italic">
 Detailed sales trends and time-series analysis for <strong className="text-foreground">{selectedItem.name}</strong> will appear here as more data is collected. Currently tracking <strong className="text-foreground">{selectedItem.quantity}</strong> verified sale records.
 </p>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
