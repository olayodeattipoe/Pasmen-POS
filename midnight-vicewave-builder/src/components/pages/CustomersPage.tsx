import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
 Users, 
 Search, 
 Plus, 
 Mail, 
 Phone, 
 MapPin, 
 Calendar,
 DollarSign,
 ShoppingCart,
 Star
} from "lucide-react";
import { motion } from "framer-motion";

// Mock data for customers
const mockCustomers = [
 {
 id: 1,
 name: "John Doe",
 email: "john.doe@email.com",
 phone: "+1 (555) 123-4567",
 address: "123 Main St, City, State",
 joinDate: "2024-01-15",
 totalOrders: 25,
 totalSpent: 1250.50,
 lastOrder: "2024-03-15",
 status: "active",
 rating: 4.8
 },
 {
 id: 2,
 name: "Jane Smith",
 email: "jane.smith@email.com",
 phone: "+1 (555) 234-5678",
 address: "456 Oak Ave, City, State",
 joinDate: "2024-02-20",
 totalOrders: 18,
 totalSpent: 890.25,
 lastOrder: "2024-03-14",
 status: "active",
 rating: 4.6
 },
 {
 id: 3,
 name: "Mike Johnson",
 email: "mike.johnson@email.com",
 phone: "+1 (555) 345-6789",
 address: "789 Pine Rd, City, State",
 joinDate: "2024-01-30",
 totalOrders: 12,
 totalSpent: 456.75,
 lastOrder: "2024-03-10",
 status: "inactive",
 rating: 4.2
 }
];

export default function CustomersPage() {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

 const filteredCustomers = mockCustomers.filter(customer =>
 customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
 customer.email.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const totalCustomers = mockCustomers.length;
 const activeCustomers = mockCustomers.filter(c => c.status === 'active').length;
 const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
 const averageOrderValue = totalRevenue / mockCustomers.reduce((sum, c) => sum + c.totalOrders, 0);

 return (
 <div className="space-y-6 p-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex justify-between items-center"
 >
 <div>
 <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">Customer Management</h1>
 <p className="text-muted-foreground font-futuristic text-lg">Manage customer relationships and track engagement</p>
 </div>
 <div className="flex items-center space-x-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search customers..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 w-64"
 />
 </div>
 <Button className="">
 <Plus className="h-4 w-4 mr-2" />
 Add Customer
 </Button>
 </div>
 </motion.div>

 {/* Customer Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 >
 <Card className="glass shimmer">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
 <Users className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
 <p className="text-xs text-muted-foreground">
 {activeCustomers} active customers
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
 <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
 <Users className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">{activeCustomers}</div>
 <p className="text-xs text-muted-foreground">
 {Math.round((activeCustomers / totalCustomers) * 100)}% of total
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
 <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
 <DollarSign className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
 <p className="text-xs text-muted-foreground">
 From customer purchases
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
 <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
 <ShoppingCart className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">${averageOrderValue.toFixed(2)}</div>
 <p className="text-xs text-muted-foreground">
 Per customer order
 </p>
 </CardContent>
 </Card>
 </motion.div>
 </div>

 {/* Customer List */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.5 }}
 className="lg:col-span-2"
 >
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Customer Directory</CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-4">
 {filteredCustomers.map((customer) => (
 <div
 key={customer.id}
 className={`p-4 rounded-lg border cursor-pointer transition-all ${
 selectedCustomer?.id === customer.id
 ? 'border-border bg-muted'
 : 'border-muted hover:border-border hover:bg-muted/30'
 }`}
 onClick={() => setSelectedCustomer(customer)}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3">
 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold">
 {customer.name.split(' ').map(n => n[0]).join('')}
 </div>
 <div>
 <div className="font-medium">{customer.name}</div>
 <div className="text-sm text-muted-foreground">{customer.email}</div>
 </div>
 </div>
 <div className="flex items-center space-x-2">
 <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
 {customer.status}
 </Badge>
 <div className="flex items-center text-sm text-muted-foreground">
 <Star className="h-4 w-4 mr-1 text-yellow-500" />
 {customer.rating}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </motion.div>

 {/* Customer Details */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.6 }}
 >
 {selectedCustomer ? (
 <Card className="glass">
 <CardHeader>
 <CardTitle className="text-foreground">Customer Details</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="text-center">
 <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-xl mx-auto mb-3">
 {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
 </div>
 <div className="font-semibold text-lg">{selectedCustomer.name}</div>
 <Badge variant={selectedCustomer.status === 'active' ? 'default' : 'secondary'} className="mt-2">
 {selectedCustomer.status}
 </Badge>
 </div>

 <div className="space-y-3">
 <div className="flex items-center space-x-3">
 <Mail className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm">{selectedCustomer.email}</span>
 </div>
 <div className="flex items-center space-x-3">
 <Phone className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm">{selectedCustomer.phone}</span>
 </div>
 <div className="flex items-center space-x-3">
 <MapPin className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm">{selectedCustomer.address}</span>
 </div>
 <div className="flex items-center space-x-3">
 <Calendar className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm">Joined {new Date(selectedCustomer.joinDate).toLocaleDateString()}</span>
 </div>
 </div>

 <div className="pt-4 border-t border-muted">
 <div className="grid grid-cols-2 gap-4 text-center">
 <div>
 <div className="text-2xl font-bold text-foreground">{selectedCustomer.totalOrders}</div>
 <div className="text-xs text-muted-foreground">Total Orders</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-foreground">${selectedCustomer.totalSpent}</div>
 <div className="text-xs text-muted-foreground">Total Spent</div>
 </div>
 </div>
 </div>

 <div className="pt-4">
 <Button className="w-full ">
 View Order History
 </Button>
 </div>
 </CardContent>
 </Card>
 ) : (
 <Card className="glass">
 <CardContent className="flex items-center justify-center h-64">
 <div className="text-center">
 <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">Select a customer to view details</p>
 </div>
 </CardContent>
 </Card>
 )}
 </motion.div>
 </div>
 </div>
 );
}
