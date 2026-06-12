import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Package,
    Calendar,
    Loader2,
    CheckCircle2,
    Search,
    AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
    getBatchNames,
    cookBatch,
    undoBatchCooking,
    getBatchLogs,
    getAllRawItems,
} from "@/api/features";
import { BatchName, BatchProductionLog } from "@/api/models";

export default function ProductionPanel() {
    const { toast } = useToast();

    // ── State ──────────────────────────────────────────────────────────────────
    const [batches, setBatches] = useState<BatchName[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);
    const [batchLogs, setBatchLogs] = useState<BatchProductionLog[]>([]);
    const [multipliers, setMultipliers] = useState<{ [key: number]: string }>({});

    const [selectedBatchForRecipe, setSelectedBatchForRecipe] = useState<BatchName | null>(null);

    // Set default dates to today
    const [logSearch, setLogSearch] = useState("");
    const [logStartDate, setLogStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [logEndDate, setLogEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const [historyStartDate, setHistoryStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [historyEndDate, setHistoryEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [currentBatchLogs, setCurrentBatchLogs] = useState<BatchProductionLog[]>([]);
    const [currentLogsLoading, setCurrentLogsLoading] = useState(false);

    // Pagination states and total counts
    const [batchPage, setBatchPage] = useState(1);
    const [batchTotal, setBatchTotal] = useState(0);

    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);

    const [globalLogPage, setGlobalLogPage] = useState(1);
    const [globalLogTotal, setGlobalLogTotal] = useState(0);

    const ITEMS_PER_PAGE = 10;

    // ── Fetchers ─────────────────────────────────────────────────────────────────
    const fetchBatches = async () => {
        setBatchesLoading(true);
        try {
            const response = await getBatchNames(batchPage);
            setBatches(response?.results || []);
            setBatchTotal(response?.count || 0);
        } catch (e) {
            console.error("Failed to load batches", e);
        } finally {
            setBatchesLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await getBatchLogs(globalLogPage, {
                search: logSearch,
                start_date: logStartDate,
                end_date: logEndDate,
            });
            setBatchLogs(response?.results || []);
            setGlobalLogTotal(response?.count || 0);
        } catch (e) {
            console.error("Failed to load logs", e);
        }
    };

    const fetchCurrentBatchLogs = async () => {
        if (!selectedBatchForRecipe) return;
        setCurrentLogsLoading(true);
        try {
            const response = await getBatchLogs(historyPage, {
                batch_id: selectedBatchForRecipe.id,
                start_date: historyStartDate,
                end_date: historyEndDate,
            });
            setCurrentBatchLogs(response?.results || []);
            setHistoryTotal(response?.count || 0);
        } catch (e) {
            console.error("Failed to load current logs", e);
        } finally {
            setCurrentLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
        fetchLogs();
    }, [batchPage, globalLogPage, logStartDate, logEndDate]);

    // Debounced fetch for global logs
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => clearTimeout(timer);
    }, [logSearch, logStartDate, logEndDate]);

    // Fetch specific batch history on selection or date change
    useEffect(() => {
        fetchCurrentBatchLogs();
    }, [selectedBatchForRecipe?.id, historyStartDate, historyEndDate]);

    // ── Handlers ─────────────────────────────────────────────────────────────────
    const handleCookBatch = async (batchId: number) => {
        const multiplier = parseFloat(multipliers[batchId] || "1");
        if (isNaN(multiplier) || multiplier <= 0) {
            toast({
                title: "Invalid Input",
                description: "Multiplier must be greater than 0",
                variant: "destructive",
            });
            return;
        }
        try {
            await cookBatch(batchId, multiplier);
            await fetchBatches();
            await fetchLogs();
            await fetchCurrentBatchLogs();
            await getAllRawItems(); // Silent refresh of stock
            setMultipliers((prev) => ({ ...prev, [batchId]: "1" }));
            toast({ title: "Batch Cooked", description: `Successfully produced ${multiplier}x batch.` });
        } catch (e: any) {
            console.error("Failed to cook batch", e);
            toast({
                title: "Error",
                description: e.message || "Failed to cook batch",
                variant: "destructive",
            });
        }
    };

    const handleUndoCook = async (logId: number) => {
        try {
            await undoBatchCooking(logId);
            await fetchLogs();
            await fetchCurrentBatchLogs();
            await getAllRawItems(); // Silent refresh of stock
            toast({ title: "Undone", description: "Production reversed successfully" });
        } catch (e: any) {
            console.error("Failed to undo cooking", e);
            toast({
                title: "Error",
                description: e.message || "Failed to undo cooking",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-background/95">
            <div className="px-6 py-6 border-b border-foreground/5 sticky top-0 z-10 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Production Batch</h2>
                        <p className="text-sm text-muted-foreground font-medium text-purple-400">
                            Cook batches and manage production logs
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <Tabs defaultValue="manager" className="w-full">
                    <TabsList className="mb-6 bg-muted/50 p-1 w-full flex">
                        <TabsTrigger value="manager" className="flex-1 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                            Batch Operations
                        </TabsTrigger>
                        <TabsTrigger value="global-history" className="flex-1 data-[state=active]:bg-muted data-[state=active]:text-foreground">
                            Production Logs
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manager" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Batch List */}
                            <div className="col-span-1 flex flex-col gap-3">
                                {batchesLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                                    </div>
                                ) : batches.length === 0 ? (
                                    <Card className="glass p-8 text-center text-muted-foreground">
                                        <Package className="w-10 h-10 opacity-20 mx-auto mb-2" />
                                        <p>No production batches found.</p>
                                    </Card>
                                ) : (
                                    batches.map((batch) => (
                                        <Card
                                            key={batch.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:bg-muted/30 border-l-4 border-l-purple-500",
                                                selectedBatchForRecipe?.id === batch.id ? "ring-2 ring-purple-500 bg-muted/50" : ""
                                            )}
                                            onClick={() => setSelectedBatchForRecipe(batch)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg">{batch.name}</h3>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-4">
                                                    <Calendar className="w-3 h-3" />
                                                    {batch.date_created ? format(new Date(batch.date_created), "PPP") : "N/A"}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        type="number"
                                                        min="0.1"
                                                        step="any"
                                                        placeholder="Qty"
                                                        value={multipliers[batch.id] || ""}
                                                        onChange={(e) => setMultipliers((prev) => ({ ...prev, [batch.id]: e.target.value }))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-24 h-9 font-mono text-sm border-border"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white gap-2 font-semibold h-9"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCookBatch(batch.id);
                                                        }}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Cook
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}

                                {batchTotal > ITEMS_PER_PAGE && (
                                    <div className="flex items-center justify-between pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBatchPage(p => Math.max(1, p - 1))}
                                            disabled={batchPage === 1}
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-xs text-muted-foreground">Page {batchPage}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setBatchPage(p => p + 1)}
                                            disabled={batchPage * ITEMS_PER_PAGE >= batchTotal}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Batch History Viewer */}
                            <div className="col-span-1 border border-border rounded-xl bg-background overflow-hidden flex flex-col">
                                {selectedBatchForRecipe ? (
                                    <div className="flex-1 flex flex-col">
                                        <div className="p-4 border-b border-white/5 flex flex-col gap-2">
                                            <h3 className="font-bold text-foreground">History: {selectedBatchForRecipe.name}</h3>
                                            <div className="flex items-center gap-2 bg-muted/50 rounded-md border border-border px-3 py-1.5 w-max">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="date"
                                                    value={historyStartDate}
                                                    onChange={(e) => setHistoryStartDate(e.target.value)}
                                                    className="bg-transparent border-none text-xs focus:outline-none"
                                                />
                                                <span className="text-muted-foreground text-[10px]">to</span>
                                                <input
                                                    type="date"
                                                    value={historyEndDate}
                                                    onChange={(e) => setHistoryEndDate(e.target.value)}
                                                    className="bg-transparent border-none text-xs focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="p-0 overflow-y-auto flex-1">
                                            {currentLogsLoading ? (
                                                <div className="flex items-center justify-center p-8">
                                                    <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                                                </div>
                                            ) : (
                                                <>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="hover:bg-transparent">
                                                                <TableHead>Time</TableHead>
                                                                <TableHead>Qty</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead className="text-right">Action</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {currentBatchLogs.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                                                        No productions for this period.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                currentBatchLogs.map((log) => (
                                                                    <TableRow key={log.id}>
                                                                        <TableCell className="text-xs whitespace-nowrap">
                                                                            {format(new Date(log.produced_at), "MMM dd, h:mm a")}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Badge variant="outline" className="border-border text-foreground">
                                                                                x{log.multiplier}
                                                                            </Badge>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {log.is_reversed ? (
                                                                                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">Reversed</Badge>
                                                                            ) : (
                                                                                <Badge className="text-[10px] bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">Produced</Badge>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            {!log.is_reversed && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    className="text-muted-foreground hover:bg-muted hover:text-foreground gap-1 h-7 px-2 text-xs"
                                                                                    onClick={() => handleUndoCook(log.id)}
                                                                                >
                                                                                    <AlertCircle className="w-3 h-3" /> Undo
                                                                                </Button>
                                                                            )}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                    {currentBatchLogs.length > 0 && (
                                                        <div className="flex items-center justify-between p-4 border-t border-border">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                                                disabled={historyPage === 1}
                                                                className="h-7 text-xs"
                                                            >
                                                                Prev
                                                            </Button>
                                                            <span className="text-[10px] text-muted-foreground">Page {historyPage}</span>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setHistoryPage(p => p + 1)}
                                                                disabled={historyPage * ITEMS_PER_PAGE >= historyTotal}
                                                                className="h-7 text-xs"
                                                            >
                                                                Next
                                                            </Button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                        <Package className="w-12 h-12 mb-3 opacity-20" />
                                        <p className="text-sm">Select a batch from the left to view history.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="global-history" className="mt-0">
                        <Card className="glass border-border">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Package className="w-4 h-4 text-purple-500" />
                                    Global Production Logs
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-muted/30 border-y border-white/5">
                                    <div className="relative flex-1 w-full">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search batch..."
                                            value={logSearch}
                                            onChange={(e) => {
                                                setLogSearch(e.target.value);
                                                setGlobalLogPage(1);
                                            }}
                                            className="pl-9 h-9 text-sm bg-background border-border"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-background rounded-md border border-border px-3 py-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={logStartDate}
                                            onChange={(e) => setLogStartDate(e.target.value)}
                                            className="bg-transparent border-none text-xs focus:outline-none"
                                        />
                                        <span className="text-muted-foreground text-[10px]">to</span>
                                        <input
                                            type="date"
                                            value={logEndDate}
                                            onChange={(e) => setLogEndDate(e.target.value)}
                                            className="bg-transparent border-none text-xs focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent text-xs">
                                            <TableHead>Time</TableHead>
                                            <TableHead>Batch</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic text-sm">
                                                    No production history found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            batchLogs.map((log) => (
                                                <TableRow key={log.id} className="text-sm">
                                                    <TableCell className="whitespace-nowrap">
                                                        {format(new Date(log.produced_at), "MMM dd, h:mm a")}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-foreground">{log.batch_name_display}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="border-border text-foreground">
                                                            x{log.multiplier}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.is_reversed ? (
                                                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                                                                Reversed
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-[10px]">
                                                                Produced
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {!log.is_reversed && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-muted-foreground hover:bg-muted hover:text-foreground gap-1 h-8 px-2"
                                                                onClick={() => handleUndoCook(log.id)}
                                                            >
                                                                <AlertCircle className="w-3 h-3" /> Undo
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                                {batchLogs.length > 0 && (
                                    <div className="flex items-center justify-between p-4 border-t border-border">
                                        <div className="text-xs text-muted-foreground border-border">
                                            Logs: {batchLogs.length} / {globalLogTotal}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage((p) => Math.max(1, p - 1))} disabled={globalLogPage === 1} className="h-8">
                                                Prev
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage((p) => p + 1)} disabled={globalLogPage * ITEMS_PER_PAGE >= globalLogTotal} className="h-8">
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
