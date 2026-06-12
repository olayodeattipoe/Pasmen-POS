import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Settings, List, Link, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Category, MenuItemFormData, CustomizableHeader, Customizable } from '@/api/models';
import { getCategories, editCategory, deleteCategory, addCategory, addMenuItem, getProductsbyCategories, updateMenuItem, getCustomizableHeaders, addCustomizableHeaders, getCustomizablesByHeader, updateCustomizable, deleteCustomizable, addCustomizable, deleteProduct, deleteCustomizableHeader } from '@/api/features';
import AddMenuItemModal from './AddMenuItemModal';
import AddCustomizableModal from './AddCustomizableModal';
import LinkDishToOptionsModal from './LinkDishToOptionsModal';

export default function MenuItemsPage() {
 const [menuItems, setMenuItems] = useState<MenuItemFormData[]>([]);
 const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
 const [categories, setCategories] = useState<Category[]>([]);
 const [showCategoryModal, setShowCategoryModal] = useState(false);
 const [showCustomizableModal, setShowCustomizableModal] = useState(false);
 const [showAddItemModal, setShowAddItemModal] = useState(false);
 const [editingItem, setEditingItem] = useState<MenuItemFormData | null>(null);
 const [newCategoryName, setNewCategoryName] = useState('');
 const [editingCategory, setEditingCategory] = useState<Category | null>(null);
 const [editCategoryName, setEditCategoryName] = useState('');
 const [customHeaders, setCustomHeaders] = useState<CustomizableHeader[]>([]);
 const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
 const [editingHeaderName, setEditingHeaderName] = useState('');
 const [isAddingHeader, setIsAddingHeader] = useState(false);
 const [newHeaderName, setNewHeaderName] = useState('');
 const [selectedHeader, setSelectedHeader] = useState<CustomizableHeader | null>(null);
 const [customizables, setCustomizables] = useState<Customizable[]>([]);
 const [editingCustomizable, setEditingCustomizable] = useState<Customizable | null>(null);
 const [showAddCustomizableModal, setShowAddCustomizableModal] = useState(false);
 const [showLinkOptionsModal, setShowLinkOptionsModal] = useState(false);
 const [isProductsLoading, setIsProductsLoading] = useState(false);

 // Toggle availability
 const handleToggle = (id: number) => {
 setMenuItems(items =>
 items.map(item =>
 item.id === id ? { ...item, is_available: !item.is_available } : item
 )
 );
 };

 // Fetch categories
 const handleFetchCategories = async () => {
 try {
 const cats = await getCategories();
 setCategories(cats);
 if (!selectedCategory && cats.length > 0) {
 setSelectedCategory(cats[0]);
 }
 } catch (err: any) {
 console.error("Error fetching categories:", err.message);
 setCategories([]);
 }
 };

 // Fetch menu items by category
 const handleFetchProductsByCategory = async (category: Category) => {
 setIsProductsLoading(true);
 try {
 const products = await getProductsbyCategories(category);
 setMenuItems(products);
 } catch (err: any) {
 console.error("Error fetching products:", err.message);
 setMenuItems([]);
 } finally {
 setIsProductsLoading(false);
 }
 };

 // Add category
 const handleAddCategory = async () => {
 if (newCategoryName.trim()) {
 await addCategory(newCategoryName);
 setNewCategoryName('');
 await handleFetchCategories();
 }
 };

 // Edit category
 const handleEditCategory = (category: Category) => {
 setEditingCategory(category);
 setEditCategoryName(category.category_name);
 };

 const handleSaveEdit = async () => {
 if (editingCategory && editCategoryName.trim()) {
 const updatedCategory = { ...editingCategory, category_name: editCategoryName };
 await editCategory(updatedCategory);
 setEditingCategory(null);
 setEditCategoryName('');
 await handleFetchCategories();
 }
 };

 const handleCancelEdit = () => {
 setEditingCategory(null);
 setEditCategoryName('');
 };

 const handleAddHeader = () => {
 setIsAddingHeader(true);
 setNewHeaderName('');
 setEditingHeaderIndex(null);
 setEditingHeaderName('');
 };

 const handleCancelNewHeader = () => {
 setIsAddingHeader(false);
 setNewHeaderName('');
 };

 const handleSaveNewHeader = async () => {
 const trimmedName = newHeaderName.trim();
 if (!trimmedName) return;

 try {
 await addCustomizableHeaders(trimmedName);
 await handleFetchCustomizableHeaders();
 setIsAddingHeader(false);
 setNewHeaderName('');
 setEditingHeaderIndex(null);
 setEditingHeaderName('');
 } catch (error) {
 console.error("Failed to add customizable header:", error);
 setIsAddingHeader(false);
 setNewHeaderName('');
 setEditingHeaderIndex(null);
 setEditingHeaderName('');
 }
 };

 const handleStartEditingHeader = (index: number) => {
 const header = customHeaders[index];
 if (!header) return;
 setEditingHeaderIndex(index);
 setEditingHeaderName(header.header);
 };

 const handleCommitHeaderEdit = () => {
 if (editingHeaderIndex === null) return;

 setCustomHeaders((prev) =>
 prev.map((header, idx) =>
 idx === editingHeaderIndex
 ? {
 ...header,
 header: editingHeaderName.trim() || header.header
 }
 : header
 )
 );

 setEditingHeaderIndex(null);
 setEditingHeaderName('');
 };

 const handleCancelHeaderEdit = () => {
 setEditingHeaderIndex(null);
 setEditingHeaderName('');
 };

 // Delete category
 const handleDeleteCategory = async (category: Category) => {
 const confirmed = window.confirm(
 `⚠️ Warning: Deleting "${category.category_name}" will remove all associated products. Continue?`
 );
 if (confirmed) {
 await deleteCategory(category);
 await handleFetchCategories();
 }
 };

 const handleFetchCustomizableHeaders = async () => {
 try {
 const headers = await getCustomizableHeaders();
 if (headers && headers.length > 0) {
 setCustomHeaders(headers);
 if (!selectedHeader) {
 await handleSelectHeader(headers[0]);
 }
 } else {
 setCustomHeaders([]);
 setSelectedHeader(null);
 setCustomizables([]);
 }
 } catch (err: any) {
 console.error("Error fetching customizable headers:", err.message);
 setCustomHeaders([]);
 setSelectedHeader(null);
 setCustomizables([]);
 }
 };

 const handleSelectHeader = async (header: CustomizableHeader) => {
 setSelectedHeader(header);
 setEditingCustomizable(null);

 try {
 const customizablesData = await getCustomizablesByHeader(header.id);
 if (customizablesData && customizablesData.length > 0) {
 setCustomizables(customizablesData);
 } else {
 setCustomizables([]);
 }
 } catch (err: any) {
 console.error("Error fetching customizables:", err.message);
 setCustomizables([]);
 }
 };

 const handleEditCustomizable = (customizable: Customizable) => {
 setEditingCustomizable(customizable);
 setShowAddCustomizableModal(true);
 };

 const handleAddCustomizable = () => {
 if (!selectedHeader) {
 alert('Please select a header first');
 return;
 }
 setEditingCustomizable(null);
 setShowAddCustomizableModal(true);
 };

 const handleCloseCustomizableModal = () => {
 setShowAddCustomizableModal(false);
 setEditingCustomizable(null);
 };

 const handleSubmitCustomizable = async (formData: Customizable) => {
 try {
 if (editingCustomizable && formData.id) {
 // Update existing customizable
 await updateCustomizable(formData);
 if (selectedHeader) {
 await handleSelectHeader(selectedHeader);
 }
 } else {
 // Add new customizable
 await addCustomizable(formData);
 if (selectedHeader) {
 await handleSelectHeader(selectedHeader);
 }
 }
 handleCloseCustomizableModal();
 } catch (err: any) {
 console.error("Error saving customizable:", err.message);
 handleCloseCustomizableModal();
 }
 };

 const handleDeleteCustomizable = async (customizableId: number) => {
 const confirmed = window.confirm(
 "⚠️ Warning: Are you sure you want to delete this customizable?"
 );
 if (confirmed) {
 try {
 await deleteCustomizable(customizableId);
 if (selectedHeader) {
 await handleSelectHeader(selectedHeader);
 }
 } catch (err: any) {
 console.error("Error deleting customizable:", err.message);
 }
 }
 };

 // Add or update menu item
 const handleAddMenuItem = async (formData: MenuItemFormData) => {
 if (editingItem && formData.id) {
 // Update existing item
 console.log('Updating menu item:', formData);
 await updateMenuItem(formData);
 } else {
 // Add new item
 console.log('New menu item:', formData);
 await addMenuItem(formData);
 }

 // Clear editing state and refresh list
 setEditingItem(null);
 if (selectedCategory) {
 await handleFetchProductsByCategory(selectedCategory);
 }
 };

 // Handle edit button click
 const handleEditItem = (item: MenuItemFormData) => {
 setEditingItem(item);
 setShowAddItemModal(true);
 };

 // Handle closing the modal
 const handleCloseModal = () => {
 setShowAddItemModal(false);
 setEditingItem(null);
 };

 const handleDeleteMenuItem = async (item: MenuItemFormData) => {
 const confirmed = window.confirm(
 `⚠️ Warning: Are you sure you want to delete "${item.name}"? This action cannot be undone.`
 );
 if (confirmed && item.id) {
 try {
 await deleteProduct(item.id);
 if (selectedCategory) {
 await handleFetchProductsByCategory(selectedCategory);
 }
 } catch (err: any) {
 console.error("Error deleting product:", err.message);
 alert(err.message || "Failed to delete product");
 }
 }
 };

 const handleDeleteHeader = async (header: CustomizableHeader) => {
 const confirmed = window.confirm(
 `⚠️ Warning: Deleting header "${header.header}" will also remove all its choices. Continue?`
 );
 if (confirmed) {
 try {
 await deleteCustomizableHeader(header.id);
 await handleFetchCustomizableHeaders();
 } catch (err: any) {
 console.error("Error deleting header:", err.message);
 alert(err.message || "Failed to delete header");
 }
 }
 };

 // Initial load
 useEffect(() => {
 handleFetchCategories();
 handleFetchCustomizableHeaders();
 }, []);

 const getImageUrl = (path: string | any) => {
 if (!path) return null;
 if (typeof path !== 'string') return null;
 if (path.startsWith('http')) return path;
 const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

 // Ensure the path starts with /
 let cleanPath = path.startsWith('/') ? path : `/${path}`;

 // Check if the path needs the /media/ prefix
 if (!cleanPath.startsWith('/media/')) {
 cleanPath = `/media${cleanPath}`;
 }

 return `${baseUrl}${cleanPath}`;
 };

 // Fetch menu items when category changes
 useEffect(() => {
 if (selectedCategory) {
 handleFetchProductsByCategory(selectedCategory);
 }
 }, [selectedCategory]);

 return (
 <div className="space-y-8">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-3xl font-bold">Menu Items</h1>
 <p className="text-muted-foreground">Manage your restaurant menu</p>
 </div>
 <Button
 onClick={() => setShowAddItemModal(true)}
 className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
 >
 <Plus className="w-4 h-4" /> Add Item
 </Button>
 </div>

 {/* Filters & Actions */}
 <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
 <div className="flex flex-wrap gap-3">
 <Button
 variant="outline"
 className="gap-2"
 onClick={() => setShowCustomizableModal(true)}
 >
 <Settings className="w-4 h-4" /> Manage Customizables
 </Button>
 <Button variant="outline" className="gap-2" onClick={() => setShowCategoryModal(true)}>
 <List className="w-4 h-4" /> Manage Categories
 </Button>
 <Button variant="outline" className="gap-2" onClick={() => setShowLinkOptionsModal(true)}>
 <Link className="w-4 h-4" /> Link Dish to Options
 </Button>
 </div>

 {/* Category Dropdown */}
 <Select
 value={selectedCategory?.id.toString() || ''}
 onValueChange={(val) => {
 const cat = categories.find(c => c.id.toString() === val);
 if (cat) setSelectedCategory(cat);
 }}
 >
 <SelectTrigger className="w-[200px]">
 <SelectValue placeholder="Select category" />
 </SelectTrigger>
 <SelectContent>
 {categories.map((category) => (
 <SelectItem key={category.id} value={category.id.toString()}>
 {category.category_name}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>

 {/* Search */}
 <div className="flex gap-4">
 <div className="relative flex-1 max-w-md">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search menu items..."
 className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>

 {/* Menu Table */}
 <div className="rounded-lg border border-border bg-card overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted/50">
 <tr>
 <th className="text-left p-4 text-sm font-medium">Image</th>
 <th className="text-left p-4 text-sm font-medium">Name</th>
 <th className="text-left p-4 text-sm font-medium">Description</th>
 <th className="text-right p-4 text-sm font-medium">Price</th>
 <th className="text-center p-4 text-sm font-medium">Available</th>
 <th className="text-right p-4 text-sm font-medium">Actions</th>
 </tr>
 </thead>
 <tbody>
 {menuItems.map((item, index) => (
 <motion.tr
 key={item.id}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: index * 0.05 }}
 className="border-t border-border hover:bg-muted/30 transition-colors"
 >
 <td className="p-4">
 <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
 {item.image ? (
 <img
 src={getImageUrl(item.image) || ''}
 alt={item.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.style.display = 'none';
 target.parentElement!.innerHTML = '<span class="text-[10px] text-muted-foreground p-1 text-center">No Image</span>';
 }}
 />
 ) : (
 <span className="text-[10px] text-muted-foreground">No Image</span>
 )}
 </div>
 </td>
 <td className="p-4 font-medium">{item.name}</td>
 <td className="p-4 text-sm text-muted-foreground">{item.description}</td>
 <td className="p-4 text-right font-semibold">${Number(item.price).toFixed(2)}</td>
 <td className="p-4">
 <div className="flex items-center justify-center gap-2">
 <Switch checked={item.is_available} onCheckedChange={() => handleToggle(item.id)} />
 <span className="text-sm">{item.is_available ? 'Yes' : 'No'}</span>
 </div>
 </td>
 <td className="p-4">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => handleEditItem(item)}
 className="p-2 hover:bg-accent rounded-lg transition-colors text-foreground"
 title="Edit Item"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleDeleteMenuItem(item)}
 className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
 title="Delete Item"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </motion.tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Manage Categories Modal */}
 <AnimatePresence>
 {showCategoryModal && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowCategoryModal(false)}
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
 />

 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="w-full max-w-4xl bg-card rounded-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
 >
 {/* Header */}
 <div className="flex items-center justify-between p-6 border-b border-border">
 <h2 className="text-2xl font-bold">Manage Categories</h2>
 <button
 onClick={() => setShowCategoryModal(false)}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Add Category */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div>
 <label className="block text-sm font-medium mb-2">Name</label>
 <input
 type="text"
 value={newCategoryName}
 onChange={(e) => setNewCategoryName(e.target.value)}
 placeholder="Enter category name"
 className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <div className="flex items-end gap-2">
 <Button onClick={handleAddCategory} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
 {editingCategory ? 'Update Category' : 'Add Category'}
 </Button>
 {editingCategory && (
 <Button onClick={handleCancelEdit} variant="outline">Cancel</Button>
 )}
 </div>
 </div>

 {/* Categories Table */}
 <div className="rounded-lg border border-border overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted/50">
 <tr>
 <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
 <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
 </tr>
 </thead>
 <tbody>
 {categories.length > 0 ? categories.map((cat) => (
 <tr key={cat.id} className="border-t border-border hover:bg-muted/30 transition-colors">
 <td className="p-4">
 {editingCategory?.id === cat.id ? (
 <input
 type="text"
 value={editCategoryName}
 onChange={(e) => setEditCategoryName(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleSaveEdit();
 if (e.key === 'Escape') handleCancelEdit();
 }}
 className="w-full h-9 px-3 rounded-lg border border-primary bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
 autoFocus
 />
 ) : (
 <span className="font-medium">{cat.category_name}</span>
 )}
 </td>
 <td className="p-4">
 <div className="flex items-center justify-end gap-2">
 {editingCategory?.id === cat.id ? (
 <>
 <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">Save</button>
 <button onClick={handleCancelEdit} className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm font-medium">Cancel</button>
 </>
 ) : (
 <>
 <button onClick={() => handleEditCategory(cat)} className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
 <Edit2 className="w-4 h-4" />
 </button>
 <button onClick={() => handleDeleteCategory(cat)} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
 <Trash2 className="w-4 h-4" />
 </button>
 </>
 )}
 </div>
 </td>
 </tr>
 )) : (
 <tr>
 <td colSpan={2} className="p-8 text-center text-muted-foreground">
 No categories found. Add your first category above.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>

 {/* Manage Customizables Modal */}
 <AnimatePresence>
 {showCustomizableModal && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => {
 setShowCustomizableModal(false);
 handleCancelHeaderEdit();
 setSelectedHeader(null);
 setCustomizables([]);
 setEditingCustomizable(null);
 }}
 className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
 />

 <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="w-full max-w-3xl bg-card rounded-lg shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
 >
 <div className="flex items-center justify-between p-6 border-b border-border">
 <h2 className="text-2xl font-bold">Manage Customizables</h2>
 <button
 onClick={() => {
 setShowCustomizableModal(false);
 handleCancelHeaderEdit();
 setSelectedHeader(null);
 setCustomizables([]);
 setEditingCustomizable(null);
 }}
 className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg font-semibold">Headers</h3>
 <p className="text-sm text-muted-foreground">
 Reorder and rename the headers that appear for your customizables.
 </p>
 </div>
 <Button onClick={handleAddHeader} className="gap-2">
 <Plus className="w-4 h-4" /> Add Header
 </Button>
 </div>

 {isAddingHeader && (
 <div className="border border-dashed border-border rounded-lg bg-background/60 p-4 space-y-3">
 <Input
 value={newHeaderName}
 onChange={(e) => setNewHeaderName(e.target.value)}
 placeholder="Enter new header name"
 autoFocus
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleSaveNewHeader();
 }
 if (e.key === 'Escape') {
 e.preventDefault();
 handleCancelNewHeader();
 }
 }}
 />
 <div className="flex items-center justify-end gap-2">
 <Button
 onClick={handleSaveNewHeader}
 disabled={!newHeaderName.trim()}
 >
 Save Header
 </Button>
 <Button variant="outline" onClick={handleCancelNewHeader}>
 Cancel
 </Button>
 </div>
 </div>
 )}

 <div className="border border-border rounded-lg px-4 py-5 bg-muted/20">
 <div className="flex items-center gap-3 overflow-x-auto pb-2">
 {customHeaders.map((header, index) => (
 <div
 key={header.id}
 onClick={() => handleSelectHeader(header)}
 className={`flex-shrink-0 min-w-[160px] max-w-[200px] px-4 py-3 rounded-lg border transition-colors cursor-pointer group ${selectedHeader?.id === header.id
 ? 'border-primary bg-primary/10 hover:bg-primary/20'
 : 'border-border bg-background hover:bg-accent'
 }`}
 >
 {editingHeaderIndex === index ? (
 <input
 type="text"
 value={editingHeaderName}
 onChange={(e) => setEditingHeaderName(e.target.value)}
 onBlur={handleCommitHeaderEdit}
 onClick={(e) => e.stopPropagation()}
 onKeyDown={(e) => {
 if (e.key === 'Enter') handleCommitHeaderEdit();
 if (e.key === 'Escape') handleCancelHeaderEdit();
 }}
 className="w-full bg-transparent focus:outline-none border border-primary rounded-md px-2 py-1 text-sm"
 autoFocus
 />
 ) : (
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm font-medium select-none truncate">
 {header.header}
 </span>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleStartEditingHeader(index);
 }}
 className="p-1 hover:bg-accent rounded-md transition-colors text-muted-foreground hover:text-foreground"
 >
 <Edit2 className="w-3 h-3" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleDeleteHeader(header);
 }}
 className="p-1 hover:bg-destructive/10 rounded-md transition-colors text-muted-foreground hover:text-destructive"
 >
 <Trash2 className="w-3 h-3" />
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 {customHeaders.length === 0 && (
 <div className="text-sm text-muted-foreground">
 Add your first header to get started.
 </div>
 )}
 </div>
 </div>

 {/* Customizables Section */}
 {selectedHeader && (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg font-semibold">
 Customizables for "{selectedHeader.header}"
 </h3>
 <p className="text-sm text-muted-foreground">
 Manage customizables under this header
 </p>
 </div>
 <Button onClick={handleAddCustomizable} className="gap-2">
 <Plus className="w-4 h-4" /> Add Customizable
 </Button>
 </div>

 <div className="rounded-lg border border-border overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted/50">
 <tr>
 <th className="text-left p-4 text-sm font-medium">Image</th>
 <th className="text-left p-4 text-sm font-medium">Name</th>
 <th className="text-left p-4 text-sm font-medium">Description</th>
 <th className="text-right p-4 text-sm font-medium">Price</th>
 <th className="text-center p-4 text-sm font-medium">Available</th>
 <th className="text-right p-4 text-sm font-medium">Actions</th>
 </tr>
 </thead>
 <tbody>
 {customizables.length > 0 ? (
 customizables.map((customizable) => (
 <tr
 key={customizable.id}
 className="border-t border-border hover:bg-muted/30 transition-colors"
 >
 <td className="p-4">
 <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden border border-border">
 {customizable.image ? (
 <img
 src={getImageUrl(customizable.image) || ''}
 alt={customizable.name}
 className="w-full h-full object-cover"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.style.display = 'none';
 target.parentElement!.innerHTML = '<span class="text-[8px] text-muted-foreground p-0.5 text-center">No Image</span>';
 }}
 />
 ) : (
 <span className="text-[8px] text-muted-foreground">No Image</span>
 )}
 </div>
 </td>
 <td className="p-4 font-medium">{customizable.name}</td>
 <td className="p-4 text-sm text-muted-foreground">
 {customizable.description || '-'}
 </td>
 <td className="p-4 text-right font-semibold">
 ${Number(customizable.price).toFixed(2)}
 </td>
 <td className="p-4 text-center">
 <span className="text-sm">
 {customizable.is_available ? 'Yes' : 'No'}
 </span>
 </td>
 <td className="p-4">
 <div className="flex items-center justify-end gap-2">
 <button
 onClick={() => handleEditCustomizable(customizable)}
 className="p-2 hover:bg-accent rounded-lg transition-colors text-foreground"
 title="Edit Customizable"
 >
 <Edit2 className="w-4 h-4" />
 </button>
 <button
 onClick={() => handleDeleteCustomizable(customizable.id!)}
 className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
 title="Delete Customizable"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </td>
 </tr>
 ))
 ) : (
 <tr>
 <td colSpan={5} className="p-8 text-center text-muted-foreground">
 No customizables found. Add your first customizable above.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </div>
 </>
 )}
 </AnimatePresence>

 {/* Add/Edit Menu Item Modal */}
 <AddMenuItemModal
 isOpen={showAddItemModal}
 onClose={handleCloseModal}
 categories={categories}
 onSubmit={handleAddMenuItem}
 item={editingItem}
 />

 {/* Add/Edit Customizable Modal */}
 <AddCustomizableModal
 isOpen={showAddCustomizableModal}
 onClose={handleCloseCustomizableModal}
 headers={customHeaders}
 selectedHeaderId={selectedHeader?.id || null}
 onSubmit={handleSubmitCustomizable}
 item={editingCustomizable}
 />

 <LinkDishToOptionsModal
 isOpen={showLinkOptionsModal}
 onClose={() => setShowLinkOptionsModal(false)}
 products={menuItems}
 categories={categories}
 selectedCategory={selectedCategory}
 onCategoryChange={(category) => setSelectedCategory(category)}
 onLinksUpdated={async () => {
 if (selectedCategory) {
 await handleFetchProductsByCategory(selectedCategory);
 }
 }}
 isProductsLoading={isProductsLoading}
 />
 </div>
 );
}
