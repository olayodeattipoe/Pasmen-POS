import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
 FileText,
 Settings,
 Trash2,
 Edit,
 Plus,
 Clock,
 ShieldCheck,
 Eye,
 ChevronLeft,
 ChevronRight,
 Search,
 RefreshCw,
 MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getActivityLogs, getUsers } from '@/api/features';
import { ActivityLog, User } from '@/api/models';
import { useToast } from "@/hooks/use-toast";
import {
 Table,
 TableBody,
 TableCell,
 TableHead,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Reports() {
 const [logs, setLogs] = useState<ActivityLog[]>([]);
 const [loading, setLoading] = useState(true);
 const [currentPage, setCurrentPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [totalCount, setTotalCount] = useState(0);
 const { toast } = useToast();

 // Filters
 const [selectedUser, setSelectedUser] = useState<string>('all');
 const [selectedAction, setSelectedAction] = useState<string>('all');
 const [date, setDate] = useState<Date | undefined>(undefined);
 const [users, setUsers] = useState<User[]>([]);

 // Details Modal
 const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
 const [detailsOpen, setDetailsOpen] = useState(false);

 const fetchLogs = async (page = 1) => {
 setLoading(true);
 try {
 const filters: any = {};
 if (selectedUser !== 'all') filters.user = parseInt(selectedUser);
 if (selectedAction !== 'all') filters.action = selectedAction;
 if (date) {
 // Backend expects YYYY-MM-DD for simpler filtering or implement range if needed
 filters.startDate = format(date, 'yyyy-MM-dd');
 }

 const response = await getActivityLogs(page, filters);
 setLogs(response.results);
 setTotalCount(response.count);
 setTotalPages(Math.ceil(response.count / 10)); // Assuming 10 items per page default
 } catch (error) {
 console.error("Failed to fetch logs:", error);
 toast({
 title: "Error",
 description: "Failed to load activity logs",
 variant: "destructive"
 });
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchLogs(currentPage);
 }, [currentPage, selectedUser, selectedAction, date]);

 useEffect(() => {
 // Fetch users for filter dropdown
 const fetchUsersData = async () => {
 try {
 const response = await getUsers(1); // fetch first page of users
 // ideally we might want a search endpoint for users or fetch all for dropdown
 setUsers(response.results);
 } catch (error) {
 console.error("Failed to fetch users", error);
 }
 };
 fetchUsersData();
 }, []);

 const handlePageChange = (newPage: number) => {
 if (newPage >= 1 && newPage <= totalPages) {
 setCurrentPage(newPage);
 }
 };

 const getActionColor = (action: string) => {
 switch (action.toUpperCase()) {
 case 'POST': return 'bg-green-500/20 text-green-500 border-green-500/50';
 case 'DELETE': return 'bg-red-500/20 text-red-500 border-red-500/50';
 case 'PATCH':
 case 'PUT': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
 default: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
 }
 };

 const openDetails = (log: ActivityLog) => {
 setSelectedLog(log);
 setDetailsOpen(true);
 };

 return (
 <div className="space-y-6 p-6">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
 >
 <div>
 <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">Activity Logs</h1>
 <p className="text-muted-foreground font-futuristic text-lg">
 Monitor system actions and audit trails
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <Button
 variant="outline"
 size="sm"
 onClick={() => fetchLogs(currentPage)}
 disabled={loading}
 className="glass"
 >
 <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
 Refresh
 </Button>
 </div>
 </motion.div>

 {/* Filters */}
 <Card className="glass border-border">
 <CardContent className="pt-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {/* User Filter */}
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground uppercase">Filter by User</label>
 <Select value={selectedUser} onValueChange={setSelectedUser}>
 <SelectTrigger className="bg-background/50 border-input/50">
 <SelectValue placeholder="All Users" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Users</SelectItem>
 {users.map(u => (
 <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Action Filter */}
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground uppercase">Filter by Action</label>
 <Select value={selectedAction} onValueChange={setSelectedAction}>
 <SelectTrigger className="bg-background/50 border-input/50">
 <SelectValue placeholder="All Actions" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Actions</SelectItem>
 <SelectItem value="POST">Created (POST)</SelectItem>
 <SelectItem value="PATCH">Updated (PATCH)</SelectItem>
 <SelectItem value="DELETE">Deleted (DELETE)</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {/* Date Filter */}
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground uppercase">Filter by Date</label>
 <Popover>
 <PopoverTrigger asChild>
 <Button
 variant={"outline"}
 className={cn(
 "w-full justify-start text-left font-normal bg-background/50 border-input/50",
 !date && "text-muted-foreground"
 )}
 >
 <CalendarIcon className="mr-2 h-4 w-4" />
 {date ? format(date, "PPP") : <span>Pick a date</span>}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0">
 <Calendar
 mode="single"
 selected={date}
 onSelect={setDate}
 initialFocus
 />
 </PopoverContent>
 </Popover>
 </div>

 <div className="flex items-end">
 <Button
 variant="ghost"
 onClick={() => {
 setSelectedUser('all');
 setSelectedAction('all');
 setDate(undefined);
 }}
 className="text-muted-foreground hover:text-foreground"
 >
 Reset Filters
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>

 {/* Logs Table */}
 <Card className="glass border-border overflow-hidden">
 <div className="rounded-md border border-border">
 <Table>
 <TableHeader className="bg-muted/50">
 <TableRow>
 <TableHead>Timestamp</TableHead>
 <TableHead>User</TableHead>
 <TableHead>Action</TableHead>
 <TableHead>Entity / Endpoint</TableHead>
 <TableHead>IP Address</TableHead>
 <TableHead className="text-right">Details</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 [...Array(5)].map((_, i) => (
 <TableRow key={i}>
 <TableCell><div className="h-4 w-32 bg-muted/50 rounded animate-pulse"></div></TableCell>
 <TableCell><div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
 <TableCell><div className="h-6 w-16 bg-muted/50 rounded animate-pulse"></div></TableCell>
 <TableCell><div className="h-4 w-48 bg-muted/50 rounded animate-pulse"></div></TableCell>
 <TableCell><div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div></TableCell>
 <TableCell><div className="h-8 w-8 bg-muted/50 rounded animate-pulse ml-auto"></div></TableCell>
 </TableRow>
 ))
 ) : logs.length === 0 ? (
 <TableRow>
 <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
 No activity logs found matching current filters.
 </TableCell>
 </TableRow>
 ) : (
 logs.map((log) => (
 <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
 <TableCell className="font-mono text-xs text-muted-foreground">
 {new Date(log.timestamp).toLocaleString()}
 </TableCell>
 <TableCell className="font-medium">
 {log.user}
 </TableCell>
 <TableCell>
 <Badge variant="outline" className={getActionColor(log.action)}>
 {log.action}
 </Badge>
 </TableCell>
 <TableCell className="max-w-[200px] truncate" title={log.endpoint}>
 {log.endpoint}
 </TableCell>
 <TableCell className="text-xs font-mono text-muted-foreground">
 {log.ip_address || "N/A"}
 </TableCell>
 <TableCell className="text-right">
 <Button variant="ghost" size="icon" onClick={() => openDetails(log)}>
 <Eye className="h-4 w-4 text-foreground" />
 </Button>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>

 {/* Pagination */}
 {totalCount > 0 && (
 <div className="flex items-center justify-between p-4 border-t border-border/50">
 <div className="text-xs text-muted-foreground">
 Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalCount)} of {totalCount} logs
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 size="icon"
 onClick={() => handlePageChange(currentPage - 1)}
 disabled={currentPage === 1 || loading}
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <span className="text-sm font-medium">
 Page {currentPage} of {totalPages}
 </span>
 <Button
 variant="outline"
 size="icon"
 onClick={() => handlePageChange(currentPage + 1)}
 disabled={currentPage === totalPages || loading}
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 </div>
 </div>
 )}
 </Card>

 {/* Details Dialog */}
 <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
 <DialogContent className="max-w-2xl glass">
 <DialogHeader>
 <DialogTitle className="text-foreground">Activity Details</DialogTitle>
 <DialogDescription>
 Full details of the selected action.
 </DialogDescription>
 </DialogHeader>
 {selectedLog && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div>
 <span className="text-muted-foreground block text-xs uppercase">Timestamp</span>
 <span className="font-mono">{new Date(selectedLog.timestamp).toLocaleString()}</span>
 </div>
 <div>
 <span className="text-muted-foreground block text-xs uppercase">User</span>
 <span className="font-medium">{selectedLog.user}</span>
 </div>
 <div>
 <span className="text-muted-foreground block text-xs uppercase">Endpoint</span>
 <span className="font-mono break-all">{selectedLog.endpoint}</span>
 </div>
 <div>
 <span className="text-muted-foreground block text-xs uppercase">IP Address</span>
 <span>{selectedLog.ip_address || 'N/A'}</span>
 </div>
 </div>

 <div className="border border-border/50 rounded-md p-3 bg-black/20 overflow-hidden">
 <span className="text-muted-foreground block text-xs uppercase mb-2">Change Details (JSON)</span>
 <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap text-foreground/80">
 {JSON.stringify(selectedLog.details, null, 2)}
 </pre>
 </div>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}
