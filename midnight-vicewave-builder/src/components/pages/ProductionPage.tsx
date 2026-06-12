import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus,
    Search,
    Package,
    Calendar,
    Loader2,
    Trash2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
    getAllRawItems,
    getBatchNames,
    addBatchName,
    deleteBatchName,
    getBatchProductionRecipes,
    addBatchProductionRecipe,
    deleteBatchProductionRecipe,
    cookBatch,
    undoBatchCooking,
    getBatchLogs
} from '@/api/features';
import { RawItem, BatchName, BatchProductionRecipe, BatchProductionLog } from '@/api/models';

export default function ProductionPage() {
    const { toast } = useToast();
    // ── State ──────────────────────────────────────────────────────────────────
    const [rawItems, setRawItems] = useState<RawItem[]>([]);
    const [batches, setBatches] = useState<BatchName[]>([]);
    const [batchesLoading, setBatchesLoading] = useState(true);
    const [allRecipes, setAllRecipes] = useState<BatchProductionRecipe[]>([]);
    const [recipesLoading, setRecipesLoading] = useState(true);
    const [batchLogs, setBatchLogs] = useState<BatchProductionLog[]>([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [multipliers, setMultipliers] = useState<{ [key: number]: string }>({});

    const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
    const [newBatchName, setNewBatchName] = useState('');
    const [selectedBatchForRecipe, setSelectedBatchForRecipe] = useState<BatchName | null>(null);
    const [isAddingRecipeItem, setIsAddingRecipeItem] = useState(false);
    const [newRecipeItem, setNewRecipeItem] = useState({ raw_item: '', quantity_required: '' });

    // Set default dates to today
    const [logSearch, setLogSearch] = useState('');
    const [logStartDate, setLogStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [logEndDate, setLogEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [historyStartDate, setHistoryStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [historyEndDate, setHistoryEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
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
    const fetchRawItems = async () => {
        try {
            const data = await getAllRawItems();
            setRawItems(data || []);
        } catch (e) {
            console.error('Failed to load raw items', e);
        }
    };

    const fetchBatches = async () => {
        setBatchesLoading(true);
        try {
            const response = await getBatchNames(batchPage);
            setBatches(response?.results || []);
            setBatchTotal(response?.count || 0);
        } catch (e) {
            console.error('Failed to load batches', e);
        } finally {
            setBatchesLoading(false);
        }
    };

    const fetchRecipes = async () => {
        setRecipesLoading(true);
        try {
            const data = await getBatchProductionRecipes();
            setAllRecipes(data || []);
        } catch (e) {
            console.error('Failed to load recipes', e);
        } finally {
            setRecipesLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const response = await getBatchLogs(globalLogPage, {
                search: logSearch,
                start_date: logStartDate,
                end_date: logEndDate
            });
            setBatchLogs(response?.results || []);
            setGlobalLogTotal(response?.count || 0);
        } catch (e) {
            console.error('Failed to load logs', e);
        } finally {
            setLogsLoading(false);
        }
    };

    const fetchCurrentBatchLogs = async () => {
        if (!selectedBatchForRecipe) return;
        setCurrentLogsLoading(true);
        try {
            const response = await getBatchLogs(historyPage, {
                batch_id: selectedBatchForRecipe.id,
                start_date: historyStartDate,
                end_date: historyEndDate
            });
            setCurrentBatchLogs(response?.results || []);
            setHistoryTotal(response?.count || 0);
        } catch (e) {
            console.error('Failed to load current logs', e);
        } finally {
            setCurrentLogsLoading(false);
        }
    };

    useEffect(() => {
        fetchRawItems();
        fetchBatches();
        fetchRecipes();
        fetchLogs();
    }, [batchPage, globalLogPage, logStartDate, logEndDate]);

    // Fetch batches on search change (client side search still useful for small lists)
    // but backend fetch only on mount or after actions.

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
    const handleAddBatchSubmit = async () => {
        if (!newBatchName.trim()) return;
        try {
            await addBatchName(newBatchName);
            setNewBatchName('');
            setIsAddBatchOpen(false);
            await fetchBatches();
            toast({ title: "Success", description: "Batch created successfully" });
        } catch (e) {
            console.error('Failed to add batch', e);
            toast({ title: "Error", description: "Failed to create batch", variant: "destructive" });
        }
    };

    const handleDeleteBatchSubmit = async (batchId: number) => {
        if (!window.confirm('Are you sure you want to delete this batch? All recipes for this batch will also be removed.')) return;
        try {
            await deleteBatchName(batchId);
            if (selectedBatchForRecipe?.id === batchId) setSelectedBatchForRecipe(null);
            await fetchBatches();
            await fetchRecipes();
            toast({ title: "Deleted", description: "Batch deleted successfully" });
        } catch (e) {
            console.error('Failed to delete batch', e);
            toast({ title: "Error", description: "Failed to delete batch", variant: "destructive" });
        }
    };

    const handleCookBatch = async (batchId: number) => {
        const multiplier = parseFloat(multipliers[batchId] || '1');
        if (isNaN(multiplier) || multiplier <= 0) {
            toast({ title: "Invalid Input", description: "Multiplier must be greater than 0", variant: "destructive" });
            return;
        }
        try {
            await cookBatch(batchId, multiplier);
            await fetchBatches();
            await fetchLogs();
            await fetchCurrentBatchLogs();
            await fetchRawItems(); // Refresh stock
            setMultipliers(prev => ({ ...prev, [batchId]: '1' }));
            toast({ title: "Batch Cooked", description: `Successfully produced ${multiplier}x batch.` });
        } catch (e: any) {
            console.error('Failed to cook batch', e);
            toast({ title: "Error", description: e.message || 'Failed to cook batch', variant: "destructive" });
        }
    };

    const handleUndoCook = async (logId: number) => {
        try {
            await undoBatchCooking(logId);
            await fetchLogs();
            await fetchCurrentBatchLogs();
            await fetchRawItems(); // Refresh stock
            toast({ title: "Undone", description: "Production reversed successfully" });
        } catch (e: any) {
            console.error('Failed to undo cooking', e);
            toast({ title: "Error", description: e.message || 'Failed to undo cooking', variant: "destructive" });
        }
    };

    const handleAddRecipeItemSubmit = async () => {
        if (!selectedBatchForRecipe || !newRecipeItem.raw_item || !newRecipeItem.quantity_required) return;
        try {
            await addBatchProductionRecipe({
                batch_name: selectedBatchForRecipe.id,
                raw_item: parseInt(newRecipeItem.raw_item),
                quantity_required: parseFloat(newRecipeItem.quantity_required)
            });
            setNewRecipeItem({ raw_item: '', quantity_required: '' });
            await fetchRecipes();
            toast({ title: "Added", description: "Ingredient added to recipe" });
        } catch (e) {
            console.error('Failed to add recipe item', e);
            toast({ title: "Error", description: "Failed to add ingredient", variant: "destructive" });
        }
    };

    const handleDeleteRecipeItemSubmit = async (recipeId: number) => {
        try {
            await deleteBatchProductionRecipe(recipeId);
            await fetchRecipes();
            toast({ title: "Deleted", description: "Ingredient removed from recipe" });
        } catch (e) {
            console.error('Failed to delete recipe item', e);
            toast({ title: "Error", description: "Failed to remove ingredient", variant: "destructive" });
        }
    };

    // ── Filtering ──────────────────────────────────────────────────────────────
    const filteredBatches = batches;

    return (
        <div className="min-h-full w-full">
            {/* Page Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass border-b shadow-sm mb-6"
            >
                <div className="px-8 py-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foreground tracking-tight flex items-center gap-3">
                            <Package className="w-10 h-10 text-foreground" />
                            Batch Production
                        </h1>
                        <p className="text-muted-foreground font-futuristic text-lg">
                            Manage production batches and automate inventory consumption
                        </p>
                    </div>
                </div>
            </motion.header>

            <div className="px-8 pb-8">
                <div className="flex items-center justify-end mb-6">
                    <Button
                        onClick={() => setIsAddBatchOpen(true)}
                        className="flex items-center gap-2 bg-muted text-foreground border border-border hover:bg-muted font-semibold"
                    >
                        <Plus className="h-5 w-5" />
                        New Production Batch
                    </Button>
                </div>

                <Tabs defaultValue="manager" className="w-full">
                    <TabsList className="mb-6 bg-muted/50 p-1">
                        <TabsTrigger value="manager" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Batch Manager</TabsTrigger>
                        <TabsTrigger value="global-history" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Global Production Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manager" className="mt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Batch List */}
                            <div className="col-span-1 flex flex-col gap-3">
                                {batchesLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                                    </div>
                                ) : filteredBatches.length === 0 ? (
                                    <Card className="glass p-8 text-center text-muted-foreground">
                                        <Package className="w-10 h-10 opacity-20 mx-auto mb-2" />
                                        <p>No production batches yet.</p>
                                    </Card>
                                ) : (
                                    batches.map(batch => (
                                        <Card
                                            key={batch.id}
                                            className={cn(
                                                "cursor-pointer transition-all hover:bg-muted/30 border-l-4 border-l-foreground",
                                                selectedBatchForRecipe?.id === batch.id ? "ring-2 ring-foreground bg-muted/50" : ""
                                            )}
                                            onClick={() => setSelectedBatchForRecipe(batch)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-lg">{batch.name}</h3>
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mb-4">
                                                    <Calendar className="w-3 h-3" />
                                                    {batch.date_created ? format(new Date(batch.date_created), 'PPP') : 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Input
                                                        type="number"
                                                        min="0.1"
                                                        step="any"
                                                        placeholder="Qty"
                                                        value={multipliers[batch.id] || ''}
                                                        onChange={(e) => setMultipliers(prev => ({ ...prev, [batch.id]: e.target.value }))}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-20 h-8 font-mono text-xs border-border"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 text-white gap-1"
                                                        onClick={(e) => { e.stopPropagation(); handleCookBatch(batch.id); }}
                                                    >
                                                        <CheckCircle2 className="w-3 h-3" /> Cook
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteBatchSubmit(batch.id); }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Recipe Editor */}
                            <div className="col-span-2">
                                {selectedBatchForRecipe ? (
                                    <Tabs defaultValue="recipe" className="w-full">
                                        <TabsList className="mb-4 bg-muted/50 p-1">
                                            <TabsTrigger value="recipe" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Recipe Ingredients</TabsTrigger>
                                            <TabsTrigger value="history" className="data-[state=active]:bg-muted data-[state=active]:text-foreground">Production History</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="recipe" className="mt-0">
                                            <Card className="glass border-border">
                                                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-foreground">Recipe: {selectedBatchForRecipe.name}</CardTitle>
                                                        <CardDescription>Define the quantities of raw items needed for this batch</CardDescription>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setIsAddingRecipeItem(!isAddingRecipeItem)}
                                                        className="border-border text-foreground hover:bg-muted/50"
                                                    >
                                                        {isAddingRecipeItem ? "Cancel" : "Add Ingredient"}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="pt-6">
                                                    {isAddingRecipeItem && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            className="bg-muted/30 p-4 rounded-lg mb-6 border border-border"
                                                        >
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                <div className="col-span-1">
                                                                    <Label className="text-xs uppercase">Raw Item</Label>
                                                                    <Select
                                                                        value={newRecipeItem.raw_item}
                                                                        onValueChange={(val) => setNewRecipeItem({ ...newRecipeItem, raw_item: val })}
                                                                    >
                                                                        <SelectTrigger className="mt-1">
                                                                            <SelectValue placeholder="Select Item" />
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
                                                                <div className="col-span-1">
                                                                    <Label className="text-xs uppercase">Quantity Required</Label>
                                                                    <Input
                                                                        type="number"
                                                                        className="mt-1"
                                                                        placeholder="Amount"
                                                                        value={newRecipeItem.quantity_required}
                                                                        onChange={(e) => setNewRecipeItem({ ...newRecipeItem, quantity_required: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 md:col-span-1 flex items-end">
                                                                    <Button
                                                                        className="w-full bg-foreground text-background hover:bg-foreground/90 text-white"
                                                                        onClick={handleAddRecipeItemSubmit}
                                                                    >
                                                                        Add to Recipe
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="hover:bg-transparent">
                                                                <TableHead>Ingredient</TableHead>
                                                                <TableHead>Quantity Required</TableHead>
                                                                <TableHead>Current Local Stock</TableHead>
                                                                <TableHead className="text-right">Actions</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {allRecipes.filter(r => r.batch_name === selectedBatchForRecipe.id).length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">
                                                                        No ingredients added to this recipe yet.
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                                allRecipes
                                                                    .filter(r => r.batch_name === selectedBatchForRecipe.id)
                                                                    .map(recipe => {
                                                                        const stockItem = rawItems.find(item => item.id === recipe.raw_item);
                                                                        const stockQty = stockItem?.quantity_in_stock || 0;
                                                                        const isShort = stockQty < recipe.quantity_required;

                                                                        return (
                                                                            <TableRow key={recipe.id}>
                                                                                <TableCell className="font-medium">{recipe.raw_item_name_display}</TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant="outline" className="text-foreground border-border">
                                                                                        {recipe.quantity_required} {recipe.unit_display}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <span className={cn("font-bold", isShort ? "text-destructive" : "text-foreground")}>
                                                                                        {stockQty} {recipe.unit_display}
                                                                                    </span>
                                                                                    {isShort && (
                                                                                        <span className="text-[10px] block text-destructive leading-tight">Shortage: {recipe.quantity_required - stockQty}</span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="text-destructive hover:bg-destructive/10"
                                                                                        onClick={() => handleDeleteRecipeItemSubmit(recipe.id)}
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="history" className="mt-0">
                                            <Card className="glass border-border">
                                                <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-foreground">Production History: {selectedBatchForRecipe.name}</CardTitle>
                                                        <CardDescription>View past productions and undo if necessary</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-muted/50 rounded-md border border-border px-3 py-1">
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
                                                </CardHeader>
                                                <CardContent className="pt-6">
                                                    {currentLogsLoading ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <Loader2 className="w-6 h-6 animate-spin text-foreground" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="hover:bg-transparent">
                                                                        <TableHead>Date / Time</TableHead>
                                                                        <TableHead>Qty Prod.</TableHead>
                                                                        <TableHead>Produced By</TableHead>
                                                                        <TableHead>Status</TableHead>
                                                                        <TableHead className="text-right">Actions</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {currentBatchLogs.length === 0 ? (
                                                                        <TableRow>
                                                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                                                                                No production history found for this period.
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ) : (
                                                                        currentBatchLogs.map(log => (
                                                                            <TableRow key={log.id}>
                                                                                <TableCell>
                                                                                    {format(new Date(log.produced_at), 'MMM dd, h:mm a')}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <Badge variant="outline" className="border-border text-foreground">
                                                                                        x{log.multiplier}
                                                                                    </Badge>
                                                                                </TableCell>
                                                                                <TableCell>{log.produced_by_name || 'System'}</TableCell>
                                                                                <TableCell>
                                                                                    {log.is_reversed ? (
                                                                                        <Badge variant="outline" className="border-border text-muted-foreground">
                                                                                            Reversed
                                                                                        </Badge>
                                                                                    ) : (
                                                                                        <Badge className="bg-muted text-foreground">
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
                                                            {currentBatchLogs.length > 0 && (
                                                                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                                                    <div className="text-sm text-muted-foreground border-border">
                                                                        Showing {currentBatchLogs.length} of {historyTotal} entries
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="border-border">Previous</Button>
                                                                        <div className="flex items-center px-4 bg-muted rounded text-sm font-medium border-border">
                                                                            Page {historyPage} of {Math.ceil(historyTotal / ITEMS_PER_PAGE) || 1}
                                                                        </div>
                                                                        <Button variant="outline" size="sm" onClick={() => setHistoryPage(p => p + 1)} disabled={historyPage * ITEMS_PER_PAGE >= historyTotal} className="border-border">Next</Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/5 rounded-xl text-muted-foreground opacity-50">
                                        <Package className="w-16 h-16 mb-4" />
                                        <h2 className="text-xl font-bold">Select a Batch</h2>
                                        <p>Select a production batch from the left to view and manage its recipe.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="global-history" className="mt-0">
                        <Card className="glass border-border">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Global Production History
                                </CardTitle>
                                <CardDescription>View all batch production logs and undo specific actions</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="p-4 flex flex-wrap items-center gap-4 bg-muted/30 border-b border-white/5 mb-4 rounded-t-lg">
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search logs by batch name..."
                                            value={logSearch}
                                            onChange={(e) => {
                                                setLogSearch(e.target.value);
                                                setGlobalLogPage(1);
                                            }}
                                            className="pl-9 bg-background/50 border-border focus:border-border"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 bg-background/50 rounded-md border border-border px-3 py-1">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="date"
                                            value={logStartDate}
                                            onChange={(e) => setLogStartDate(e.target.value)}
                                            className="bg-transparent border-none text-sm focus:outline-none"
                                        />
                                        <span className="text-muted-foreground text-xs">to</span>
                                        <input
                                            type="date"
                                            value={logEndDate}
                                            onChange={(e) => setLogEndDate(e.target.value)}
                                            className="bg-transparent border-none text-sm focus:outline-none"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setLogSearch('');
                                            setLogStartDate('');
                                            setLogEndDate('');
                                            setGlobalLogPage(1);
                                        }}
                                        className="text-xs text-muted-foreground hover:text-foreground"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead>Date / Time</TableHead>
                                            <TableHead>Batch Name</TableHead>
                                            <TableHead>Qty Prod.</TableHead>
                                            <TableHead>Produced By</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batchLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                                                    No production history.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            batchLogs.map(log => (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        {format(new Date(log.produced_at), 'MMM dd, h:mm a')}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-foreground">{log.batch_name_display}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="border-border text-foreground">
                                                            x{log.multiplier}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{log.produced_by_name || 'System'}</TableCell>
                                                    <TableCell>
                                                        {log.is_reversed ? (
                                                            <Badge variant="outline" className="border-border text-muted-foreground">
                                                                Reversed
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-muted text-foreground">
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
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                        <div className="text-sm text-muted-foreground border-border">
                                            Showing {batchLogs.length} of {globalLogTotal} entries
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage(p => Math.max(1, p - 1))} disabled={globalLogPage === 1} className="border-border">Previous</Button>
                                            <div className="flex items-center px-4 bg-muted rounded text-sm font-medium border-border">
                                                Page {globalLogPage} of {Math.ceil(globalLogTotal / ITEMS_PER_PAGE) || 1}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setGlobalLogPage(p => p + 1)} disabled={globalLogPage * ITEMS_PER_PAGE >= globalLogTotal} className="border-border">Next</Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Add Production Batch Dialog */}
                <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
                    <DialogContent className="glass border-border">
                        <DialogHeader>
                            <DialogTitle>Create Production Batch</DialogTitle>
                            <DialogDescription>
                                Give this batch a name (e.g., "Daily Millet Mix - 100kg")
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Batch Name</Label>
                                <Input
                                    value={newBatchName}
                                    onChange={(e) => setNewBatchName(e.target.value)}
                                    placeholder="Enter batch name..."
                                    className="border-border focus:border-border"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleAddBatchSubmit}
                                className="bg-foreground text-background text-white hover:bg-foreground/90 w-full"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Batch
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
