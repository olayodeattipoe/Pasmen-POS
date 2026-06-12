import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Truck,
    ShoppingBag,
    DollarSign,
    Package,
    Calendar,
    Loader2,
    X,
    Store,
    FlaskConical,
    Edit2,
    Calendar as CalendarIcon,
    Phone,
    MapPin,
    Trash2,
    SendHorizontal,
    CheckCircle2,
    AlertCircle,
    History,
    FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
    getAllMainStoreRawItems,
    addMainStoreRawItem,
    updateMainStoreRawItem,
    getSuppliers,
    addSupplier,
    deleteSupplier,
    getAllPurchases,
    addPurchase,
    disburseRawItem
} from '@/api/features';
import { RawItem, Supplier, Purchase } from '@/api/models';
import AddTransformableModal from './AddTransformableModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';

export default function MainStorePage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('rawitems');

    // ── Raw Items State ──────────────────────────────────────────────────────────
    const [rawItems, setRawItems] = useState<RawItem[]>([]);
    const [rawItemsLoading, setRawItemsLoading] = useState(true);
    const [rawSearch, setRawSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<RawItem | undefined>(undefined);
    const [adjustingItem, setAdjustingItem] = useState<RawItem | null>(null);

    // ── Disburse State ──────────────────────────────────────────────────────────
    const BRANCHES = [
        { label: 'Main Branch', host: (import.meta.env.VITE_API_MAIN_BRANCH as string || '').replace(/^https?:\/\//, '') },
        { label: 'Frontline Branch', host: (import.meta.env.VITE_API_FRONTLINE_BRANCH as string || '').replace(/^https?:\/\//, '') },
        { label: 'Accuzi Branch', host: (import.meta.env.VITE_API_ACCUZI_BRANCH as string || '').replace(/^https?:\/\//, '') },
        { label: 'TekCredit Branch', host: (import.meta.env.VITE_API_TEKCREDIT_BRANCH as string || '').replace(/^https?:\/\//, '') },
    ].filter(b => b.host);

    const [disburseItemId, setDisburseItemId] = useState<string>('');
    const [disburseBranch, setDisburseBranch] = useState<string>('');
    const [disburseQty, setDisburseQty] = useState<string>('');
    const [disburseLoading, setDisburseLoading] = useState(false);
    type DisburseLog = { id: number; itemName: string; branch: string; qty: number; status: 'ok' | 'err'; msg: string };
    const [disburseLogs, setDisburseLogs] = useState<DisburseLog[]>([]);
    const [disburseLogCounter, setDisburseLogCounter] = useState(0);

    // ── Suppliers State ──────────────────────────────────────────────────────────
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [suppliersLoading, setSuppliersLoading] = useState(true);
    const [supplierSearch, setSupplierSearch] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState({ name: '', contact_info: '', address: '' });

    // ── Purchases State ──────────────────────────────────────────────────────────
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [purchasesLoading, setPurchasesLoading] = useState(true);
    const [totalPurchaseCount, setTotalPurchaseCount] = useState(0);
    const [aggStats, setAggStats] = useState({ total_quantity: 0, total_cost: 0 });
    const [purchasePage, setPurchasePage] = useState(1);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedItemFilter, setSelectedItemFilter] = useState<string>('all');
    const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');

    // Purchase form modal
    const [isAddPurchaseOpen, setIsAddPurchaseOpen] = useState(false);
    const [newPurchase, setNewPurchase] = useState({
        raw_item: '',
        quantity: '',
        supplier: '',
        total_cost: '',
    });

    // ── Fetchers ─────────────────────────────────────────────────────────────────
    const fetchRawItems = async () => {
        setRawItemsLoading(true);
        try {
            const data = await getAllMainStoreRawItems();
            setRawItems(data || []);
        } catch (e) {
            console.error('Failed to load raw items', e);
        } finally {
            setRawItemsLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        setSuppliersLoading(true);
        try {
            const data = await getSuppliers();
            setSuppliers(data || []);
        } catch (e) {
            console.error('Failed to load suppliers', e);
        } finally {
            setSuppliersLoading(false);
        }
    };

    const fetchPurchases = async () => {
        setPurchasesLoading(true);
        try {
            const filters: any = {};
            if (dateRange?.from) filters.startDate = format(dateRange.from, 'yyyy-MM-dd');
            if (dateRange?.to) filters.endDate = format(dateRange.to, 'yyyy-MM-dd');
            if (selectedItemFilter && selectedItemFilter !== 'all') filters.rawItemId = selectedItemFilter;
            if (selectedSupplierFilter && selectedSupplierFilter !== 'all') filters.supplierId = selectedSupplierFilter;

            const [suppliersData, purchasesData] = await Promise.all([
                getSuppliers(),
                getAllPurchases(filters, purchasePage),
            ]);
            setSuppliers(suppliersData || []);
            setPurchases(purchasesData?.results || []);
            setTotalPurchaseCount(purchasesData?.count || 0);
            setAggStats({
                total_quantity: purchasesData?.total_quantity || 0,
                total_cost: purchasesData?.total_cost || 0,
            });
        } catch (e) {
            console.error('Failed to load purchases', e);
        } finally {
            setPurchasesLoading(false);
        }
    };

    useEffect(() => {
        fetchRawItems();
        fetchSuppliers();
    }, []);

    useEffect(() => {
        fetchPurchases();
    }, [dateRange, selectedItemFilter, selectedSupplierFilter, purchasePage]);

    // ── Handlers ─────────────────────────────────────────────────────────────────
    const handleAddRawItem = async (formData: RawItem) => {
        try {
            await addMainStoreRawItem(formData);
            setShowAddModal(false);
            setEditingItem(undefined);
            await fetchRawItems();
        } catch (e) {
            console.error('Failed to add raw item', e);
        }
    };

    const handleEditRawItem = async (formData: RawItem) => {
        if (!editingItem?.id) return;
        try {
            await updateMainStoreRawItem(editingItem.id, formData);
            setShowAddModal(false);
            setEditingItem(undefined);
            await fetchRawItems();
        } catch (e) {
            console.error('Failed to update raw item', e);
        }
    };

    const handleModalSubmit = async (formData: RawItem) => {
        if (editingItem) {
            await handleEditRawItem(formData);
        } else {
            await handleAddRawItem(formData);
        }
    };

    const handleAddPurchase = async () => {
        try {
            await addPurchase({
                raw_item: parseInt(newPurchase.raw_item),
                quantity: parseInt(newPurchase.quantity),
                supplier: parseInt(newPurchase.supplier),
                total_cost: parseFloat(newPurchase.total_cost),
            });
            setIsAddPurchaseOpen(false);
            setNewPurchase({ raw_item: '', quantity: '', supplier: '', total_cost: '' });
            fetchPurchases();
        } catch (e) {
            console.error('Failed to add purchase', e);
        }
    };

    const handleAddSupplier = async () => {
        try {
            await addSupplier({ id: 0, ...newSupplier });
            setIsAddSupplierOpen(false);
            setNewSupplier({ name: '', contact_info: '', address: '' });
            await fetchSuppliers();
        } catch (e) {
            console.error('Failed to add supplier', e);
        }
    };

    const handleDisburse = async () => {
        const item = rawItems.find(r => r.id?.toString() === disburseItemId);
        if (!item || !disburseBranch || !disburseQty || parseFloat(disburseQty) <= 0) return;
        setDisburseLoading(true);
        const qty = parseFloat(disburseQty);
        const branchLabel = BRANCHES.find(b => b.host === disburseBranch)?.label || disburseBranch;
        try {
            const res = await disburseRawItem(item.id!, disburseBranch, qty);
            setDisburseLogs(prev => [{
                id: disburseLogCounter + 1,
                itemName: item.name,
                branch: branchLabel,
                qty,
                status: 'ok',
                msg: res?.detail || 'Disbursed successfully',
            }, ...prev]);
            setDisburseLogCounter(c => c + 1);
            setDisburseQty('');
            // Refresh raw items so stock updates
            await fetchRawItems();
        } catch (e: any) {
            setDisburseLogs(prev => [{
                id: disburseLogCounter + 1,
                itemName: item.name,
                branch: branchLabel,
                qty,
                status: 'err',
                msg: e.message || 'Disbursement failed',
            }, ...prev]);
            setDisburseLogCounter(c => c + 1);
        } finally {
            setDisburseLoading(false);
        }
    };

    const handleDeleteSupplier = async (supplier: Supplier) => {
        const confirmed = window.confirm(`⚠️ Delete supplier "${supplier.name}"? Past purchases will be retained.`);
        if (!confirmed) return;
        try {
            await deleteSupplier(supplier.id);
            setSelectedSupplier(null);
            await fetchSuppliers();
        } catch (e: any) {
            console.error('Failed to delete supplier', e);
            alert(e.message || 'Failed to delete supplier');
        }
    };

    const openPurchaseForSupplier = (supplierId: number) => {
        setNewPurchase(prev => ({ ...prev, supplier: supplierId.toString() }));
        setIsAddPurchaseOpen(true);
    };

    // ── Derived ──────────────────────────────────────────────────────────────────
    const filteredRawItems = rawItems.filter((item) =>
        item.name.toLowerCase().includes(rawSearch.toLowerCase())
    );

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );

    const totalSpent = purchases.reduce((s, p) => s + Number(p.total_cost), 0);

    return (
        <div className="min-h-full w-full">
            {/* Page Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border-b shadow-sm"
            >
                <div className="px-8 py-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foreground tracking-tight flex items-center gap-3">
                            <Store className="w-10 h-10 text-foreground" />
                            Main Store
                        </h1>
                        <p className="text-muted-foreground font-futuristic text-lg">
                            Manage raw ingredients and record stock purchases
                        </p>
                    </div>
                </div>
            </motion.header>

            {/* Tabs */}
            <div className="py-6 px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass py-4 mb-6 rounded-lg border-b shadow-md"
                    >
                        <div className="flex items-center justify-between px-4 py-2">
                            <TabsList className="bg-transparent p-0 gap-2">
                                <TabsTrigger
                                    value="rawitems"
                                    className={cn(
                                        'data-[state=active]:bg-foreground data-[state=active]:text-background',
                                        'border border-border rounded-md px-6 py-3 text-base transition-all hover:bg-muted/50'
                                    )}
                                >
                                    <FlaskConical className="w-4 h-4 mr-2" />
                                    Raw Items
                                </TabsTrigger>
                                <TabsTrigger
                                    value="purchases"
                                    className={cn(
                                        'data-[state=active]:bg-foreground data-[state=active]:text-background',
                                        'border border-border rounded-md px-6 py-3 text-base transition-all hover:bg-muted/50'
                                    )}
                                >
                                    <ShoppingBag className="w-4 h-4 mr-2" />
                                    Purchases
                                </TabsTrigger>
                                <TabsTrigger
                                    value="suppliers"
                                    className={cn(
                                        'data-[state=active]:bg-foreground data-[state=active]:text-background',
                                        'border border-border rounded-md px-6 py-3 text-base transition-all hover:bg-muted/50'
                                    )}
                                >
                                    <Truck className="w-4 h-4 mr-2" />
                                    Suppliers
                                </TabsTrigger>
                                <TabsTrigger
                                    value="disburse"
                                    className={cn(
                                        'data-[state=active]:bg-foreground data-[state=active]:text-background',
                                        'border border-border rounded-md px-6 py-3 text-base transition-all hover:bg-muted/50'
                                    )}
                                >
                                    <SendHorizontal className="w-4 h-4 mr-2" />
                                    Disburse
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </motion.div>

                    {/* ── RAW ITEMS TAB ──────────────────────────────────────────────────── */}
                    <TabsContent value="rawitems" className="animate-in fade-in-50">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search raw items..."
                                    value={rawSearch}
                                    onChange={(e) => setRawSearch(e.target.value)}
                                    className="pl-9 bg-muted/50 border-border"
                                />
                            </div>
                            <Button
                                onClick={() => { setEditingItem(undefined); setShowAddModal(true); }}
                                className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-semibold border-2 border-foreground shadow-lg"
                            >
                                <Plus className="h-5 w-5" />
                                Add Raw Item
                            </Button>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <Card className="glass border-border shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <FlaskConical className="w-5 h-5 text-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</div>
                                        <div className="text-2xl font-bold text-foreground">{rawItems.length}</div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="glass border-border shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <Package className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Countable</div>
                                        <div className="text-2xl font-bold text-emerald-500">
                                            {rawItems.filter(i => i.type === 'COUNTABLE').length}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="glass border-border shadow-sm">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <Package className="w-5 h-5 text-foreground" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Volume</div>
                                        <div className="text-2xl font-bold text-foreground">
                                            {rawItems.filter(i => i.type === 'VOLUME').length}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table */}
                        {rawItemsLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                                <span className="text-muted-foreground">Loading raw items...</span>
                            </div>
                        ) : filteredRawItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                                <FlaskConical className="w-10 h-10 opacity-30" />
                                <p>{rawSearch ? 'No items match your search.' : 'No raw items yet.'}</p>
                                {!rawSearch && (
                                    <Button
                                        variant="outline"
                                        className="border-border hover:border-border"
                                        onClick={() => { setEditingItem(undefined); setShowAddModal(true); }}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Your First Raw Item
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Card className="glass border-border">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border hover:bg-transparent">
                                            <TableHead className="text-foreground font-bold">Name</TableHead>
                                            <TableHead className="text-foreground font-bold">Unit</TableHead>
                                            <TableHead className="text-foreground font-bold">Type</TableHead>
                                            <TableHead className="text-foreground font-bold">Batch Qty</TableHead>
                                            <TableHead className="text-foreground font-bold">Reorder Level</TableHead>
                                            <TableHead className="text-foreground font-bold">In Stock</TableHead>
                                            <TableHead className="text-foreground font-bold">Est. Units</TableHead>
                                            <TableHead className="text-right text-foreground font-bold">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRawItems.map((item) => (
                                            <TableRow
                                                key={item.id}
                                                className="border-border hover:bg-muted/50 transition-colors"
                                            >
                                                <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-border text-foreground text-xs">
                                                        {item.unit}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs border-border text-foreground"
                                                    >
                                                        {item.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {Number(item.unit_batch_quantity || 0).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{item.reorder_level ?? 0}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'font-semibold',
                                                            (item.quantity_in_stock ?? 0) <= (item.reorder_level ?? 0)
                                                                ? 'text-red-600'
                                                                : 'text-emerald-600'
                                                        )}
                                                    >
                                                        {item.quantity_in_stock ?? 0}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-foreground">
                                                    {item.unit_batch_quantity && item.unit_batch_quantity > 0
                                                        ? (Number(item.quantity_in_stock || 0) / Number(item.unit_batch_quantity)).toFixed(1)
                                                        : '0.0'
                                                    }
                                                </TableCell>

                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            onClick={() => navigate(`/inventory-ledger?item_id=${item.id}&item_type=MAIN_STORE_RAW`)}
                                                        >
                                                            <History className="w-4 h-4 mr-1" /> History
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            onClick={() => setAdjustingItem({ ...(item as any), itemType: 'mainstorerawitems' })}
                                                        >
                                                            <Package className="w-4 h-4 mr-1" /> Adjust
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                                                        >
                                                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        )}
                    </TabsContent>

                    {/* ── PURCHASES TAB ──────────────────────────────────────────────────── */}
                    <TabsContent value="purchases" className="animate-in fade-in-50">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="glass border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                                    <Truck className="h-4 w-4 text-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{suppliers.length}</div>
                                </CardContent>
                            </Card>
                            <Card className="glass border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">{totalPurchaseCount}</div>
                                </CardContent>
                            </Card>
                            <Card className="glass border-border shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                    <DollarSign className="h-4 w-4 text-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">₵{totalSpent.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Toolbar */}
                        <Card className="glass border-border">
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-foreground">Purchase History</CardTitle>
                                        <CardDescription>All stock replenishments</CardDescription>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Supplier filter */}
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

                                        {/* Item filter */}
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

                                        {/* Date range */}
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={cn('w-[220px] justify-start text-left font-normal', !dateRange && 'text-muted-foreground')}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {dateRange?.from ? (
                                                        dateRange.to
                                                            ? `${format(dateRange.from, 'LLL dd, y')} – ${format(dateRange.to, 'LLL dd, y')}`
                                                            : format(dateRange.from, 'LLL dd, y')
                                                    ) : 'Pick date range'}
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

                                        {(dateRange || selectedItemFilter !== 'all' || selectedSupplierFilter !== 'all') && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setDateRange(undefined); setSelectedItemFilter('all'); setSelectedSupplierFilter('all'); }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <Button
                                            onClick={() => setIsAddPurchaseOpen(true)}
                                            className="bg-foreground text-background hover:bg-foreground/90 border border-border"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Record Purchase
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Aggregate summary */}
                                <div className="flex items-center gap-6 mb-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                                    <div>
                                        <span className="text-sm text-muted-foreground block">Total Records</span>
                                        <span className="text-xl font-bold">{totalPurchaseCount}</span>
                                    </div>
                                    {selectedItemFilter !== 'all' && (
                                        <>
                                            <div>
                                                <span className="text-sm text-muted-foreground block">Total Units</span>
                                                <span className="text-xl font-bold text-foreground">
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
                                                    const est = (aggStats.total_quantity / item.unit_batch_quantity).toFixed(1);
                                                    return (
                                                        <div>
                                                            <span className="text-sm text-muted-foreground block">
                                                                Est. ({item.unit_batch_quantity} {item.unit}/unit)
                                                            </span>
                                                            <span className="text-xl font-bold text-foreground">{est} units</span>
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

                                {/* Purchase list */}
                                {purchasesLoading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                                    </div>
                                ) : purchases.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">No purchases found</div>
                                ) : (
                                    <div className="space-y-4">
                                        {purchases.map((purchase) => {
                                            const supplier = suppliers.find(s => s.id === purchase.supplier);
                                            const rawItem = rawItems.find(r => r.id === purchase.raw_item);
                                            return (
                                                <div
                                                    key={purchase.id}
                                                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                                >
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
                                                        <Badge variant="secondary" className="text-xs">
                                                            Completed
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Pagination */}
                                <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
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
                                        <div className="flex items-center px-4 bg-muted/50 rounded text-sm font-medium">
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

                    {/* ── DISBURSE TAB ──────────────────────────────────────────────── */}
                    <TabsContent value="disburse" className="animate-in fade-in-50">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                            {/* ── Disburse Form ── */}
                            <div className="col-span-1 lg:col-span-2">
                                <Card className="glass border-border sticky top-4">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-foreground">
                                            <SendHorizontal className="w-5 h-5" />
                                            Disburse Raw Item
                                        </CardTitle>
                                        <CardDescription>
                                            Send stock from Main Store to a branch location
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {/* Branch selector */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Target Branch</Label>
                                            <Select value={disburseBranch} onValueChange={setDisburseBranch}>
                                                <SelectTrigger className="border-border">
                                                    <SelectValue placeholder="Select a branch..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BRANCHES.map(b => (
                                                        <SelectItem key={b.host} value={b.host}>
                                                            {b.label}
                                                            <span className="ml-2 text-xs text-muted-foreground">{b.host}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Item selector */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Raw Item</Label>
                                            <Select value={disburseItemId} onValueChange={setDisburseItemId}>
                                                <SelectTrigger className="border-border">
                                                    <SelectValue placeholder="Select an item..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rawItems.map(item => (
                                                        <SelectItem key={item.id} value={item.id?.toString() || ''}>
                                                            {item.name}
                                                            <span className="ml-2 text-xs text-muted-foreground">
                                                                ({item.quantity_in_stock ?? 0} {item.unit} in stock)
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Stock preview */}
                                        {disburseItemId && (() => {
                                            const sel = rawItems.find(r => r.id?.toString() === disburseItemId);
                                            if (!sel) return null;
                                            const qtyNum = parseFloat(disburseQty || '0');
                                            const remaining = (sel.quantity_in_stock ?? 0) - qtyNum;
                                            return (
                                                <div className="p-3 rounded-lg bg-muted/30 border border-border text-sm space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Current Stock</span>
                                                        <span className="font-semibold">{sel.quantity_in_stock ?? 0} {sel.unit}</span>
                                                    </div>
                                                    {disburseQty && qtyNum > 0 && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">After Disburse</span>
                                                            <span className={cn('font-semibold', remaining < 0 ? 'text-red-400' : 'text-amber-400')}>
                                                                {remaining.toFixed(2)} {sel.unit}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Quantity */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Quantity to Disburse</Label>
                                            <Input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={disburseQty}
                                                onChange={e => setDisburseQty(e.target.value)}
                                                className="border-border"
                                            />
                                        </div>

                                        {/* Submit */}
                                        <Button
                                            className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg"
                                            disabled={!disburseBranch || !disburseItemId || !disburseQty || parseFloat(disburseQty) <= 0 || disburseLoading}
                                            onClick={handleDisburse}
                                        >
                                            {disburseLoading ? (
                                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Disbursing...</>
                                            ) : (
                                                <><SendHorizontal className="w-4 h-4 mr-2" /> Confirm Disburse</>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* ── Right: Item List + Session Log ── */}
                            <div className="col-span-1 lg:col-span-3 space-y-6">

                                {/* Quick-select item cards */}
                                <Card className="glass border-border">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Available Items</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                                            {rawItems.map(item => (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        'p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/40',
                                                        disburseItemId === item.id?.toString()
                                                            ? 'border-foreground bg-foreground/10'
                                                            : 'border-border'
                                                    )}
                                                    onClick={() => setDisburseItemId(item.id?.toString() || '')}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-sm">{item.name}</span>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                'text-xs',
                                                                (item.quantity_in_stock ?? 0) <= (item.reorder_level ?? 0)
                                                                    ? 'border-red-600 text-red-600'
                                                                    : 'border-emerald-600 text-emerald-600'
                                                            )}
                                                        >
                                                            {item.quantity_in_stock ?? 0} {item.unit}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">{item.type}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Session disbursement log */}
                                <Card className="glass border-border">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            Session Log
                                            {disburseLogs.length > 0 && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {disburseLogs.length}
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {disburseLogs.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground text-sm">
                                                <SendHorizontal className="w-8 h-8 opacity-20 mx-auto mb-2" />
                                                No disbursements this session
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                                {disburseLogs.map(log => (
                                                    <div
                                                        key={log.id}
                                                        className={cn(
                                                            'flex items-start gap-3 p-3 rounded-lg border text-sm',
                                                            log.status === 'ok'
                                                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                                                : 'border-red-500/30 bg-red-500/5'
                                                        )}
                                                    >
                                                        {log.status === 'ok'
                                                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                                            : <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                                        }
                                                        <div className="flex-1">
                                                            <div className="font-medium">
                                                                {log.qty} → <span className="text-foreground">{log.itemName}</span>
                                                                <span className="text-muted-foreground font-normal ml-1">to {log.branch}</span>
                                                            </div>
                                                            <div className={cn('text-xs mt-0.5', log.status === 'ok' ? 'text-emerald-400' : 'text-red-400')}>
                                                                {log.msg}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── SUPPLIERS TAB ──────────────────────────────────────────────── */}
                    <TabsContent value="suppliers" className="animate-in fade-in-50">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between mb-6 gap-4">
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search suppliers..."
                                    value={supplierSearch}
                                    onChange={(e) => setSupplierSearch(e.target.value)}
                                    className="pl-9 bg-muted/50 border-border"
                                />
                            </div>
                            <Button
                                onClick={() => setIsAddSupplierOpen(true)}
                                className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 border border-border font-semibold shadow-sm"
                            >
                                <Plus className="h-5 w-5" />
                                Add Supplier
                            </Button>
                        </div>

                        {suppliersLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                                <span className="text-muted-foreground">Loading suppliers...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Supplier list */}
                                <div className="col-span-1 flex flex-col gap-3">
                                    {filteredSuppliers.length === 0 ? (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <Truck className="w-10 h-10 opacity-30 mx-auto mb-3" />
                                            <p>{supplierSearch ? 'No suppliers match your search.' : 'No suppliers yet.'}</p>
                                        </div>
                                    ) : (
                                        filteredSuppliers.map((supplier) => (
                                            <Card
                                                key={supplier.id}
                                                className={cn(
                                                    'cursor-pointer transition-all hover:bg-muted/50 p-4',
                                                    selectedSupplier?.id === supplier.id
                                                        ? 'border-foreground ring-1 ring-foreground bg-muted/40'
                                                        : 'border-border'
                                                )}
                                                onClick={() => setSelectedSupplier(supplier)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                                                        {supplier.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-sm truncate">{supplier.name}</h4>
                                                        <p className="text-xs text-muted-foreground truncate">{supplier.address}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    )}
                                </div>

                                {/* Detail panel */}
                                {selectedSupplier && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="col-span-1 lg:col-span-2"
                                    >
                                        <Card className="glass border-border sticky top-4">
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center font-bold text-3xl text-foreground mb-4">
                                                        {selectedSupplier.name.charAt(0).toUpperCase()}
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

                                                <div className="pt-2">
                                                    <Button
                                                        className="w-full bg-foreground text-background hover:bg-foreground/90 shadow-md font-bold"
                                                        onClick={() => openPurchaseForSupplier(selectedSupplier.id)}
                                                    >
                                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                                        Record Purchase
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
                        )}
                    </TabsContent>

                </Tabs>

                {/* Add Supplier Dialog */}
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
                            <Button onClick={handleAddSupplier} className="bg-foreground text-background hover:bg-foreground/90 font-bold shadow-md">
                                Save Supplier
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>

            {/* Add / Edit Raw Item Modal */}
            <AddTransformableModal
                isOpen={showAddModal}
                onClose={() => { setShowAddModal(false); setEditingItem(undefined); }}
                suppliers={suppliers}
                onSubmit={handleModalSubmit}
                item={editingItem}
            />

            {/* Stock Adjustment Modal */}
            {adjustingItem && (
                <StockAdjustmentModal
                    isOpen={!!adjustingItem}
                    onClose={() => setAdjustingItem(null)}
                    item={adjustingItem}
                    onAdjustmentSuccess={(newStock) => {
                        // Update the stock value in the raw items list in-place
                        setRawItems(prev =>
                            prev.map(r => r.id === (adjustingItem as any).id
                                ? { ...r, quantity_in_stock: newStock }
                                : r
                            )
                        );
                        setAdjustingItem(null);
                    }}
                />
            )}

            {/* Record Purchase Dialog */}
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
                                        <SelectItem key={item.id} value={item.id?.toString() || ''}>
                                            {item.name} ({item.unit})
                                        </SelectItem>
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
                                {newPurchase.raw_item && newPurchase.quantity && (() => {
                                    const item = rawItems.find(r => r.id?.toString() === newPurchase.raw_item);
                                    const qty = parseFloat(newPurchase.quantity);
                                    if (item && item.unit_batch_quantity && !isNaN(qty)) {
                                        return (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Approx: {(qty / item.unit_batch_quantity).toFixed(1)} units (based on {item.unit_batch_quantity} {item.unit}/unit)
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="space-y-2">
                                <Label>Total Cost</Label>
                                <Input
                                    type="number"
                                    value={newPurchase.total_cost}
                                    onChange={(e) => setNewPurchase({ ...newPurchase, total_cost: e.target.value })}
                                    placeholder="Amount (₵)"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleAddPurchase}
                            className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto font-bold shadow-md border border-border"
                        >
                            Record Purchase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
