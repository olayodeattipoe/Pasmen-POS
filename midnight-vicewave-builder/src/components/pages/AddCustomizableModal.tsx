import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Customizable, AddCustomizableModalProps } from '@/api/models';

const UNIT_TYPES = [
 { value: 'GRAMS', label: 'g' },
 { value: 'LITRE', label: 'litre' },
 { value: 'PIECES', label: 'pieces' },
];

const PRICING_TYPES = [
 { value: 'FIX', label: 'Fixed' },
 { value: 'VAR', label: 'Variable' },
 { value: 'FIX_VAR', label: 'Fixed & Variable' },
];

export default function AddCustomizableModal({
 isOpen,
 onClose,
 headers,
 selectedHeaderId,
 onSubmit,
 item
}: AddCustomizableModalProps) {
 const isEditMode = !!item;

 const [formData, setFormData] = useState<Customizable>({
 name: '',
 customizable_header: selectedHeaderId || (headers.length > 0 ? headers[0].id : 0),
 unit: 'PIECES',
 price: 0,
 pricing_type: 'FIX',
 is_available: true,
 adjustable: false,
 });

 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [priceArray, setPriceArray] = useState<number[]>([]);
 const [newPrice, setNewPrice] = useState<string>('');

 // Populate form when item is provided (edit mode) or reset when modal opens/closes
 useEffect(() => {
 if (isOpen) {
 if (item) {
 // Edit mode: populate with existing item data
 // Handle customizable_header - it might be an object with id property or just a number
 const headerId = typeof item.customizable_header === 'object' && item.customizable_header !== null
 ? (item.customizable_header as any).id
 : item.customizable_header;

 setFormData({
 id: item.id,
 name: item.name || '',
 customizable_header: headerId || (selectedHeaderId || (headers.length > 0 ? headers[0].id : 0)),
 unit: item.unit || 'PIECES',
 price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
 pricing_type: item.pricing_type || 'FIX',
 is_available: item.is_available ?? true,
 adjustable: item.adjustable ?? false,
 description: item.description || '',
 alias: item.alias || '',
 quantity_if_package: typeof item.quantity_if_package === 'string'
 ? parseInt(item.quantity_if_package)
 : item.quantity_if_package,
 price_if_package: typeof item.price_if_package === 'string'
 ? parseFloat(item.price_if_package)
 : item.price_if_package,
 });

 // Set price array if it exists
 if (item.array_if_fixed_variable) {
 setPriceArray(item.array_if_fixed_variable);
 }

 // Set image preview if item has an image URL (from backend)
 let imageUrl = (item.image && typeof item.image === 'string') ? item.image : (item as any).image_url;
 if (imageUrl && !imageUrl.startsWith('data:')) {
 const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
 let cleanPath = imageUrl;

 if (cleanPath.startsWith('http')) {
 setImagePreview(cleanPath);
 } else {
 // Ensure leading slash
 if (!cleanPath.startsWith('/')) {
 cleanPath = `/${cleanPath}`;
 }
 // Add /media/ if missing
 if (!cleanPath.startsWith('/media/')) {
 cleanPath = `/media${cleanPath}`;
 }
 setImagePreview(`${baseUrl}${cleanPath}`);
 }
 } else if (imageUrl && imageUrl.startsWith('data:')) {
 setImagePreview(imageUrl);
 }
 } else {
 // Add mode: reset to defaults
 setFormData({
 name: '',
 customizable_header: selectedHeaderId || (headers.length > 0 ? headers[0].id : 0),
 unit: 'PIECES',
 price: 0,
 pricing_type: 'FIX',
 is_available: true,
 adjustable: false,
 });
 setImagePreview(null);
 setPriceArray([]);
 setNewPrice('');
 }
 }
 }, [isOpen, item, headers, selectedHeaderId]);

 // Set default header when headers are loaded (only if not in edit mode)
 useEffect(() => {
 if (headers.length > 0 && formData.customizable_header === 0 && !isEditMode) {
 setFormData(prev => ({
 ...prev,
 customizable_header: selectedHeaderId || headers[0].id
 }));
 }
 }, [headers, isEditMode, selectedHeaderId]);

 const handleInputChange = (field: keyof Customizable, value: any) => {
 setFormData(prev => ({ ...prev, [field]: value }));
 };

 const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 setFormData(prev => ({ ...prev, image: file }));
 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 }
 };

 const handleAddPrice = () => {
 const price = parseFloat(newPrice);
 if (!isNaN(price) && price > 0) {
 setPriceArray([...priceArray, price]);
 setNewPrice('');
 }
 };

 const handleRemovePrice = (index: number) => {
 setPriceArray(priceArray.filter((_, i) => i !== index));
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();

 // Add price array if pricing type is FIX_VAR
 const finalData = { ...formData };
 if (formData.pricing_type === 'FIX_VAR') {
 finalData.array_if_fixed_variable = priceArray;
 }

 onSubmit(finalData);
 handleClose();
 };

 const handleClose = () => {
 // Reset form
 setFormData({
 name: '',
 customizable_header: selectedHeaderId || (headers.length > 0 ? headers[0].id : 0),
 unit: 'PIECES',
 price: 0,
 pricing_type: 'FIX',
 is_available: true,
 adjustable: false,
 });
 setImagePreview(null);
 setPriceArray([]);
 setNewPrice('');
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
 className="w-full max-w-4xl bg-card rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border">
 <h2 className="text-2xl font-bold">{isEditMode ? 'Edit Customizable' : 'Add Customizable'}</h2>
 <button
 onClick={handleClose}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
 {/* Section 1: Required Fields */}
 <div className="mb-8">
 <h3 className="text-lg font-semibold mb-4 text-primary">Required Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Name */}
 <div>
 <Label htmlFor="name">Name *</Label>
 <input
 id="name"
 type="text"
 required
 value={formData.name}
 onChange={(e) => handleInputChange('name', e.target.value)}
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
 placeholder="Enter customizable name"
 />
 </div>

 {/* Header */}
 <div>
 <Label htmlFor="customizable_header">Header *</Label>
 <Select
 value={formData.customizable_header.toString()}
 onValueChange={(value) => handleInputChange('customizable_header', parseInt(value))}
 >
 <SelectTrigger className="mt-1">
 <SelectValue placeholder="Select header" />
 </SelectTrigger>
 <SelectContent>
 {headers.map((header) => (
 <SelectItem key={header.id} value={header.id.toString()}>
 {header.header}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Unit */}
 <div>
 <Label htmlFor="unit">Unit *</Label>
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

 {/* Price */}
 <div>
 <Label htmlFor="price">Price *</Label>
 <input
 id="price"
 type="number"
 step="0.01"
 required
 value={formData.price || ''}
 onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
 placeholder="0.00"
 />
 </div>

 {/* Pricing Type */}
 <div>
 <Label htmlFor="pricing_type">Pricing Type *</Label>
 <Select
 value={formData.pricing_type}
 onValueChange={(value) => handleInputChange('pricing_type', value)}
 >
 <SelectTrigger className="mt-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {PRICING_TYPES.map((type) => (
 <SelectItem key={type.value} value={type.value}>
 {type.label}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 </div>

 {/* Section 2: Optional Add-ons */}
 <div className="mb-8">
 <h3 className="text-lg font-semibold mb-4 text-primary">Optional Information</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Description */}
 <div className="md:col-span-2">
 <Label htmlFor="description">Description</Label>
 <textarea
 id="description"
 value={formData.description || ''}
 onChange={(e) => handleInputChange('description', e.target.value)}
 className="w-full h-24 px-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1 resize-none"
 placeholder="Enter customizable description"
 />
 </div>

 {/* Image Upload */}
 <div className="md:col-span-2">
 <Label htmlFor="image">Image</Label>
 <div className="mt-1 flex items-center gap-4">
 <label
 htmlFor="image"
 className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-accent cursor-pointer transition-colors"
 >
 <Upload className="w-4 h-4" />
 <span className="text-sm">Choose Image</span>
 </label>
 <input
 id="image"
 type="file"
 accept="image/*"
 onChange={handleImageChange}
 className="hidden"
 />
 {imagePreview && (
 <img
 src={imagePreview}
 alt="Preview"
 className="w-16 h-16 object-cover rounded-lg border border-border"
 />
 )}
 </div>
 </div>

 {/* Alias */}
 <div>
 <Label htmlFor="alias">Alias (Alternative Name)</Label>
 <input
 id="alias"
 type="text"
 value={formData.alias || ''}
 onChange={(e) => handleInputChange('alias', e.target.value)}
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
 placeholder="Alternative name"
 />
 </div>

 {/* Available Toggle */}
 <div className="flex items-center gap-3 pt-6">
 <Switch
 checked={formData.is_available}
 onCheckedChange={(checked) => handleInputChange('is_available', checked)}
 />
 <Label htmlFor="is_available" className="cursor-pointer">
 <span className={`transition-colors ${formData.is_available ? 'text-emerald-500' : 'text-rose-500'}`}>
 {formData.is_available ? 'Available' : 'Unavailable'}
 </span>
 </Label>
 </div>

 {/* Adjustable */}
 <div className="flex items-center gap-3 pt-6">
 <Switch
 checked={formData.adjustable}
 onCheckedChange={(checked) => handleInputChange('adjustable', checked)}
 />
 <Label htmlFor="adjustable" className="cursor-pointer">
 Price Adjustable
 </Label>
 </div>
 </div>
 </div>

 {/* Section 3: Conditional Fields - Package */}
 <div className="mb-8">
 <h3 className="text-lg font-semibold mb-4 text-primary">Package Information (Optional)</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {/* Quantity if Package */}
 <div>
 <Label htmlFor="quantity_if_package">Quantity in Package</Label>
 <input
 id="quantity_if_package"
 type="number"
 value={formData.quantity_if_package || ''}
 onChange={(e) => handleInputChange('quantity_if_package', parseInt(e.target.value))}
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
 placeholder="e.g., 12 for a dozen"
 />
 </div>

 {/* Price if Package */}
 <div>
 <Label htmlFor="price_if_package">Package Price</Label>
 <input
 id="price_if_package"
 type="number"
 step="0.01"
 value={formData.price_if_package || ''}
 onChange={(e) => handleInputChange('price_if_package', parseFloat(e.target.value))}
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
 placeholder="0.00"
 />
 </div>
 </div>
 </div>

 {/* Section 4: Conditional Fields - Fixed & Variable Pricing */}
 {formData.pricing_type === 'FIX_VAR' && (
 <div className="mb-8">
 <h3 className="text-lg font-semibold mb-4 text-primary">Price Options</h3>
 <div className="space-y-3">
 {/* Add Price Input */}
 <div className="flex gap-2">
 <input
 type="number"
 step="0.01"
 value={newPrice}
 onChange={(e) => setNewPrice(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleAddPrice();
 }
 }}
 className="flex-1 h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 placeholder="Enter price option"
 />
 <Button
 type="button"
 onClick={handleAddPrice}
 className="bg-primary text-primary-foreground hover:bg-primary/90"
 >
 <Plus className="w-4 h-4" />
 </Button>
 </div>

 {/* Price List */}
 {priceArray.length > 0 && (
 <div className="rounded-lg border border-border p-4 space-y-2">
 {priceArray.map((price, index) => (
 <div
 key={index}
 className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
 >
 <span className="font-medium">${price.toFixed(2)}</span>
 <button
 type="button"
 onClick={() => handleRemovePrice(index)}
 className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}

 {/* Submit Button */}
 <div className="flex justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="outline" onClick={handleClose}>
 Cancel
 </Button>
 <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
 {isEditMode ? 'Update Customizable' : 'Add Customizable'}
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

