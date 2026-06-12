import { useState, useEffect } from 'react';
import { Sale, SaleItem } from '@/api/models';
import { getSales, getSaleItems } from '@/api/features';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    Search,
    ShoppingBag,
    X,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

export default function SalesPanel() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Filter states
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    const [startDate] = useState(getTodayDate());
    const [endDate] = useState(getTodayDate());
    const [searchTerm, setSearchTerm] = useState('');
    const [saleStatus] = useState<string>('all');

    // Sale Details Modal
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    // Fetch sales with filters
    const fetchSales = async () => {
        setLoading(true);
        try {
            const params: any = {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                search: searchTerm || undefined,
                sale_status: saleStatus === 'all' ? undefined : saleStatus
            };

            const response = await getSales(params);
            if (Array.isArray(response)) {
                setSales(response);
                setTotalCount(response.length);
            } else if (response && response.results) {
                setSales(response.results);
                setTotalCount(response.count);
            }
        } catch (err) {
            console.error('Failed to fetch sales:', err);
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchSales();
        }, 300); // Small debounce for search
        return () => clearTimeout(handler);
    }, [startDate, endDate, saleStatus, searchTerm]);

    const handleClearSearch = () => {
        setSearchTerm('');
    };

    const handleViewDetails = async (sale: Sale) => {
        setSelectedSale(sale);
        setLoadingDetails(true);
        try {
            const items = await getSaleItems(sale.id);
            setSaleItems(items || []);
        } catch (err) {
            console.error('Failed to fetch sale items:', err);
            setSaleItems([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'PROCESSING': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'INQUEUE': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'CANCELLED': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header */}
            <div className="shrink-0 border-b border-foreground/5 bg-card/50 backdrop-blur-sm">
                <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 
                                flex items-center justify-center shadow-lg shadow-yellow-500/20">
                                <ShoppingBag className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Sales History</h1>
                                <p className="text-sm text-muted-foreground">View customer transactions for today</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="px-3 py-1 bg-yellow-500/5 border-yellow-500/20 text-yellow-500 font-bold">
                                Transactions: {totalCount}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-right">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by Order #, Customer Name or Description..."
                            className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-foreground/10 
                                text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all
                                placeholder:text-muted-foreground shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-foreground/5 text-muted-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-6">
                        {loading ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                <p className="text-sm font-medium">Loading sales data...</p>
                            </div>
                        ) : sales.length > 0 ? (
                            <div className="rounded-xl border border-foreground/10 overflow-x-auto shadow-sm">
                                <table className="w-full border-collapse min-w-[800px]">
                                    <thead className="bg-foreground/5 border-b border-foreground/10">
                                        <tr>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Order #</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Customer</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Detail</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Payment</th>
                                            <th className="px-4 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                            <th className="px-4 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount</th>
                                            <th className="px-4 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-foreground/5">
                                        {sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-foreground/[0.02] transition-colors group">
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-black text-yellow-500 font-mono tabular-nums">
                                                        #{sale.daily_sequence_number?.toString().padStart(3, '0') || '---'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 font-bold text-foreground">
                                                    {sale.customer?.username || 'Walk-in'}
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px]">
                                                    <span className="text-sm text-foreground truncate font-medium">
                                                        {sale.specific_description || 'No description'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                                        {sale.payment_method}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {getStatusIcon(sale.sale_status)}
                                                        <span className="text-[11px] font-bold uppercase text-foreground/80">
                                                            {sale.sale_status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold text-yellow-500">
                                                    ₵{parseFloat(sale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleViewDetails(sale)}
                                                        className="h-8 w-8 p-0 hover:bg-yellow-500/10 hover:text-yellow-600"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4 
                                border-2 border-dashed border-foreground/10 rounded-2xl bg-foreground/[0.01]">
                                <Receipt className="w-16 h-16 text-muted-foreground/20" />
                                <div className="text-center">
                                    <p className="text-lg font-bold text-foreground/70">No sales found</p>
                                    <p className="text-sm opacity-70">Try searching for a different Order # or Customer Name.</p>
                                </div>
                                {searchTerm && (
                                    <Button onClick={handleClearSearch} variant="link" className="text-yellow-500">
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {selectedSale && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-background w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-foreground/10"
                        >
                            <div className="p-6 border-b border-foreground/5 flex items-center justify-between bg-card/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                        <Receipt className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold">Sale Details</h2>
                                        <p className="text-xs text-muted-foreground font-mono font-bold text-yellow-500">
                                            Order #{selectedSale.daily_sequence_number?.toString().padStart(3, '0')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedSale(null)}
                                    className="rounded-full hover:bg-foreground/10"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-6">
                                {loadingDetails ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                        <p className="text-sm font-medium animate-pulse">Fetching items...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-foreground/5 border border-foreground/10 text-sm">
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Customer</p>
                                                <p className="font-semibold">{selectedSale.customer?.username || 'Walk-in'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Payment</p>
                                                <p className="font-semibold">{selectedSale.payment_method}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Description</p>
                                                <p className="font-semibold">{selectedSale.specific_description || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(selectedSale.sale_status)}
                                                    <span className="font-bold uppercase text-foreground/80">{selectedSale.sale_status}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Time</p>
                                                <p className="font-semibold">
                                                    {new Date(selectedSale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Items Ordered</h3>
                                            <div className="rounded-xl border border-foreground/10 overflow-hidden bg-card/30">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-foreground/5 font-bold uppercase text-muted-foreground text-[10px]">
                                                        <tr>
                                                            <th className="px-4 py-3">Item</th>
                                                            <th className="px-4 py-3 text-center">Qty</th>
                                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-foreground/5">
                                                        {saleItems.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="px-4 py-3">
                                                                    <div className="font-semibold">{item.item_name}</div>
                                                                    <div className="text-[9px] text-muted-foreground uppercase">{item.item_type}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                                                <td className="px-4 py-3 text-right font-bold">
                                                                    ₵{(parseFloat(item.price_sold) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Amount</span>
                                            <span className="text-3xl font-black text-yellow-500">
                                                ₵{parseFloat(selectedSale.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
