import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 AlertTriangle,
 Search,
 Bell,
 Clock,
 CheckCircle,
 XCircle,
 Info,
 AlertCircle,
 Filter,
 RefreshCw,
 CheckCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlerts, markAlertAsRead, markAllAlertsAsRead } from '@/api/features';
import { Alert, AlertType, AlertSeverity } from '@/api/models';
import { useToast } from "@/hooks/use-toast";

export default function AlertsPage() {
 const [alerts, setAlerts] = useState<Alert[]>([]);
 const [loading, setLoading] = useState(true);
 const [isPolling, setIsPolling] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');
 const [filterType, setFilterType] = useState('all');
 const [filterStatus, setFilterStatus] = useState('all');
 const { toast } = useToast();

 const fetchAlerts = useCallback(async (showLoading = true) => {
 if (showLoading) setLoading(true);
 else setIsPolling(true);

 try {
 const data = await getAlerts();
 setAlerts(data);
 } catch (error: any) {
 console.error("Failed to fetch alerts:", error);
 toast({
 title: "Error",
 description: "Failed to fetch alerts from server",
 variant: "destructive"
 });
 } finally {
 if (showLoading) setLoading(false);
 setIsPolling(false);
 }
 }, [toast]);

 useEffect(() => {
 fetchAlerts();

 // Set up polling every 30 seconds
 const interval = setInterval(() => {
 fetchAlerts(false);
 }, 30000);

 return () => clearInterval(interval);
 }, [fetchAlerts]);

 const handleMarkAsRead = async (alertId: number) => {
 try {
 await markAlertAsRead(alertId);
 setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to mark alert as read",
 variant: "destructive"
 });
 }
 };

 const handleMarkAllAsRead = async () => {
 try {
 await markAllAlertsAsRead();
 setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
 toast({
 title: "Success",
 description: "All alerts marked as read",
 });
 } catch (error) {
 toast({
 title: "Error",
 description: "Failed to mark all alerts as read",
 variant: "destructive"
 });
 }
 };

 const filteredAlerts = (Array.isArray(alerts) ? alerts : []).filter(alert => {
 const matchesSearch = alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
 alert.item_name.toLowerCase().includes(searchQuery.toLowerCase());
 const matchesType = filterType === 'all' || alert.alert_type === filterType;
 const matchesStatus = filterStatus === 'all' ||
 (filterStatus === 'read' ? alert.is_read : !alert.is_read);

 return matchesSearch && matchesType && matchesStatus;
 });

 const validAlerts = Array.isArray(alerts) ? alerts : [];
 const unreadCount = validAlerts.filter(a => !a.is_read).length;
 const criticalCount = validAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
 const totalAlerts = validAlerts.length;
 const todayAlerts = validAlerts.filter(a => new Date(a.created_at).toDateString() === new Date().toDateString()).length;

 const getAlertIcon = (type: string) => {
 switch (type) {
 case AlertType.OUT_OF_STOCK: return <XCircle className="h-5 w-5 text-red-500" />;
 case AlertType.LOW_STOCK: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
 default: return <Bell className="h-5 w-5 text-muted-foreground" />;
 }
 };

 const getSeverityBadge = (severity: AlertSeverity) => {
 switch (severity) {
 case AlertSeverity.CRITICAL:
 return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Critical</Badge>;
 case AlertSeverity.WARN:
 return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Warning</Badge>;
 default: return null;
 }
 };

 return (
 <div className="space-y-6 p-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
 >
 <div>
 <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">Stock Alerts</h1>
 <p className="text-muted-foreground font-futuristic text-lg flex items-center gap-2">
 Monitor inventory levels and restocking needs
 {isPolling && <RefreshCw className="h-4 w-4 animate-spin text-foreground" />}
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search items..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 w-64 glass"
 />
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => fetchAlerts(true)}
 disabled={loading}
 className="glass"
 >
 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
 Refresh
 </Button>
 <Button
 variant="default"
 size="sm"
 onClick={handleMarkAllAsRead}
 disabled={unreadCount === 0}
 className="bg-muted text-black hover:bg-cyan-400 font-bold"
 >
 <CheckCheck className="h-4 w-4 mr-2" />
 Mark All Read
 </Button>
 </div>
 </motion.div>

 {/* Alert Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <StatCard title="Total Active" value={totalAlerts} subtext={`${todayAlerts} today`} icon={<Bell className="h-4 w-4 text-foreground" />} color="cyan" />
 <StatCard title="Unread" value={unreadCount} subtext={`${Math.round((unreadCount / (totalAlerts || 1)) * 100)}% of total`} icon={<AlertCircle className="h-4 w-4 text-foreground" />} color="pink" />
 <StatCard title="Critical" value={criticalCount} subtext="Require immediate attention" icon={<AlertTriangle className="h-4 w-4 text-foreground" />} color="purple" />
 <StatCard title="Resolved" value={totalAlerts - unreadCount} subtext="Seen by staff" icon={<CheckCircle className="h-4 w-4 text-foreground" />} color="cyan" />
 </div>

 {/* Filters */}
 <div className="flex flex-wrap gap-4">
 <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-md border border-border bg-background/50 backdrop-blur-md">
 <option value="all">All Types</option>
 <option value={AlertType.LOW_STOCK}>Low Stock</option>
 <option value={AlertType.OUT_OF_STOCK}>Out of Stock</option>
 </select>
 <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-md border border-border bg-background/50 backdrop-blur-md">
 <option value="all">All Status</option>
 <option value="unread">Unread</option>
 <option value="read">Read</option>
 </select>
 </div>

 {/* Alerts List */}
 <Card className="glass border-border">
 <CardHeader className="border-b border-border">
 <CardTitle className="text-foreground font-vicewave">Alert History</CardTitle>
 </CardHeader>
 <CardContent className="pt-6">
 <div className="space-y-4">
 <AnimatePresence mode="popLayout">
 {filteredAlerts.length === 0 ? (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-muted/5 rounded-xl border border-dashed border-border/50">
 <Bell className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
 <p className="text-xl font-medium text-muted-foreground">No alerts found</p>
 <p className="text-sm text-muted-foreground/70">Everything seems to be in order!</p>
 </motion.div>
 ) : (
 filteredAlerts.map((alert) => (
 <motion.div
 key={alert.id}
 layout
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className={`p-5 rounded-xl border transition-all duration-300 ${!alert.is_read
 ? 'border-border bg-muted shadow-lg '
 : 'border-border/30 bg-muted/5 opacity-80'
 }`}
 >
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-start space-x-4">
 <div className={`p-3 rounded-xl bg-background/80 border ${!alert.is_read ? 'border-border' : 'border-border/50'}`}>
 {getAlertIcon(alert.alert_type)}
 </div>
 <div>
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <h3 className={`font-bold text-lg ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
 {alert.item_name}
 </h3>
 <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-border text-foreground">
 {alert.item_type}
 </Badge>
 {getSeverityBadge(alert.severity)}
 {!alert.is_read && (
 <Badge className="bg-muted text-black animate-pulse">New</Badge>
 )}
 </div>
 <p className="text-muted-foreground mb-3 leading-relaxed">{alert.message}</p>
 <div className="flex items-center space-x-4 text-xs font-futuristic text-muted-foreground/60">
 <div className="flex items-center gap-1.5">
 <Clock className="h-3.5 w-3.5" />
 <span>{new Date(alert.created_at).toLocaleString()}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Info className="h-3.5 w-3.5" />
 <span className="capitalize">{alert.alert_type.toLowerCase().replace('_', ' ')}</span>
 </div>
 </div>
 </div>
 </div>
 <div className="flex flex-col items-end gap-2">
 {!alert.is_read ? (
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleMarkAsRead(alert.id)}
 className="border-border hover:bg-muted hover:text-black transition-all"
 >
 Mark Read
 </Button>
 ) : (
 <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold">
 <CheckCircle className="h-4 w-4" />
 Read
 </div>
 )}
 </div>
 </div>
 </motion.div>
 ))
 )}
 </AnimatePresence>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}

function StatCard({ title, value, subtext, icon, color }: { title: string, value: number, subtext: string, icon: React.ReactNode, color: 'cyan' | 'pink' | 'purple' }) {
 const colorClasses = {
 cyan: ' border-border',
 pink: ' border-border',
 purple: ' border-border'
 };

 return (
 <motion.div
 whileHover={{ y: -4 }}
 transition={{ type: "spring", stiffness: 300 }}
 >
 <Card className={`glass ${colorClasses[color]} shimmer overflow-hidden`}>
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
 {icon}
 </CardHeader>
 <CardContent>
 <div className="text-3xl font-black mb-1 font-vicewave">{value}</div>
 <p className="text-xs text-muted-foreground font-futuristic">
 {subtext}
 </p>
 </CardContent>
 </Card>
 </motion.div>
 );
}
