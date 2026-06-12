import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
 Activity, 
 AlertTriangle, 
 CheckCircle, 
 Clock, 
 Users, 
 ShoppingCart,
 TrendingUp,
 Server,
 Database,
 Wifi
} from "lucide-react";
import { motion } from "framer-motion";

// Mock data for monitoring
const mockMonitoringData = {
 systemHealth: {
 status: 'healthy',
 uptime: '99.9%',
 responseTime: '45ms',
 activeConnections: 156
 },
 alerts: [
 { id: 1, type: 'warning', message: 'High CPU usage detected', time: '2 min ago', severity: 'medium' },
 { id: 2, type: 'info', message: 'Database backup completed', time: '15 min ago', severity: 'low' },
 { id: 3, type: 'error', message: 'Payment gateway timeout', time: '1 hour ago', severity: 'high' }
 ],
 activeOrders: [
 { id: 'ORD-001', customer: 'John Doe', items: 3, total: 45.50, status: 'preparing', time: '5 min' },
 { id: 'ORD-002', customer: 'Jane Smith', items: 2, total: 32.00, status: 'ready', time: '2 min' },
 { id: 'ORD-003', customer: 'Mike Johnson', items: 1, total: 18.75, status: 'preparing', time: '8 min' }
 ],
 staffActivity: [
 { name: 'Alice Johnson', role: 'Server', status: 'active', orders: 12, lastActivity: '2 min ago' },
 { name: 'Bob Smith', role: 'Kitchen', status: 'busy', orders: 8, lastActivity: '1 min ago' },
 { name: 'Carol Davis', role: 'Manager', status: 'active', orders: 5, lastActivity: '5 min ago' }
 ]
};

export default function MonitoringDashboard() {
 const [searchQuery, setSearchQuery] = useState('');

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'healthy': return 'text-emerald-500';
 case 'warning': return 'text-yellow-500';
 case 'error': return 'text-red-500';
 case 'active': return 'text-foreground';
 case 'busy': return 'text-foreground';
 case 'preparing': return 'text-yellow-500';
 case 'ready': return 'text-emerald-500';
 default: return 'text-muted-foreground';
 }
 };

 const getSeverityColor = (severity: string) => {
 switch (severity) {
 case 'high': return 'bg-red-500';
 case 'medium': return 'bg-yellow-500';
 case 'low': return 'bg-blue-500';
 default: return 'bg-muted';
 }
 };

 return (
 <div className="space-y-6 p-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex justify-between items-center"
 >
 <div>
 <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">System Monitoring</h1>
 <p className="text-muted-foreground font-futuristic text-lg">Real-time system health and performance metrics</p>
 </div>
 <div className="flex items-center space-x-4">
 <Input
 placeholder="Search alerts..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-64"
 />
 <Button variant="outline" size="sm">
 <Activity className="h-4 w-4 mr-2" />
 Refresh
 </Button>
 </div>
 </motion.div>

 {/* System Health Overview */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 >
 <Card className="glass shimmer">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">System Status</CardTitle>
 <CheckCircle className="h-4 w-4 text-emerald-500" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-emerald-500 capitalize">
 {mockMonitoringData.systemHealth.status}
 </div>
 <p className="text-xs text-muted-foreground">
 All systems operational
 </p>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 >
 <Card className="glass shimmer">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Uptime</CardTitle>
 <Server className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">
 {mockMonitoringData.systemHealth.uptime}
 </div>
 <p className="text-xs text-muted-foreground">
 Last 30 days
 </p>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.3 }}
 >
 <Card className="glass shimmer">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Response Time</CardTitle>
 <TrendingUp className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">
 {mockMonitoringData.systemHealth.responseTime}
 </div>
 <p className="text-xs text-muted-foreground">
 Average response time
 </p>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.4 }}
 >
 <Card className="glass shimmer">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
 <Wifi className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">
 {mockMonitoringData.systemHealth.activeConnections}
 </div>
 <p className="text-xs text-muted-foreground">
 Current connections
 </p>
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Alerts and Activity */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground flex items-center">
 <AlertTriangle className="h-5 w-5 mr-2" />
 System Alerts
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {mockMonitoringData.alerts.map((alert) => (
 <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
 <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
 <div className="flex-1">
 <div className="font-medium">{alert.message}</div>
 <div className="text-sm text-muted-foreground">{alert.time}</div>
 </div>
 <Badge variant="outline" className="text-xs">
 {alert.severity}
 </Badge>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground flex items-center">
 <ShoppingCart className="h-5 w-5 mr-2" />
 Active Orders
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {mockMonitoringData.activeOrders.map((order) => (
 <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
 <div>
 <div className="font-medium">{order.customer}</div>
 <div className="text-sm text-muted-foreground">
 {order.items} items • {order.time} ago
 </div>
 </div>
 <div className="flex items-center space-x-2">
 <div className="text-right">
 <div className="font-semibold text-foreground">${order.total}</div>
 </div>
 <Badge 
 variant="outline"
 className={getStatusColor(order.status)}
 >
 {order.status}
 </Badge>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Staff Activity */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.7 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground flex items-center">
 <Users className="h-5 w-5 mr-2" />
 Staff Activity
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {mockMonitoringData.staffActivity.map((staff, index) => (
 <div key={index} className="p-4 rounded-lg bg-muted/30">
 <div className="flex items-center justify-between mb-2">
 <div className="font-medium">{staff.name}</div>
 <Badge 
 variant="outline"
 className={getStatusColor(staff.status)}
 >
 {staff.status}
 </Badge>
 </div>
 <div className="text-sm text-muted-foreground mb-2">{staff.role}</div>
 <div className="flex justify-between text-sm">
 <span>{staff.orders} orders</span>
 <span>{staff.lastActivity}</span>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Performance Metrics */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.8 }}
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Performance Metrics</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
 <div className="text-center">
 <Activity className="h-12 w-12 text-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">Real-time performance charts would be displayed here</p>
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 </div>
 );
}
