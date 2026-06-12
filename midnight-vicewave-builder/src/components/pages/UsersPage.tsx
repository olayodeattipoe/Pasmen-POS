
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Users,
    Search,
    Plus,
    Mail,
    Phone,
    Clock,
    Shield,
    CheckCircle,
    User,
    TrendingUp,
    CreditCard,
    Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { getUsers, adminCreateUser, getSales, deleteUser } from '@/api/features';
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    groups: string[];
    date_joined: string;
    last_login: string;
}

interface Sale {
    id: number;
    sale_date: string;
    total_amount: string;
    sale_status: string;
    sales_id: string;
    // include other fields if needed from Sale model
}

export default function UsersPage() {
    const { toast } = useToast();

    // State
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userStats, setUserStats] = useState({ totalOrders: 0, totalVolume: 0 });

    // Sales Data State
    const [userSales, setUserSales] = useState<Sale[]>([]);
    const [salesPage, setSalesPage] = useState(1);
    const [totalSalesCount, setTotalSalesCount] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('COMPLETED');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        group: 'Server' // Default
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsers(currentPage, {
                search: searchQuery,
                group: selectedGroup
            });
            setUsers(data.results || []);
            setTotalCount(data.count || 0);

            if (!selectedUser && data.results && data.results.length > 0) {
                setSelectedUser(data.results[0]);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchQuery, selectedGroup]);

    useEffect(() => {
        const fetchUserSales = async () => {
            if (!selectedUser) return;

            try {
                // Fetch sales for this user with optional date and status filters
                const data: any = await getSales(salesPage, startDate || undefined, endDate || undefined, selectedUser.id, selectedStatus === 'all' ? undefined : selectedStatus);

                setUserSales(data.results || []);
                setTotalSalesCount(data.count || 0);

                // Update stats from backend response if available, else zero
                setUserStats({
                    totalOrders: data.total_orders_count || 0,
                    totalVolume: data.total_sales_volume || 0
                });

            } catch (error) {
                console.error("Failed to fetch user sales", error);
            }
        };

        fetchUserSales();
    }, [selectedUser, salesPage, startDate, endDate, selectedStatus]);

    const handleCreateUser = async () => {
        if (newUser.password !== newUser.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive"
            });
            return;
        }

        try {
            await adminCreateUser(newUser);
            toast({
                title: "User Created",
                description: `Successfully created user ${newUser.username}`,
            });
            setIsAddUserOpen(false);
            setNewUser({ username: '', password: '', confirmPassword: '', group: 'Server' });
            fetchUsers();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create user",
                variant: "destructive"
            });
        }
    };
    const handleDeleteUser = async (user: User) => {
        const confirmed = window.confirm(`⚠️ Warning: Are you sure you want to delete user "${user.username}"? This action cannot be undone.`);
        if (confirmed) {
            try {
                await deleteUser(user.id);
                toast({
                    title: "User Deleted",
                    description: `Successfully deleted user ${user.username}`,
                });
                setSelectedUser(null);
                fetchUsers();
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to delete user",
                    variant: "destructive"
                });
            }
        }
    };


    const getRoleBadge = (groups: string[]) => {
        if (groups.includes('POS Admin')) return <Badge className="bg-muted text-black hover:bg-muted border-0">Admin</Badge>;
        if (groups.includes('Server')) return <Badge className="bg-muted text-black hover:bg-muted border-0">Server</Badge>;
        return <Badge variant="secondary">User</Badge>;
    };

    return (
        <div className="space-y-6 p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-center"
            >
                <div>
                    <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">User Management</h1>
                    <p className="text-muted-foreground font-futuristic text-lg">Manage Staff and Administrators</p>
                </div>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                    <DialogTrigger asChild>
                        <Button className="">
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input
                                    value={newUser.username}
                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                    placeholder="jdoe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={newUser.confirmPassword}
                                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Select
                                    value={newUser.group}
                                    onValueChange={(val) => setNewUser({ ...newUser, group: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Server">Server</SelectItem>
                                        <SelectItem value="POS Admin">POS Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateUser}>Create User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: User List */}
                <div className="col-span-1 flex flex-col gap-4">
                    <Card className="glass">
                        <div className="p-4 space-y-4">
                            {/* Filters */}
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger className="w-[110px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Server">Servers</SelectItem>
                                        <SelectItem value="POS Admin">Admins</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <CardContent className="p-0">
                            <div className="max-h-[600px] overflow-y-auto px-4 pb-4 space-y-2">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedUser?.id === user.id
                                            ? 'border-border bg-muted'
                                            : 'border-border hover:bg-muted/50'
                                            }`}
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${user.groups.includes('POS Admin') ? 'bg-muted text-foreground' : 'bg-muted text-foreground'
                                                }`}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-sm">{user.username}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Joined {new Date(user.date_joined).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        {getRoleBadge(user.groups)}
                                    </div>
                                ))}

                                {users.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No users found.
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            <div className="p-4 border-t border-border flex justify-between items-center text-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    Prev
                                </Button>
                                <span className="text-muted-foreground">
                                    Page {currentPage} of {Math.ceil(totalCount / 10) || 1}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={currentPage * 10 >= totalCount}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details */}
                <motion.div
                    className="col-span-1 lg:col-span-2 space-y-6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    {selectedUser ? (
                        <>
                            {/* User Info Card */}
                            <Card className="glass border-t-4 border-border">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-2xl ${selectedUser.groups.includes('POS Admin') ? 'bg-muted text-foreground' : 'bg-muted text-foreground'
                                                }`}>
                                                {selectedUser.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">{selectedUser.username}</CardTitle>
                                                <div className="flex gap-2 mt-2">
                                                    {selectedUser.groups.map(g => (
                                                        <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                                                    ))}
                                                    <Badge variant={selectedUser.last_login ? 'default' : 'outline'}>
                                                        {selectedUser.last_login ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleDeleteUser(selectedUser)}
                                            className="h-10 w-10"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-md">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-xs text-muted-foreground">Last Login</div>
                                            <div className="text-sm font-medium">
                                                {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : 'Never'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-md">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="text-xs text-muted-foreground">Permissions</div>
                                            <div className="text-sm font-medium">Standard Access</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Performance Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="glass ">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders Handled</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-foreground">{userStats.totalOrders}</div>
                                        <p className="text-xs text-muted-foreground">Lifetime orders processed</p>
                                    </CardContent>
                                </Card>

                                <Card className="glass ">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales Volume</CardTitle>
                                        <CreditCard className="h-4 w-4 text-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-foreground">₵{userStats.totalVolume.toLocaleString()}</div>
                                        <p className="text-xs text-muted-foreground">Revenue generated</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sales History Table */}
                            <Card className="glass">
                                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2">
                                    <CardTitle className="text-xl text-foreground">Recent Sales Activity</CardTitle>

                                    {/* Date Filters */}
                                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                                        <div className="w-[130px] md:w-[150px]">
                                            <Input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="h-8 text-xs bg-muted/20"
                                            />
                                        </div>
                                        <div className="w-[130px] md:w-[150px]">
                                            <Input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="h-8 text-xs bg-muted/20"
                                            />
                                        </div>
                                        <div className="w-[130px]">
                                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                                <SelectTrigger className="h-8 text-xs bg-muted/20">
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
                                                    <SelectItem value="PROCESSING">Processing</SelectItem>
                                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md border border-border overflow-x-auto w-full">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-muted-foreground bg-muted/20">
                                                <tr>
                                                    <th className="p-3">Order ID</th>
                                                    <th className="p-3">Date</th>
                                                    <th className="p-3">Amount</th>
                                                    <th className="p-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userSales.map((sale) => (
                                                    <tr key={sale.id} className="border-t border-border hover:bg-muted/10">
                                                        <td className="p-3 font-medium">
                                                            <span title={sale.sales_id}>#{sale.sales_id.slice(-6)}</span>
                                                        </td>
                                                        <td className="p-3">{new Date(sale.sale_date).toLocaleString()}</td>
                                                        <td className="p-3">₵{parseFloat(sale.total_amount).toFixed(2)}</td>
                                                        <td className="p-3">
                                                            <Badge variant={sale.sale_status === 'COMPLETED' ? 'default' : 'outline'}>
                                                                {sale.sale_status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {userSales.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">No recent sales found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Pagination for Sales */}
                                    <div className="flex items-center justify-between mt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                                            disabled={salesPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            Page {salesPage} of {Math.ceil(totalSalesCount / 10) || 1}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSalesPage(p => p + 1)}
                                            disabled={salesPage * 10 >= totalSalesCount}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="glass h-full flex items-center justify-center text-muted-foreground p-12">
                            <div className="text-center">
                                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Select a user to view details</p>
                            </div>
                        </Card>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
