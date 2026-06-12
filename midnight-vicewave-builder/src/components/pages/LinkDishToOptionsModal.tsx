import { useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2, Search, CheckCircle2, Circle, RefreshCcw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Category, Customizable, CustomizableHeader, MenuItemFormData } from '@/api/models';
import { getCustomizableHeaders, getCustomizablesByHeader, updateProductCustomLinks } from '@/api/features';

interface CustomizableGroup {
 header: CustomizableHeader;
 options: Customizable[];
}

interface LinkDishToOptionsModalProps {
 isOpen: boolean;
 onClose: () => void;
 products: MenuItemFormData[];
 categories: Category[];
 selectedCategory: Category | null;
 onCategoryChange: (category: Category) => void;
 onLinksUpdated: () => Promise<void> | void;
 isProductsLoading: boolean;
}

const normalizeCustomIds = (product?: MenuItemFormData | null) => {
 if (!product || !product.products_customs) return [];
 return product.products_customs
 .map((custom) => (typeof custom === 'number' ? custom : custom?.id))
 .filter((id): id is number => typeof id === 'number');
};

export default function LinkDishToOptionsModal({
 isOpen,
 onClose,
 products,
 categories,
 selectedCategory,
 onCategoryChange,
 onLinksUpdated,
 isProductsLoading,
}: LinkDishToOptionsModalProps) {
 const { toast } = useToast();
 const [groups, setGroups] = useState<CustomizableGroup[]>([]);
 const [groupsLoading, setGroupsLoading] = useState(false);
 const [groupsError, setGroupsError] = useState<string | null>(null);
 const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
 const [dishSearch, setDishSearch] = useState('');
 const [optionSearch, setOptionSearch] = useState('');
 const [draftLinks, setDraftLinks] = useState<Set<number>>(new Set());
 const [saving, setSaving] = useState(false);

 const selectedProduct = useMemo(
 () => products.find((item) => item.id === selectedProductId) || null,
 [products, selectedProductId]
 );

 const initialLinks = useMemo(() => new Set(normalizeCustomIds(selectedProduct)), [selectedProduct]);

 const hasChanges = useMemo(() => {
 if (initialLinks.size !== draftLinks.size) return true;
 for (const id of initialLinks) {
 if (!draftLinks.has(id)) return true;
 }
 return false;
 }, [initialLinks, draftLinks]);

 const fetchCustomizableGroups = useCallback(async () => {
 setGroupsLoading(true);
 setGroupsError(null);
 try {
 const headers = await getCustomizableHeaders();
 if (!headers || headers.length === 0) {
 setGroups([]);
 return;
 }

 const data = await Promise.all(
 headers.map(async (header: CustomizableHeader) => {
 const options = (await getCustomizablesByHeader(header.id)) || [];
 return {
 header,
 options,
 };
 })
 );

 setGroups(data);
 } catch (error: any) {
 console.error('Failed to load customizable groups:', error);
 setGroupsError(error?.message || 'Unable to load customizable options');
 } finally {
 setGroupsLoading(false);
 }
 }, []);

 useEffect(() => {
 if (!isOpen) return;
 fetchCustomizableGroups();
 }, [isOpen, fetchCustomizableGroups]);

 useEffect(() => {
 if (!isOpen) return;
 if (products.length === 0) {
 setSelectedProductId(null);
 return;
 }
 setSelectedProductId(products[0]?.id ?? null);
 }, [isOpen, products]);

 useEffect(() => {
 setDraftLinks(new Set(initialLinks));
 }, [initialLinks]);

 const filteredProducts = useMemo(() => {
 if (!dishSearch.trim()) return products;
 const query = dishSearch.toLowerCase();
 return products.filter((item) =>
 `${item.name} ${item.description || ''}`.toLowerCase().includes(query)
 );
 }, [products, dishSearch]);

 const handleToggleCustom = (customId?: number) => {
 if (!customId) return;
 setDraftLinks((prev) => {
 const next = new Set(prev);
 if (next.has(customId)) {
 next.delete(customId);
 } else {
 next.add(customId);
 }
 return next;
 });
 };

 const handleBulkToggle = (customIds: number[], action: 'add' | 'remove') => {
 setDraftLinks((prev) => {
 const next = new Set(prev);
 customIds.forEach((id) => {
 if (action === 'add') {
 next.add(id);
 } else {
 next.delete(id);
 }
 });
 return next;
 });
 };

 const handleReset = () => {
 setDraftLinks(new Set(initialLinks));
 setOptionSearch('');
 };

 const handleSave = async () => {
 if (!selectedProduct || !selectedProduct.id) {
 toast({
 title: 'Select a dish',
 description: 'Choose a dish before linking options.',
 variant: 'destructive',
 });
 return;
 }
 try {
 setSaving(true);
 await updateProductCustomLinks(selectedProduct.id, Array.from(draftLinks));
 await onLinksUpdated();
 toast({
 title: 'Links updated',
 description: `${selectedProduct.name} now has ${draftLinks.size} option${draftLinks.size === 1 ? '' : 's'}.`,
 });
 onClose();
 } catch (error: any) {
 console.error('Failed to update links:', error);
 toast({
 title: 'Failed to update',
 description: error?.message || 'Please try again.',
 variant: 'destructive',
 });
 } finally {
 setSaving(false);
 }
 };

 const optionMatchesSearch = (option: Customizable) => {
 if (!optionSearch.trim()) return true;
 const query = optionSearch.toLowerCase();
 return (
 option.name.toLowerCase().includes(query) ||
 (option.description ? option.description.toLowerCase().includes(query) : false)
 );
 };

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
 />
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="w-full max-w-6xl bg-card rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
 >
 <div className="flex items-center justify-between p-6 border-b border-border">
 <div>
 <h2 className="text-2xl font-bold">Link Dishes to Options</h2>
 <p className="text-sm text-muted-foreground">
 Choose a dish on the left, then link or unlink custom options on the right.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <Button
 variant="ghost"
 size="icon"
 onClick={fetchCustomizableGroups}
 disabled={groupsLoading}
 >
 {groupsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
 </Button>
 <button
 onClick={onClose}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="flex flex-1 min-h-0 divide-x divide-border">
 {/* Dish list */}
 <div className="w-full max-w-sm flex flex-col min-h-0">
 <div className="p-4 space-y-3 border-b border-border">
 <div className="flex flex-col gap-2">
 <label className="text-sm font-medium">Filter by Category</label>
 <Select
 value={selectedCategory?.id.toString() || ''}
 onValueChange={(value) => {
 const category = categories.find((cat) => cat.id.toString() === value);
 if (category) {
 onCategoryChange(category);
 }
 }}
 >
 <SelectTrigger>
 <SelectValue placeholder="All categories" />
 </SelectTrigger>
 <SelectContent>
 {categories.map((cat) => (
 <SelectItem key={cat.id} value={cat.id.toString()}>
 {cat.category_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 value={dishSearch}
 onChange={(e) => setDishSearch(e.target.value)}
 placeholder="Search dishes..."
 className="pl-9"
 />
 </div>
 </div>

 <ScrollArea className="flex-1 min-h-0">
 {isProductsLoading ? (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>Loading dishes…</span>
 </div>
 ) : filteredProducts.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 px-4 text-center">
 <Layers className="w-5 h-5" />
 <span>No dishes match your filters.</span>
 </div>
 ) : (
 <div className="p-2 space-y-2">
 {filteredProducts.map((item) => {
 const linkedCount = normalizeCustomIds(item).length;
 const isActive = item.id === selectedProductId;
 return (
 <button
 key={item.id}
 onClick={() => setSelectedProductId(item.id!)}
 className={`w-full text-left p-3 rounded-xl border transition-colors ${
 isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
 }`}
 >
 <div className="flex items-center justify-between">
 <div>
 <p className="font-semibold">{item.name}</p>
 <p className="text-xs text-muted-foreground line-clamp-2">
 {item.description || 'No description'}
 </p>
 </div>
 <Badge variant={linkedCount > 0 ? 'default' : 'outline'}>
 {linkedCount} linked
 </Badge>
 </div>
 </button>
 );
 })}
 </div>
 )}
 </ScrollArea>
 </div>

 {/* Options panel */}
 <div className="flex-1 flex flex-col min-h-0">
 {selectedProduct ? (
 <>
 <div className="p-6 space-y-4 border-b border-border">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
 <p className="text-sm text-muted-foreground">
 {selectedProduct.description || 'No description'}
 </p>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={selectedProduct.is_available ? 'default' : 'outline'}>
 {selectedProduct.is_available ? 'Available' : 'Unavailable'}
 </Badge>
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 <Badge variant="secondary">Type: {selectedProduct.type}</Badge>
 <Badge variant="secondary">Pricing: {selectedProduct.pricing_type}</Badge>
 <Badge variant="secondary">
 Linked options: {draftLinks.size}
 </Badge>
 </div>

 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 value={optionSearch}
 onChange={(e) => setOptionSearch(e.target.value)}
 placeholder="Search options..."
 className="pl-9"
 />
 </div>
 <div className="flex gap-2">
 <Button variant="outline" onClick={handleReset} disabled={!hasChanges && optionSearch === ''}>
 Reset
 </Button>
 <Button onClick={handleSave} disabled={!hasChanges || saving}>
 {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Links'}
 </Button>
 </div>
 </div>
 </div>

 <ScrollArea className="flex-1 min-h-0">
 <div className="p-6 space-y-6">
 {groupsLoading ? (
 <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>Loading customizable options…</span>
 </div>
 ) : groupsError ? (
 <div className="text-center text-sm text-destructive">{groupsError}</div>
 ) : groups.length === 0 ? (
 <div className="text-center text-sm text-muted-foreground">
 No custom options available yet. Create customizables first.
 </div>
 ) : (
 groups.map((group) => {
 const filteredOptions = group.options.filter(
 (option) => option.id && optionMatchesSearch(option)
 );
 const optionIds = filteredOptions
 .map((option) => option.id)
 .filter((id): id is number => typeof id === 'number');
 const linkedInGroup = optionIds.filter((id) => draftLinks.has(id));
 const isFullyLinked = optionIds.length > 0 && linkedInGroup.length === optionIds.length;

 return (
 <div key={group.header.id} className="border border-border rounded-2xl p-4 space-y-4">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <h4 className="font-semibold">{group.header.header}</h4>
 <p className="text-sm text-muted-foreground">
 {linkedInGroup.length}/{optionIds.length} linked
 </p>
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleBulkToggle(optionIds, 'add')}
 disabled={optionIds.length === 0 || isFullyLinked}
 >
 Link all
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => handleBulkToggle(optionIds, 'remove')}
 disabled={linkedInGroup.length === 0}
 >
 Unlink all
 </Button>
 </div>
 </div>

 {filteredOptions.length === 0 ? (
 <div className="text-sm text-muted-foreground">
 No options match your search in this header.
 </div>
 ) : (
 <div className="grid gap-3 sm:grid-cols-2">
 {filteredOptions.map((option) => (
 <button
 key={option.id}
 onClick={() => handleToggleCustom(option.id)}
 className={`p-3 rounded-xl border text-left transition-colors ${
 option.id && draftLinks.has(option.id)
 ? 'border-primary bg-primary/10'
 : 'border-border hover:border-primary/40'
 }`}
 >
 <div className="flex items-start justify-between gap-3">
 <div>
 <p className="font-medium">{option.name}</p>
 <p className="text-xs text-muted-foreground line-clamp-2">
 {option.description || 'No description'}
 </p>
 </div>
 {option.id && draftLinks.has(option.id) ? (
 <div className="flex items-center text-emerald-600 text-xs gap-1">
 <CheckCircle2 className="w-4 h-4" />
 Linked
 </div>
 ) : (
 <div className="flex items-center text-muted-foreground text-xs gap-1">
 <Circle className="w-4 h-4" />
 Tap to link
 </div>
 )}
 </div>
 {option.price && (
 <p className="text-sm font-semibold mt-2">
 ${Number(option.price).toFixed(2)}
 </p>
 )}
 </button>
 ))}
 </div>
 )}
 </div>
 );
 })
 )}
 </div>
 </ScrollArea>
 </>
 ) : (
 <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
 Select a dish to start linking options.
 </div>
 )}
 </div>
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>
 );
}

