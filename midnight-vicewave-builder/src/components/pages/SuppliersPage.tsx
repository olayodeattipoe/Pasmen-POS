import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
 Truck,
 Search,
 Plus,
 Mail,
 Phone,
 MapPin,
 Clock,
 DollarSign,
 Package,
 ShoppingBag,
 Calendar,
 Loader2,
 Calendar as CalendarIcon,
 Filter,
 X,
 Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { getSuppliers, addSupplier, getAllPurchases, addPurchase, getAllRawItems, deleteSupplier } from "@/api/features";
import { Supplier, Purchase, RawItem } from "@/api/models";

export default function SuppliersPage() {
 const [activeTab, setActiveTab] = useState("suppliers");
 const [isLoading, setIsLoading] = useState(true);
 const [suppliers, setSuppliers] = useState<Supplier[]>([]);
 const [purchases, setPurchases] = useState<Purchase[]>([]);
 const [rawItems, setRawItems] = useState<RawItem[]>([]);
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

 // Pagination State
 const [purchasePage, setPurchasePage] = useState(1);
 const [totalPurchaseCount, setTotalPurchaseCount] = useState(0);

 // Filters State
 const [dateRange, setDateRange] = useState<DateRange | undefined>();
 const [selectedItemFilter, setSelectedItemFilter] = useState<string>("all");
 const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("all");
 const [aggStats, setAggStats] = useState({ total_quantity: 0, total_cost: 0 });

 // Modal States
 const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
 const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);

 // Forms
 const [newSupplier, setNewSupplier] = useState({ name: '', contact_info: '', address: '' });
 const [newPurchase, setNewPurchase] = useState({
 raw_item: '',
 quantity: '',
 supplier: '',
 total_cost: ''
 });

 const fetchData = async () => {
 setIsLoading(true);
 try {
 const filters: any = {};
 if (dateRange?.from) filters.startDate = format(dateRange.from, 'yyyy-MM-dd');
 if (dateRange?.to) filters.endDate = format(dateRange.to, 'yyyy-MM-dd');
 if (selectedItemFilter && selectedItemFilter !== "all") filters.rawItemId = selectedItemFilter;
 if (selectedSupplierFilter && selectedSupplierFilter !== "all") filters.supplierId = selectedSupplierFilter;

 const [suppliersData, purchasesData, rawItemsData] = await Promise.all([
 getSuppliers(),
 getAllPurchases(filters, purchasePage),
 getAllRawItems()
 ]);
 setSuppliers(suppliersData || []);
 setPurchases(purchasesData?.results || []);
 setTotalPurchaseCount(purchasesData?.count || 0);
 setAggStats({
 total_quantity: purchasesData?.total_quantity || 0,
 total_cost: purchasesData?.total_cost || 0
 });
 setRawItems(rawItemsData || []);

 // Auto-select first supplier if none selected and we have suppliers
 if (!selectedSupplier && suppliersData && suppliersData.length > 0) {
 setSelectedSupplier(suppliersData[0]);
 }
 } catch (error) {
 console.error("Error fetching data:", error);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [dateRange, selectedItemFilter, selectedSupplierFilter, purchasePage]); // Refetch when filters change

 const handleAddSupplier = async () => {
 try {
 await addSupplier({
 id: 0, // Backend assigns ID
 ...newSupplier
 });
 setIsAddSupplierOpen(false);
 setNewSupplier({ name: '', contact_info: '', address: '' });
 fetchData(); // Refresh data
 } catch (error) {
 console.error("Failed to add supplier", error);
 }
 };

 const handleAddPurchase = async () => {
 try {
 await addPurchase({
 raw_item: parseInt(newPurchase.raw_item),
 quantity: parseInt(newPurchase.quantity),
 supplier: parseInt(newPurchase.supplier),
 total_cost: parseFloat(newPurchase.total_cost)
 });
 setIsAddPurchaseOpen(false);
 setNewPurchase({ raw_item: '', quantity: '', supplier: '', total_cost: '' });
 fetchData(); // Refresh data
 } catch (error) {
 console.error("Failed to add purchase", error);
 }
 };

 const handleDeleteSupplier = async (supplier: Supplier) => {
 const confirmed = window.confirm(`⚠️ Warning: Are you sure you want to delete supplier "${supplier.name}"? This will not delete past purchases but will remove the supplier from future selections.`);
 if (confirmed) {
 try {
 await deleteSupplier(supplier.id);
 setSelectedSupplier(null);
 await fetchData();
 } catch (error: any) {
 console.error("Failed to delete supplier", error);
 alert(error.message || "Failed to delete supplier");
 }
 }
 };

 const openPurchaseModalForSupplier = (supplierId: number) => {
 setNewPurchase(prev => ({ ...prev, supplier: supplierId.toString() }));
 setIsAddPurchaseOpen(true);
 };

 // Stats
 const totalSuppliers = suppliers.length;
 const totalPurchases = purchases.length;
 const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_cost), 0);

 // Filtered Lists
 const filteredSuppliers = suppliers.filter(s =>
 s.name.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const filteredPurchases = purchases.filter(p => {
 const rawItem = rawItems.find(r => r.id === p.raw_item);
 return rawItem?.name.toLowerCase().includes(searchQuery.toLowerCase());
 });

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-full">
 <Loader2 className="w-8 h-8 animate-spin text-foreground" />
 </div>
 );
 }

 return (
 <div className="space-y-6 p-6 pb-20">
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
 >
 <div>
 <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">Procurement</h1>
 <p className="text-muted-foreground font-futuristic text-lg">Manage suppliers and track inventory purchases</p>
 </div>
 <div className="flex items-center space-x-4">
 <Button
 onClick={() => setIsAddSupplierOpen(true)}
 className=" bg-muted text-foreground border border-border hover:bg-muted"
 >
 <Plus className="h-4 w-4 mr-2" />
 Add Supplier
 </Button>
 <Button
 onClick={() => setIsAddPurchaseOpen(true)}
 className=" bg-muted text-foreground border border-border hover:bg-muted"
 >
 <Plus className="h-4 w-4 mr-2" />
 Record Purchase
 </Button>
 </div>
 </motion.div>

 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <Card className="glass ">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
 <Truck className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">{totalSuppliers}</div>
 </CardContent>
 </Card>
 <Card className="glass ">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
 <ShoppingBag className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">{totalPurchases}</div>
 </CardContent>
 </Card>
 <Card className="glass ">
 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
 <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
 <DollarSign className="h-4 w-4 text-foreground" />
 </CardHeader>
 <CardContent>
 <div className="text-2xl font-bold text-foreground">₵{totalSpent.toLocaleString()}</div>
 </CardContent>
 </Card>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="bg-muted/50 w-full justify-start mb-6">
 <TabsTrigger value="suppliers" className="flex-1 max-w-[200px]">Suppliers</TabsTrigger>
 <TabsTrigger value="purchases" className="flex-1 max-w-[200px]">Purchase History</TabsTrigger>
 </TabsList>

 <TabsContent value="suppliers" className="space-y-6">
 <div className="relative mb-6">
 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search suppliers..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9 bg-muted/30"
 />
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className={`col-span-1 transition-all duration-300`}>
 <div className="flex flex-col gap-3">
 {filteredSuppliers.map((supplier) => (
 <Card
 key={supplier.id}
 className={`cursor-pointer transition-all hover:bg-muted/50 p-4 ${selectedSupplier?.id === supplier.id ? 'border-border ring-1 ring-foreground bg-muted/40' : ''}`}
 onClick={() => setSelectedSupplier(supplier)}
 >
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
 {supplier.name.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="font-medium text-sm truncate">{supplier.name}</h4>
 <p className="text-xs text-muted-foreground truncate">{supplier.address}</p>
 </div>
 </div>
 </Card>
 ))}
 </div>
 </div>

 {selectedSupplier && (
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 className="col-span-1 lg:col-span-2"
 >
 <Card className="glass sticky top-4">
 <CardHeader>
 <div className="flex justify-between items-start">
 <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center font-bold text-3xl text-primary mb-4">
 {selectedSupplier.name.charAt(0)}
 </div>
 <div className="flex items-center gap-2">
 <Button
 variant="ghost"
 size="icon"
 onClick={() => handleDeleteSupplier(selectedSupplier)}
 className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
 title="Delete Supplier"
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(null)}>
 <span className="sr-only">Close</span>
 <X className="h-4 w-4" />
 </Button>
 </div>
 </div>

 <CardTitle>{selectedSupplier.name}</CardTitle>
 <CardDescription>Supplier Details</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-3">
 <div className="flex items-center gap-3 text-muted-foreground">
 <Phone className="h-4 w-4" />
 <span>{selectedSupplier.contact_info}</span>
 </div>
 <div className="flex items-center gap-3 text-muted-foreground">
 <MapPin className="h-4 w-4" />
 <span>{selectedSupplier.address}</span>
 </div>
 </div>

 <div className="pt-4">
 <Button
 className="w-full bg-purple-600 text-white hover:bg-purple-700"
 onClick={() => openPurchaseModalForSupplier(selectedSupplier.id)}
 >
 <ShoppingBag className="w-4 h-4 mr-2" />
 Record Details
 </Button>
 </div>

 <div className="pt-4 border-t border-border">
 <h4 className="font-semibold mb-3">Recent Purchases from this Supplier</h4>
 <div className="space-y-3">
 {purchases.filter(p => p.supplier === selectedSupplier.id).slice(0, 5).map(p => {
 const item = rawItems.find(r => r.id === p.raw_item);
 const units = item?.unit_batch_quantity ? (p.quantity / item.unit_batch_quantity).toFixed(1) : null;
 return (
 <div key={p.id} className="flex justify-between text-sm">
 <span>
 {item?.name || 'Unknown Item'}
 <span className="text-xs text-muted-foreground ml-1">
 ({units ? `${units} units` : `${p.quantity} ${item?.unit || ''}`})
 </span>
 </span>
 <span className="font-mono">₵{p.total_cost}</span>
 </div>
 );
 })}
 {purchases.filter(p => p.supplier === selectedSupplier.id).length === 0 && (
 <div className="text-sm text-muted-foreground">No recent purchases</div>
 )}
 </div>
 </div>
 </CardContent>
 </Card>
 </motion.div>
 )}
 </div>
 </TabsContent>

 <TabsContent value="purchases">
 <Card className="glass">
 <CardHeader>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <CardTitle>Purchase History</CardTitle>
 <CardDescription>Recent stock replenishments</CardDescription>
 </div>

 {/* Filters */}
 <div className="flex flex-wrap items-center gap-2">
 {/* Supplier Filter */}
 <Select value={selectedSupplierFilter} onValueChange={setSelectedSupplierFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by Supplier" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Suppliers</SelectItem>
 {suppliers.map(s => (
 <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>

 {/* Item Filter */}
 <Select value={selectedItemFilter} onValueChange={setSelectedItemFilter}>
 <SelectTrigger className="w-[180px]">
 <SelectValue placeholder="Filter by Item" />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Items</SelectItem>
 {rawItems.map(item => (
 <SelectItem key={item.id} value={item.id?.toString() || ''}>{item.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>

 {/* Date Picker */}
 <Popover>
 <PopoverTrigger asChild>
 <Button
 id="date"
 variant={"outline"}
 className={cn(
 "w-[260px] justify-start text-left font-normal",
 !dateRange && "text-muted-foreground"
 )}
 >
 <CalendarIcon className="mr-2 h-4 w-4" />
 {dateRange?.from ? (
 dateRange.to ? (
 <>
 {format(dateRange.from, "LLL dd, y")} -{" "}
 {format(dateRange.to, "LLL dd, y")}
 </>
 ) : (
 format(dateRange.from, "LLL dd, y")
 )
 ) : (
 <span>Pick a date range</span>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-auto p-0" align="end">
 <CalendarComponent
 initialFocus
 mode="range"
 defaultMonth={dateRange?.from}
 selected={dateRange}
 onSelect={setDateRange}
 numberOfMonths={2}
 />
 </PopoverContent>
 </Popover>

 {/* Clear Filters */}
 {(dateRange || selectedItemFilter !== "all") && (
 <Button
 variant="ghost"
 onClick={() => {
 setDateRange(undefined);
 setSelectedItemFilter("all");
 setSelectedSupplierFilter("all");
 }}
 className="px-2"
 >
 <X className="h-4 w-4" />
 </Button>
 )}
 </div>
 </div>
 </CardHeader>
 <CardContent>
 {/* Totals Summary */}
 <div className="flex items-center gap-6 mb-4 p-4 rounded-lg bg-muted/20 border border-border/50">
 <div>
 <span className="text-sm text-muted-foreground block">Total Records</span>
 <span className="text-xl font-bold">{totalPurchaseCount}</span>
 </div>
 {selectedItemFilter !== "all" && (
 <>
 <div>
 <span className="text-sm text-muted-foreground block">Total Units</span>
 <span className="text-xl font-bold text-foreground max-w-[150px] truncate" title={aggStats.total_quantity.toString()}>
 {aggStats.total_quantity}
 {(() => {
 const item = rawItems.find(r => r.id?.toString() === selectedItemFilter);
 return item?.unit ? ` ${item.unit}` : '';
 })()}
 </span>
 </div>
 {(() => {
 const item = rawItems.find(r => r.id?.toString() === selectedItemFilter);
 if (item && item.unit_batch_quantity) {
 const estimated = (aggStats.total_quantity / item.unit_batch_quantity).toFixed(1);
 return (
 <div>
 <span className="text-sm text-muted-foreground block">Est. ({item.unit_batch_quantity} {item.unit}/unit)</span>
 <span className="text-xl font-bold text-foreground">{estimated} units</span>
 </div>
 );
 }
 return null;
 })()}
 </>
 )}
 <div>
 <span className="text-sm text-muted-foreground block">Total Cost</span>
 <span className="text-xl font-bold text-foreground">₵{aggStats.total_cost.toLocaleString()}</span>
 </div>
 </div>

 <div className="space-y-4">
 {purchases.map((purchase) => {
 const supplier = suppliers.find(s => s.id === purchase.supplier);
 const rawItem = rawItems.find(r => r.id === purchase.raw_item);

 return (
 <div key={purchase.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
 <div className="flex items-center gap-4">
 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
 <Package className="h-5 w-5 text-foreground" />
 </div>
 <div>
 <div className="font-semibold text-foreground">
 {rawItem?.name || 'Unknown Item'}
 <span className="text-muted-foreground font-normal ml-2">
 x{purchase.quantity} {rawItem?.unit}
 {rawItem?.unit_batch_quantity && (
 <span className="text-xs ml-1">
 ({(purchase.quantity / rawItem.unit_batch_quantity).toFixed(1)} units)
 </span>
 )}
 </span>
 </div>
 <div className="text-sm text-muted-foreground flex items-center gap-2">
 <Truck className="h-3 w-3" /> {supplier?.name || 'Unknown Supplier'}
 <span className="text-xs">&bull;</span>
 <Calendar className="h-3 w-3" /> {new Date(purchase.purchase_date).toLocaleDateString()}
 </div>
 </div>
 </div>
 <div className="text-right">
 <div className="font-bold text-lg text-foreground">₵{purchase.total_cost}</div>
 <Badge variant="outline" className="text-xs border-border text-foreground">Completed</Badge>
 </div>
 </div>
 );
 })}
 {filteredPurchases.length === 0 && (
 <div className="text-center py-12 text-muted-foreground">
 No purchases found
 </div>
 )}
 </div>

 {/* Pagination Controls */}
 <div className="flex items-center justify-between pt-4 border-t border-border">
 <div className="text-sm text-muted-foreground">
 Showing {purchases.length} of {totalPurchaseCount} entries
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
 disabled={purchasePage === 1}
 className="border-border hover:bg-muted"
 >
 Previous
 </Button>
 <div className="flex items-center px-4 bg-muted/30 rounded text-sm font-medium">
 Page {purchasePage} of {Math.ceil(totalPurchaseCount / 10) || 1}
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPurchasePage(p => p + 1)}
 disabled={purchasePage * 10 >= totalPurchaseCount}
 className="border-border hover:bg-muted"
 >
 Next
 </Button>
 </div>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>

 {/* Add Supplier Modal */}
 <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
 <DialogContent className="glass border-border">
 <DialogHeader>
 <DialogTitle>Add New Supplier</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label>Supplier Name</Label>
 <Input
 value={newSupplier.name}
 onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
 placeholder="e.g. Fresh Farms Ltd"
 />
 </div>
 <div className="space-y-2">
 <Label>Contact Info</Label>
 <Input
 value={newSupplier.contact_info}
 onChange={(e) => setNewSupplier({ ...newSupplier, contact_info: e.target.value })}
 placeholder="Phone or Email"
 />
 </div>
 <div className="space-y-2">
 <Label>Address</Label>
 <Input
 value={newSupplier.address}
 onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
 placeholder="Physical Address"
 />
 </div>
 </div>
 <DialogFooter>
 <Button onClick={handleAddSupplier} className="bg-muted text-black hover:bg-muted">
 Save Supplier
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Add Purchase Modal */}
 <Dialog open={isAddPurchaseOpen} onOpenChange={setIsAddPurchaseOpen}>
 <DialogContent className="glass border-border">
 <DialogHeader>
 <DialogTitle>Record New Purchase</DialogTitle>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label>Supplier</Label>
 <Select
 value={newPurchase.supplier}
 onValueChange={(val) => setNewPurchase({ ...newPurchase, supplier: val })}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select Supplier" />
 </SelectTrigger>
 <SelectContent>
 {suppliers.map(s => (
 <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>Raw Item</Label>
 <Select
 value={newPurchase.raw_item}
 onValueChange={(val) => setNewPurchase({ ...newPurchase, raw_item: val })}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select Item to Restock" />
 </SelectTrigger>
 <SelectContent>
 {rawItems.map(item => (
 <SelectItem key={item.id} value={item.id?.toString() || ''}>{item.name} ({item.unit})</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>Quantity</Label>
 <Input
 type="number"
 value={newPurchase.quantity}
 onChange={(e) => setNewPurchase({ ...newPurchase, quantity: e.target.value })}
 placeholder="Qty"
 />
 {newPurchase.raw_item && newPurchase.quantity && (
 (() => {
 const item = rawItems.find(r => r.id.toString() === newPurchase.raw_item);
 const qty = parseFloat(newPurchase.quantity);
 if (item && item.unit_batch_quantity && !isNaN(qty)) {
 return (
 <p className="text-xs text-muted-foreground mt-1">
 Approx: {(qty / item.unit_batch_quantity).toFixed(1)} units (based on {item.unit_batch_quantity} {item.unit}/unit)
 </p>
 );
 }
 return null;
 })()
 )}
 </div>
 <div className="space-y-2">
 <Label>Total Cost</Label>
 <Input
 type="number"
 value={newPurchase.total_cost}
 onChange={(e) => setNewPurchase({ ...newPurchase, total_cost: e.target.value })}
 placeholder="Amount"
 />
 </div>
 </div>
 </div>
 <DialogFooter>
 <Button onClick={handleAddPurchase} className="bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto">
 Record Purchase
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
