import { Layout } from "@/components/Layout";
import { motion } from "framer-motion";
import {
 DollarSign,
 TrendingUp,
 Package,
 AlertTriangle,
 Clock,
 Calendar as CalendarIcon,
 ArrowRight,
 TrendingDown
} from "lucide-react";
import {
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { getSales, getAlerts, getRevenueTrend } from "../api/features"; // Relative import to skip potential alias lag
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

export default function Index() {
 const { user } = useAuth();
 const [loading, setLoading] = useState(true);
 const [stats, setStats] = useState({
 todayRevenue: 0,
 todayOrders: 0,
 monthRevenue: 0,
 activeAlerts: 0
 });
 const [chartData, setChartData] = useState<any[]>([]);
 const [recentOrders, setRecentOrders] = useState<any[]>([]);

 useEffect(() => {
 const loadDashboardData = async () => {
 try {
 const today = new Date();
 const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

 // Parallel data fetching
 const [todaySales, monthSales, alertsRes, recentRes, trendRes] = await Promise.all([
 // 1. Today's Stats (Page 1, Start, End)
 getSales(1, format(today, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
 // 2. Monthly Revenue (Page 1, Start, End)
 getSales(1, format(startOfMonth, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')),
 // 3. Alerts
 getAlerts(),
 // 4. Recent Orders (Page 1, No dates)
 getSales(1),
 // 5. Revenue Trend
 getRevenueTrend(7)
 ]);

 // Cast response to any to access custom aggregate fields
 const todayData = todaySales as any;
 const monthData = monthSales as any;
 const recentData = recentRes as any;

 setStats({
 todayRevenue: todayData.total_sales_volume || 0,
 todayOrders: todayData.total_orders_count || 0,
 monthRevenue: monthData.total_sales_volume || 0,
 activeAlerts: Array.isArray(alertsRes) ? alertsRes.length : 0
 });

 setChartData(trendRes || []);
 // Take top 5 recent orders
 setRecentOrders(recentData.results.slice(0, 5));
 } catch (error) {
 console.error("Dashboard data load failed", error);
 } finally {
 setLoading(false);
 }
 };

 loadDashboardData();
 }, []);

 const getGreeting = () => {
 const hour = new Date().getHours();
 if (hour < 12) return "Good Morning";
 if (hour < 18) return "Good Afternoon";
 return "Good Evening";
 };

 const container = {
 hidden: { opacity: 0 },
 show: {
 opacity: 1,
 transition: {
 staggerChildren: 0.1
 }
 }
 };

 const item = {
 hidden: { opacity: 0, y: 20 },
 show: { opacity: 1, y: 0 }
 };

 return (
 <div className="space-y-8 p-2 md:p-0">

 {/* Welcome Section */}
 <motion.div
 initial={{ opacity: 0, y: -20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
 >
 <div>
 <h1 className="text-4xl font-vicewave text-foreground tracking-wide mb-2">
 {getGreeting()}, {user?.username || 'Chef'}!
 </h1>
 <p className="text-muted-foreground font-futuristic flex items-center gap-2">
 <CalendarIcon className="w-4 h-4 text-foreground" />
 {format(new Date(), "EEEE, MMMM do, yyyy")}
 <span className="text-border mx-2">|</span>
 <Clock className="w-4 h-4 text-foreground" />
 Store Status: <span className="text-emerald-500 font-bold">OPEN</span>
 </p>
 </div>
 <div className="flex gap-3">
 <Button variant="outline" className="glass border-border text-foreground hover:bg-muted" asChild>
 <Link to="/inventory">
 View Inventory <ArrowRight className="ml-2 w-4 h-4" />
 </Link>
 </Button>
 </div>
 </motion.div>

 {/* Stats Grid */}
 <motion.div
 variants={container}
 initial="hidden"
 animate="show"
 className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
 >
 {/* Revenue Card */}
 <motion.div variants={item}>
 <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent overflow-hidden relative">
 <div className="absolute right-0 top-0 p-4 opacity-10">
 <DollarSign className="w-24 h-24" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Revenue</p>
 <div className="p-2 bg-muted rounded-lg text-foreground">
 <DollarSign className="w-4 h-4" />
 </div>
 </div>
 {loading ? <Skeleton className="h-8 w-24" /> : (
 <div>
 <h3 className="text-3xl font-bold font-vicewave">₵{stats.todayRevenue.toLocaleString()}</h3>
 <p className="text-xs text-emerald-500 flex items-center mt-1">
 <TrendingUp className="w-3 h-3 mr-1" /> Daily Tally
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Orders Card */}
 <motion.div variants={item}>
 <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent overflow-hidden relative">
 <div className="absolute right-0 top-0 p-4 opacity-10">
 <Package className="w-24 h-24" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Orders</p>
 <div className="p-2 bg-muted rounded-lg text-foreground">
 <Package className="w-4 h-4" />
 </div>
 </div>
 {loading ? <Skeleton className="h-8 w-24" /> : (
 <div>
 <h3 className="text-3xl font-bold font-vicewave">{stats.todayOrders}</h3>
 <p className="text-xs text-muted-foreground mt-1">Orders processed so far</p>
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Monthly Card */}
 <motion.div variants={item}>
 <Card className="glass border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden relative">
 <div className="absolute right-0 top-0 p-4 opacity-10">
 <TrendingUp className="w-24 h-24" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Revenue</p>
 <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
 <TrendingUp className="w-4 h-4" />
 </div>
 </div>
 {loading ? <Skeleton className="h-8 w-24" /> : (
 <div>
 <h3 className="text-3xl font-bold font-vicewave">₵{stats.monthRevenue.toLocaleString()}</h3>
 <p className="text-xs text-emerald-500 flex items-center mt-1">
 Active Month
 </p>
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>

 {/* Alerts Card */}
 <motion.div variants={item}>
 <Card className="glass border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-transparent overflow-hidden relative">
 <div className="absolute right-0 top-0 p-4 opacity-10">
 <AlertTriangle className="w-24 h-24" />
 </div>
 <CardContent className="p-6 relative z-10">
 <div className="flex items-center justify-between mb-4">
 <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Alerts</p>
 <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
 <AlertTriangle className="w-4 h-4" />
 </div>
 </div>
 {loading ? <Skeleton className="h-8 w-24" /> : (
 <div>
 <h3 className="text-3xl font-bold font-vicewave">{stats.activeAlerts}</h3>
 <p className="text-xs text-orange-500 mt-1">Requires attention</p>
 </div>
 )}
 </CardContent>
 </Card>
 </motion.div>
 </motion.div>

 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
 {/* Main Chart */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 className="col-span-4"
 >
 <Card className="glass border-border h-full">
 <CardHeader>
 <CardTitle className="text-foreground font-vicewave tracking-wide">Weekly Revenue Trend</CardTitle>
 </CardHeader>
 <CardContent className="pl-2">
 <ResponsiveContainer width="100%" height={350}>
 <AreaChart data={chartData}>
 <defs>
 <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
 <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
 <XAxis
 dataKey="name"
 stroke="#888888"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 />
 <YAxis
 stroke="#888888"
 fontSize={12}
 tickLine={false}
 axisLine={false}
 tickFormatter={(value) => `₵${value}`}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: 'rgba(0,0,0,0.8)',
 border: '1px solid #00f3ff',
 borderRadius: '0.5rem',
 color: '#fff'
 }}
 itemStyle={{ color: '#00f3ff' }}
 />
 <Area
 type="monotone"
 dataKey="value"
 stroke="#00f3ff"
 strokeWidth={3}
 fillOpacity={1}
 fill="url(#colorValue)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </motion.div>

 {/* Recent Orders List */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6 }}
 className="col-span-3"
 >
 <Card className="glass border-border h-full flex flex-col">
 <CardHeader>
 <CardTitle className="text-foreground font-vicewave tracking-wide">Recent Activity</CardTitle>
 </CardHeader>
 <CardContent className="flex-1 overflow-hidden">
 <div className="space-y-4">
 {loading ? (
 [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
 ) : recentOrders.length === 0 ? (
 <div className="text-center text-muted-foreground py-8">No recent orders found.</div>
 ) : (
 recentOrders.map((order) => (
 <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-full bg-gradient-to-br from-muted/50 to-blue-500/20 flex items-center justify-center text-foreground font-bold">
 {order.daily_sequence_number || '#'}
 </div>
 <div>
 <p className="font-medium text-sm flex items-center gap-2">
 Order #{order.daily_sequence_number}
 {order.is_delivery && (
 <Badge variant="outline" className="text-[8px] h-4 border-orange-500/50 text-orange-500 bg-orange-500/10 px-1">
 DEL
 </Badge>
 )}
 </p>
 <p className="text-xs text-muted-foreground">{new Date(order.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-sm">₵{parseFloat(order.total_amount).toFixed(2)}</p>
 <Badge variant="outline" className="text-[10px] h-5 border-white/20 text-white/70">
 {order.sale_status}
 </Badge>
 </div>
 </div>
 ))
 )}
 </div>
 </CardContent>
 <div className="p-4 border-t border-white/10">
 <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white" asChild>
 <Link to="/analytics">View All Transactions</Link>
 </Button>
 </div>
 </Card>
 </motion.div>
 </div>

 </div>
 );
}
