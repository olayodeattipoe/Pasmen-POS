import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Search,
    Filter,
    FileText,
    ArrowUpRight,
    ArrowDownRight,
    History,
    Info,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Package,
    AlertTriangle,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getInventoryLedger, getAllRawItems, getAllProducts, getAllCustomizables, getAllMainStoreRawItems } from '@/api/features';
import { InventoryLedger as LedgerType, LedgerMovement } from '@/api/models';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";

// Extended Ledger Type for new fields
interface ExtendedLedgerType {
    item_name: string;
    movements: LedgerMovement[];
    // Period Stats
    period_opening_stock: number;
    period_closing_stock: number;
    // Current Heath Check
    current_theoretical_stock: number;
    current_actual_stock: number;
    discrepancy: number;
}

const InventoryLedger = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const itemId = searchParams.get('item_id');
    const itemType = searchParams.get('item_type') as 'PRODUCT' | 'CUSTOM' | 'RAW' | 'MAIN_STORE_RAW';

    const [loading, setLoading] = useState(true);
    const [ledgerData, setLedgerData] = useState<ExtendedLedgerType | null>(null);
    const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [allItems, setAllItems] = useState<{ id: number, name: string, type: string }[]>([]);
    const [selectedItem, setSelectedItem] = useState<{ id: number, type: string } | null>(
        itemId ? { id: parseInt(itemId), type: itemType } : null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [movementTypeFilter, setMovementTypeFilter] = useState('all');
    const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | 'RAW' | 'MAIN_STORE_RAW' | 'PRODUCT' | 'CUSTOM'>('ALL');

    useEffect(() => {
        fetchAllItems();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            fetchLedger();
        } else {
            setLoading(false);
        }
    }, [selectedItem, startDate, endDate]);

    const fetchAllItems = async () => {
        try {
            const [raws, mainStoreRaws, products, customs] = await Promise.all([
                getAllRawItems(),
                getAllMainStoreRawItems(),
                getAllProducts(),
                getAllCustomizables()
            ]);

            const formatted = [
                ...(raws || []).map((r: any) => ({ id: r.id, name: r.name, type: 'RAW' })),
                ...(mainStoreRaws || []).map((r: any) => ({ id: r.id, name: r.name, type: 'MAIN_STORE_RAW' })),
                ...(products || []).map((p: any) => ({ id: p.id, name: p.name, type: 'PRODUCT' })),
                ...(customs || []).map((c: any) => ({ id: c.id, name: c.name, type: 'CUSTOM' }))
            ];
            setAllItems(formatted);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    };

    const fetchLedger = async () => {
        if (!selectedItem) return;
        setLoading(true);
        try {
            const data = await getInventoryLedger({
                item_id: selectedItem.id,
                item_type: selectedItem.type as any,
                startDate,
                endDate
            });
            setLedgerData(data as any);
        } catch (error) {
            console.error('Failed to fetch ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMovementColor = (change: number) => {
        if (change > 0) return "text-emerald-500";
        if (change < 0) return "text-red-500";
        return "text-muted-foreground";
    };

    return (
        <div className="p-8 min-h-screen bg-background space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/inventory')}
                            className="hover:bg-muted hover:text-foreground"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-4xl font-vicewave text-foreground tracking-tight">Main Store Stock Ledger</h1>
                    </div>
                    <p className="text-muted-foreground font-futuristic text-lg">Detailed transaction history & reconciliation for raw stock</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9 glass border-border focus:border-border w-[160px] text-xs"
                        />
                    </div>
                    <span className="text-muted-foreground text-xs font-futuristic uppercase">to</span>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground pointer-events-none" />
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-9 glass border-border focus:border-border w-[160px] text-xs"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar: Item Selection */}
                <Card className="glass border-border lg:col-span-1 h-fit sticky top-8">
                    <CardHeader>
                        <CardTitle className="text-lg font-vicewave text-foreground">Select Main Item</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/20 border-border focus:border-border"
                            />
                        </div>
                        <div className="max-h-[600px] overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-muted">
                            {allItems
                                .filter(item => {
                                    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
                                    // Strictly only MAIN_STORE_RAW for this specialized ledger
                                    return matchesSearch && item.type === 'MAIN_STORE_RAW';
                                })
                                .map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => setSelectedItem({ id: item.id, type: item.type })}
                                        className={cn(
                                            "w-full text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group",
                                            selectedItem?.id === item.id && selectedItem?.type === item.type
                                                ? "bg-muted text-black font-bold shadow-lg ring-1 ring-border"
                                                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <span className="truncate pr-2 font-semibold text-base">{item.name}</span>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] uppercase opacity-70",
                                            selectedItem?.id === item.id && selectedItem?.type === item.type
                                                ? "border-black/50 text-black"
                                                : "border-border text-muted-foreground group-hover:text-foreground group-hover:border-border"
                                        )}>
                                            MAIN
                                        </Badge>
                                    </button>
                                ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Main Content: Ledger Table */}
                <div className="lg:col-span-3 space-y-6">
                    {!selectedItem ? (
                        <div className="h-[500px] flex flex-col items-center justify-center glass rounded-2xl border-dashed border-2 border-border">
                            <div className="p-6 rounded-full bg-muted border border-border mb-4">
                                <History className="w-12 h-12 text-foreground/50" />
                            </div>
                            <h3 className="text-xl font-vicewave text-muted-foreground">No Item Selected</h3>
                            <p className="text-muted-foreground font-futuristic">Choose an item from the sidebar to view its stock ledger</p>
                        </div>
                    ) : loading ? (
                        <div className="h-[500px] flex items-center justify-center">
                            <Loader2 className="w-10 h-10 animate-spin text-foreground" />
                        </div>
                    ) : (
                        <>
                            {/* Current Health Check Banner */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between shadow-lg",
                                    (ledgerData?.discrepancy || 0) !== 0
                                        ? "bg-red-500/10 border-red-500/30"
                                        : "bg-emerald-500/10 border-emerald-500/30"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-3 md:mb-0">
                                    {(ledgerData?.discrepancy || 0) === 0 ? (
                                        <div className="p-2 bg-emerald-500/20 rounded-full">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-red-500/20 rounded-full">
                                            <AlertTriangle className="w-6 h-6 text-red-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-bold text-lg">Current Status Reconciliation</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Comparing LIVE system stock vs. All-time calculated history.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">System Says</p>
                                        <p className="font-bold text-lg">{ledgerData?.current_actual_stock.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">History Says</p>
                                        <p className="font-bold text-lg">{ledgerData?.current_theoretical_stock.toFixed(2)}</p>
                                    </div>
                                    <div className="text-center px-4 py-1 rounded bg-black/20">
                                        <p className="text-muted-foreground text-[10px] uppercase font-bold">Discrepancy</p>
                                        <p className={cn("font-bold text-xl", (ledgerData?.discrepancy || 0) !== 0 ? "text-red-500" : "text-emerald-500")}>
                                            {(ledgerData?.discrepancy || 0) > 0 ? '+' : ''}{(ledgerData?.discrepancy || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                            {/* Current Health Check Banner */}


                            {/* Period Stats Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="glass border-border bg-blue-500/5">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm font-futuristic text-blue-400 uppercase tracking-widest">Opening Stock</p>
                                                <p className="text-xs text-muted-foreground">At start of period</p>
                                            </div>
                                            <History className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <p className="text-3xl font-bold mt-3 text-foreground">{ledgerData?.period_opening_stock.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass border-border bg-purple-500/5 flex items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <p className="text-xs font-futuristic text-purple-400 uppercase tracking-widest mb-1">Period Change</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-bold text-muted-foreground">{ledgerData?.period_opening_stock.toFixed(2)}</span>
                                            <ArrowRight className="w-6 h-6 text-foreground" />
                                            <span className="text-2xl font-bold text-foreground">{ledgerData?.period_closing_stock.toFixed(2)}</span>
                                        </div>
                                        <p className={cn("text-sm font-bold mt-1", getMovementColor(((ledgerData?.period_closing_stock || 0) - (ledgerData?.period_opening_stock || 0))))}>
                                            {((ledgerData?.period_closing_stock || 0) - (ledgerData?.period_opening_stock || 0)) > 0 ? '+' : ''}
                                            {((ledgerData?.period_closing_stock || 0) - (ledgerData?.period_opening_stock || 0)).toFixed(2)} Net Change
                                        </p>
                                    </div>
                                </Card>
                                <Card className="glass border-border bg-emerald-500/5">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-sm font-futuristic text-emerald-400 uppercase tracking-widest">Closing Stock</p>
                                                <p className="text-xs text-muted-foreground">At end of period</p>
                                            </div>
                                            <Package className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <p className="text-3xl font-bold mt-3 text-foreground">{ledgerData?.period_closing_stock.toFixed(2)}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Transactions Table */}
                            <Card className="glass border-border overflow-hidden">
                                <CardHeader className="bg-muted border-b border-border">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg font-vicewave text-foreground flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-foreground" />
                                            Period Transactions
                                        </CardTitle>
                                        <div className="flex items-center gap-4">
                                            <select
                                                value={movementTypeFilter}
                                                onChange={(e) => setMovementTypeFilter(e.target.value)}
                                                className="bg-background border border-border text-foreground text-xs rounded-md px-2 py-1 focus:outline-none"
                                            >
                                                <option value="all">All Movements</option>
                                                <option value="Sale">🔴 Sales</option>
                                                <option value="Purchase">🟢 Purchases</option>
                                                <option value="Disbursement">🚛 Disbursements</option>
                                                <option value="Spoilage">🚮 Spoilage / Wastage</option>
                                                <option value="Adjustment">🔵 Manual Adjustments</option>
                                                <option value="Correction">⚙️ System Corrections</option>
                                            </select>
                                            <Badge variant="outline" className="border-border text-foreground">
                                                {(() => {
                                                    const filtered = ledgerData?.movements?.filter((m: any) => {
                                                        if (movementTypeFilter === 'all') return true;
                                                        if (movementTypeFilter === 'Disbursement') return m.type.startsWith('Disbursement');
                                                        if (movementTypeFilter === 'Spoilage') return ['Spoilage', 'Wastage', 'Leftover'].includes(m.type);
                                                        if (movementTypeFilter === 'Adjustment') return ['Stock Addition', 'Stock Deduction', 'Production Deduction', 'Production Reversal (Undo)'].includes(m.type);
                                                        if (movementTypeFilter === 'Correction') return m.type.startsWith('System Correction');
                                                        return m.type === movementTypeFilter;
                                                    });
                                                    return filtered?.length || 0;
                                                })()} Records
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow className="border-border">
                                                <TableHead className="w-[180px] font-futuristic text-xs uppercase tracking-wider">Date & Time</TableHead>
                                                <TableHead className="font-futuristic text-xs uppercase tracking-wider">Type</TableHead>
                                                <TableHead className="font-futuristic text-xs uppercase tracking-wider">Reference</TableHead>
                                                <TableHead className="text-right font-futuristic text-xs uppercase tracking-wider">Change</TableHead>
                                                <TableHead className="text-right font-futuristic text-xs uppercase tracking-wider">Running Bal</TableHead>
                                                <TableHead className="font-futuristic text-xs uppercase tracking-wider">Reason/Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ledgerData?.movements
                                                .filter(m => {
                                                    if (movementTypeFilter === 'all') return true;
                                                    if (movementTypeFilter === 'Disbursement') return m.type.startsWith('Disbursement');
                                                    if (movementTypeFilter === 'Spoilage') return ['Spoilage', 'Wastage', 'Leftover'].includes(m.type);
                                                    if (movementTypeFilter === 'Adjustment') return ['Stock Addition', 'Stock Deduction', 'Production Deduction', 'Production Reversal (Undo)'].includes(m.type);
                                                    if (movementTypeFilter === 'Correction') return m.type.startsWith('System Correction');
                                                    return m.type === movementTypeFilter;
                                                })
                                                .map((m, i) => (
                                                    <TableRow key={i} className="border-border hover:bg-muted transition-colors">
                                                        <TableCell className="text-xs">
                                                            {m.date}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "text-[10px] uppercase font-bold px-2 py-0.5 min-w-[100px] justify-center",
                                                                    m.type === 'Sale' ? "border-red-500/50 text-red-500 bg-red-500/5" :
                                                                        m.type === 'Purchase' ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" :
                                                                            m.type.startsWith('Disbursement') ? "border-amber-500/50 text-amber-500 bg-amber-500/5" :
                                                                                ['Spoilage', 'Wastage'].includes(m.type) ? "border-orange-500/50 text-orange-500 bg-orange-500/5" :
                                                                                    m.type.startsWith('System Correction') ? "border-purple-500/50 text-purple-500 bg-purple-500/5" :
                                                                                        "border-border text-foreground bg-muted"
                                                                )}
                                                            >
                                                                {m.type === 'Sale' ? '🔴 Sale' :
                                                                    m.type === 'Purchase' ? '🟢 Purchase' :
                                                                        m.type.startsWith('Disbursement') ? '🚛 Transfer' :
                                                                            ['Spoilage', 'Wastage'].includes(m.type) ? '🚮 Spoilage' :
                                                                                m.type.startsWith('System Correction') ? '⚙️ System' :
                                                                                    m.type}
                                                                <span className="ml-1 opacity-60 font-normal">
                                                                    {m.type === 'Disbursement-In' ? '(In)' : m.type === 'Disbursement-Out' ? '(Out)' : ''}
                                                                </span>
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{m.reference}</TableCell>
                                                        <TableCell className={cn("text-right font-bold", getMovementColor(m.change))}>
                                                            {m.change > 0 ? `+${m.change.toFixed(2)}` : m.change.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold text-muted-foreground">{m.balance.toFixed(2)}</TableCell>
                                                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]" title={m.reason}>
                                                            {m.reason}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            {ledgerData?.movements.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-futuristic">
                                                        No movements found for the selected period
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryLedger;
