import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RawItem, AddTransformableModalProps } from '@/api/models';

const UNIT_TYPES = [
 { value: 'GRAMS', label: 'Grams (g)' },
 { value: 'LITRE', label: 'Litre (L)' },
 { value: 'PIECES', label: 'Pieces' },
];

const RAW_ITEM_TYPES = [
 { value: 'COUNTABLE', label: 'Countable' },
 { value: 'VOLUME', label: 'Volume' },
];

export default function AddTransformableModal({
 isOpen,
 onClose,
 suppliers,
 onSubmit,
 item
}: AddTransformableModalProps) {
 const isEditMode = !!item;

 const [formData, setFormData] = useState<RawItem>({
 name: '',
 unit: 'PIECES',
 type: 'COUNTABLE',
 description: '',
 unit_batch_quantity: 0,
 supplied_by: [],
 reorder_level: 0,
 quantity_in_stock: 0, // Keep in state for API compatibility but hidden
 });

 const [selectedSuppliers, setSelectedSuppliers] = useState<number[]>([]);

 // Populate form when item is provided (edit mode) or reset when modal opens/closes
 useEffect(() => {
 if (isOpen) {
 if (item) {
 // Edit mode: populate with existing item data
 setFormData({
 id: item.id,
 name: item.name || '',
 unit: item.unit || 'PIECES',
 type: item.type || 'COUNTABLE',
 description: item.description || '',
 unit_batch_quantity: item.unit_batch_quantity || 0,
 supplied_by: item.supplied_by || [],
 reorder_level: item.reorder_level || 0,
 quantity_in_stock: item.quantity_in_stock || 0,
 });
 setSelectedSuppliers(item.supplied_by || []);
 } else {
 // Add mode: reset to defaults
 setFormData({
 name: '',
 unit: 'PIECES',
 type: 'COUNTABLE',
 description: '',
 unit_batch_quantity: 0,
 supplied_by: [],
 reorder_level: 0,
 quantity_in_stock: 0,
 });
 setSelectedSuppliers([]);
 }
 }
 }, [isOpen, item]);

 const handleInputChange = (field: keyof RawItem, value: any) => {
 setFormData(prev => ({ ...prev, [field]: value }));
 };

 const handleSupplierToggle = (supplierId: number) => {
 setSelectedSuppliers(prev => {
 if (prev.includes(supplierId)) {
 return prev.filter(id => id !== supplierId);
 } else {
 return [...prev, supplierId];
 }
 });
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();

 const finalData = {
 ...formData,
 supplied_by: selectedSuppliers,
 };

 onSubmit(finalData);
 handleClose();
 };

 const handleClose = () => {
 // Reset form
 setFormData({
 name: '',
 unit: 'PIECES',
 type: 'COUNTABLE',
 description: '',
 unit_batch_quantity: 0,
 supplied_by: [],
 reorder_level: 0,
 quantity_in_stock: 0,
 });
 setSelectedSuppliers([]);
 onClose();
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
 onClick={handleClose}
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
 <h2 className="text-2xl font-bold text-foreground">{isEditMode ? 'Edit Raw Item' : 'Add Raw Item'}</h2>
 <p className="text-sm text-muted-foreground mt-1">Manage raw materials and inventory items</p>
 </div>
 <button
 onClick={handleClose}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
 {/* Section 1: Basic Information */}
 <div className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-foreground">Basic Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Name */}
 <div>
 <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
 <Input
 id="name"
 type="text"
 required
 value={formData.name}
 onChange={(e) => handleInputChange('name', e.target.value)}
 className="mt-1"
 placeholder="e.g., Rice, Flour, Eggs"
 />
 </div>

 {/* Unit */}
 <div>
 <Label htmlFor="unit" className="text-sm font-medium">Unit *</Label>
 <Select
 value={formData.unit}
 onValueChange={(value) => handleInputChange('unit', value)}
 >
 <SelectTrigger className="mt-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {UNIT_TYPES.map((unit) => (
 <SelectItem key={unit.value} value={unit.value}>
 {unit.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Type */}
 <div>
 <Label htmlFor="type" className="text-sm font-medium">Type *</Label>
 <Select
 value={formData.type}
 onValueChange={(value) => handleInputChange('type', value)}
 >
 <SelectTrigger className="mt-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {RAW_ITEM_TYPES.map((type) => (
 <SelectItem key={type.value} value={type.value}>
 {type.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Description */}
 <div className="md:col-span-2">
 <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
 <Textarea
 id="description"
 required
 value={formData.description}
 onChange={(e) => handleInputChange('description', e.target.value)}
 className="mt-1 min-h-[100px]"
 placeholder="Describe the raw item..."
 />
 </div>
 </div>
 </div>

 {/* Section 2: Inventory Details */}
 <div className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-foreground">Inventory Details</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Unit Batch Quantity */}
 <div>
 <Label htmlFor="unit_batch_quantity" className="text-sm font-medium">Unit Batch Quantity *</Label>
 <Input
 id="unit_batch_quantity"
 type="number"
 step="0.01"
 min="0"
 required
 value={formData.unit_batch_quantity || ''}
 onChange={(e) => handleInputChange('unit_batch_quantity', parseFloat(e.target.value) || 0)}
 className="mt-1"
 placeholder="0.00"
 />
 <p className="text-xs text-muted-foreground mt-1">
 e.g., 50kg per bag of rice
 </p>
 </div>

 {/* Reorder Level */}
 <div>
 <Label htmlFor="reorder_level" className="text-sm font-medium">Reorder Level *</Label>
 <Input
 id="reorder_level"
 type="number"
 min="0"
 required
 value={formData.reorder_level || ''}
 onChange={(e) => handleInputChange('reorder_level', parseInt(e.target.value) || 0)}
 className="mt-1"
 placeholder="0"
 />
 <p className="text-xs text-muted-foreground mt-1">
 Minimum stock before reordering
 </p>
 </div>
 </div>
 </div>

 {/* Section 3: Suppliers */}
 <div className="mb-8">
 <h3 className="text-lg font-bold mb-4 text-foreground">Suppliers (Optional)</h3>
 {suppliers.length === 0 ? (
 <div className="p-4 bg-muted/30 rounded-lg border border-border text-center text-sm text-muted-foreground">
 No suppliers available. Add suppliers first to link them here.
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {suppliers.map((supplier) => {
 const isSelected = selectedSuppliers.includes(supplier.id);
 return (
 <button
 key={supplier.id}
 type="button"
 onClick={() => handleSupplierToggle(supplier.id)}
 className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
 ? 'border-foreground bg-foreground/10 shadow-md'
 : 'border-border hover:border-foreground/50 bg-card'
 }`}
 >
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <div className="font-semibold text-sm">{supplier.name}</div>
 <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
 {supplier.contact_info}
 </div>
 </div>
 {isSelected && (
 <Check className="w-5 h-5 text-foreground flex-shrink-0 ml-2" />
 )}
 </div>
 </button>
 );
 })}
 </div>
 )}
 {selectedSuppliers.length > 0 && (
 <div className="mt-4 flex flex-wrap gap-2">
 {selectedSuppliers.map((supplierId) => {
 const supplier = suppliers.find(s => s.id === supplierId);
 return supplier ? (
 <Badge key={supplierId} variant="secondary" className="border-border">
 {supplier.name}
 </Badge>
 ) : null;
 })}
 </div>
 )}
 </div>

 {/* Submit Button */}
 <div className="flex justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="outline" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 type="submit"
 className="bg-foreground text-background hover:bg-foreground/90 font-bold border-2 border-foreground shadow-lg"
 >
 {isEditMode ? 'Update Raw Item' : 'Add Raw Item'}
 </Button>
 </div>
 </form>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>
 );
}

