import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RecipeManagerModalProps, RecipeItem, RawItem } from '@/api/models';
import { addProductRecipe, addCustomRecipe, deleteProductRecipeItem, deleteCustomRecipeItem } from '@/api/features';
import { useToast } from '@/components/ui/use-toast';

export default function RecipeManagerModal({
 isOpen,
 onClose,
 itemId,
 itemName,
 itemType,
 rawItems,
 existingRecipes = [],
 onRecipeAdded
}: RecipeManagerModalProps) {
 const { toast } = useToast();
 const [recipes, setRecipes] = useState<RecipeItem[]>(existingRecipes);
 const [selectedRawItem, setSelectedRawItem] = useState<number | null>(null);
 const [quantityRequired, setQuantityRequired] = useState<string>('');
 const [addingRecipe, setAddingRecipe] = useState(false);
 const [searchQuery, setSearchQuery] = useState('');

 useEffect(() => {
 if (isOpen) {
 setRecipes(existingRecipes);
 setSelectedRawItem(null);
 setQuantityRequired('');
 setSearchQuery('');
 }
 }, [isOpen, existingRecipes]);

 const availableRawItems = rawItems.filter(rawItem => {
 // Filter out raw items already in recipes
 const isAlreadyAdded = recipes.some(recipe => recipe.raw_item === rawItem.id);
 if (isAlreadyAdded) return false;

 // Filter by search query
 if (searchQuery.trim()) {
 const query = searchQuery.toLowerCase();
 return rawItem.name.toLowerCase().includes(query) ||
 rawItem.description?.toLowerCase().includes(query);
 }
 return true;
 });

 const handleAddRecipe = async () => {
 if (!selectedRawItem || !quantityRequired || parseFloat(quantityRequired) <= 0) {
 toast({
 title: 'Invalid input',
 description: 'Please select a raw item and enter a valid quantity.',
 variant: 'destructive',
 });
 return;
 }

 setAddingRecipe(true);
 try {
 const quantity = parseFloat(quantityRequired);

 if (itemType === 'product') {
 await addProductRecipe(itemId, selectedRawItem, quantity);
 } else {
 await addCustomRecipe(itemId, selectedRawItem, quantity);
 }

 // Find the raw item to get its details
 const rawItem = rawItems.find(r => r.id === selectedRawItem);

 // Add to local state
 const newRecipe: RecipeItem = {
 raw_item: selectedRawItem,
 quantity_required: quantity,
 raw_item_name: rawItem?.name,
 raw_item_unit: rawItem?.unit,
 };

 setRecipes([...recipes, newRecipe]);
 setSelectedRawItem(null);
 setQuantityRequired('');
 setSearchQuery('');

 toast({
 title: 'Recipe added',
 description: `Added ${quantity} ${rawItem?.unit || ''} of ${rawItem?.name} to recipe.`,
 });

 if (onRecipeAdded) {
 onRecipeAdded();
 }
 } catch (error: any) {
 console.error('Failed to add recipe:', error);
 toast({
 title: 'Failed to add recipe',
 description: error?.message || 'Please try again.',
 variant: 'destructive',
 });
 } finally {
 setAddingRecipe(false);
 }
 };
 const handleRemoveRecipeItem = async (rawItemId: number) => {
 const rawItem = getRawItemDetails(rawItemId);
 const confirmed = window.confirm(`⚠️ Are you sure you want to remove "${rawItem?.name || 'this item'}" from the recipe?`);

 if (confirmed) {
 try {
 if (itemType === 'product') {
 await deleteProductRecipeItem(itemId, rawItemId);
 } else {
 await deleteCustomRecipeItem(itemId, rawItemId);
 }

 // Update local state
 setRecipes(recipes.filter(r => r.raw_item !== rawItemId));

 toast({
 title: 'Item removed',
 description: `Removed ${rawItem?.name || 'item'} from recipe.`,
 });

 if (onRecipeAdded) {
 onRecipeAdded();
 }
 } catch (error: any) {
 console.error('Failed to remove recipe item:', error);
 toast({
 title: 'Failed to remove item',
 description: error?.message || 'Please try again.',
 variant: 'destructive',
 });
 }
 }
 };


 const getRawItemDetails = (rawItemId: number) => {
 return rawItems.find(r => r.id === rawItemId);
 };

 if (!isOpen) return null;

 return (
 <AnimatePresence>
 {isOpen && (
 <>
 {/* Backdrop */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
 />

 {/* Modal */}
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="w-full max-w-4xl bg-card rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col glass border border-border"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border">
 <div>
 <h2 className="text-2xl font-bold text-foregrounden">Manage Recipe</h2>
 <p className="text-sm text-muted-foreground mt-1">
 {itemType === 'product' ? 'Product' : 'Custom'}: <span className="font-semibold text-foreground">{itemName}</span>
 </p>
 </div>
 <button
 onClick={onClose}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Add New Recipe Section */}
 <div className="mb-8 p-4 bg-muted/30 rounded-lg border border-border">
 <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
 <Plus className="w-5 h-5" />
 Add Raw Item to Recipe
 </h3>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Search/Select Raw Item */}
 <div className="md:col-span-2">
 <Label htmlFor="raw_item" className="text-sm font-medium">Raw Item</Label>
 <div className="mt-1 space-y-2">
 <Input
 placeholder="Search raw items..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="mb-2"
 />
 <Select
 value={selectedRawItem?.toString() || ''}
 onValueChange={(value) => setSelectedRawItem(parseInt(value))}
 >
 <SelectTrigger>
 <SelectValue placeholder="Select a raw item" />
 </SelectTrigger>
 <SelectContent className="max-h-[200px]">
 {availableRawItems.length === 0 ? (
 <div className="p-4 text-center text-sm text-muted-foreground">
 {searchQuery ? 'No raw items match your search' : 'No available raw items'}
 </div>
 ) : (
 availableRawItems.map((rawItem) => (
 <SelectItem key={rawItem.id} value={rawItem.id!.toString()}>
 <div className="flex items-center justify-between w-full">
 <span>{rawItem.name}</span>
 <Badge variant="outline" className="ml-2 text-xs">
 {rawItem.unit}
 </Badge>
 </div>
 </SelectItem>
 ))
 )}
 </SelectContent>
 </Select>
 {selectedRawItem && (
 <div className="text-xs text-muted-foreground mt-1">
 {getRawItemDetails(selectedRawItem)?.description}
 </div>
 )}
 </div>
 </div>

 {/* Quantity Required */}
 <div>
 <Label htmlFor="quantity_required" className="text-sm font-medium">Quantity Required</Label>
 <Input
 id="quantity_required"
 type="number"
 step="0.01"
 min="0"
 value={quantityRequired}
 onChange={(e) => setQuantityRequired(e.target.value)}
 className="mt-1"
 placeholder="0.00"
 />
 {selectedRawItem && (
 <p className="text-xs text-muted-foreground mt-1">
 Unit: {getRawItemDetails(selectedRawItem)?.unit}
 </p>
 )}
 </div>
 </div>

 <div className="flex justify-end mt-4">
 <Button
 onClick={handleAddRecipe}
 disabled={!selectedRawItem || !quantityRequired || addingRecipe}
 className="bg-[#00d9ff] text-white hover:bg-[#00c4e6] font-semibold border-2 border-[#00d9ff] shadow-lg shadow-[#00d9ff]/30"
 >
 {addingRecipe ? (
 <>
 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
 Adding...
 </>
 ) : (
 <>
 <Plus className="w-4 h-4 mr-2" />
 Add to Recipe
 </>
 )}
 </Button>
 </div>
 </div>

 {/* Existing Recipes Section */}
 <div>
 <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
 <Package className="w-5 h-5" />
 Recipe Items ({recipes.length})
 </h3>

 {recipes.length === 0 ? (
 <div className="p-8 text-center border border-dashed border-border rounded-lg bg-muted/20">
 <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
 <p className="text-muted-foreground">No raw items in recipe yet</p>
 <p className="text-sm text-muted-foreground mt-1">Add raw items above to build the recipe</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {recipes.map((recipe, index) => {
 const rawItem = getRawItemDetails(recipe.raw_item);
 return (
 <motion.div
 key={recipe.raw_item || index}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="p-4 bg-card border border-border rounded-lg hover:border-border transition-colors"
 >
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="flex items-center justify-between mb-2">
 <div className="flex items-center gap-2">
 <h4 className="font-semibold text-foreground">{rawItem?.name || 'Unknown'}</h4>
 <Badge variant="outline" className="text-xs">
 {rawItem?.unit || recipe.raw_item_unit || 'N/A'}
 </Badge>
 </div>
 <button
 onClick={() => handleRemoveRecipeItem(recipe.raw_item)}
 className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors"
 title="Remove from recipe"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
 {rawItem?.description || 'No description'}
 </p>
 <div className="flex items-center gap-4">
 <div>
 <span className="text-xs text-muted-foreground">Quantity Required:</span>
 <span className="ml-2 font-semibold text-foreground">
 {Number(recipe.quantity_required).toFixed(2)} {rawItem?.unit || ''}
 </span>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>
 </div>

 {/* Footer */}
 <div className="flex justify-end gap-3 p-6 border-t border-border">
 <Button variant="outline" onClick={onClose}>
 Close
 </Button>
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>
 );
}

