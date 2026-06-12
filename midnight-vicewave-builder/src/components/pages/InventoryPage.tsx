import React, { useState, useEffect } from "react";
import { InfoIcon, MoreHorizontal, Plus, Trash2, Edit, MoreVertical, Search, Filter, Loader2, Package, FileText, Bell, TrendingUp, DollarSign, BarChart3, History, ArrowLeft, Calendar, AlertTriangle, ArrowRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { getAllProducts, getAllCustomizables, getAllRawItems, updateProductInventory, updateCustomizableInventory, getSuppliers, addRawItem, updateRawItem, getProductRecipe, getCustomRecipe, getInventoryLedger, getSalesAnalytics } from "@/api/features";
import AddTransformableModal from "./AddTransformableModal";
import RecipeManagerModal from "./RecipeManagerModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { useNavigate } from "react-router-dom";
import { RawItem, Supplier, RecipeItemProduct, RecipeItemCustomizable, InventoryLedger as LedgerType, LedgerMovement } from "@/api/models";
import { format } from "date-fns";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CapacityIndicator({ percentage }: { percentage: number }) {
  const getColor = (index: number) => {
    if (percentage >= 80) {
      return index < 3 ? "bg-emerald-500" : index < 5 ? "bg-emerald-300" : index < 7 ? "bg-yellow-400" : "bg-red-400";
    } else if (percentage >= 60) {
      return index < 2 ? "bg-emerald-500" : index < 4 ? "bg-emerald-300" : index < 6 ? "bg-yellow-400" : "bg-red-400";
    } else if (percentage >= 40) {
      return index < 1 ? "bg-emerald-500" : index < 3 ? "bg-emerald-300" : index < 5 ? "bg-yellow-400" : "bg-red-400";
    } else {
      return index < 2 ? "bg-yellow-400" : "bg-red-400";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-[2px] justify-center">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`h-[3px] w-6 rounded-sm transition-colors ${getColor(i)}`} />
        ))}
      </div>
      <div className={`text-xs font-medium ${percentage >= 60 ? "text-emerald-600" :
        percentage >= 40 ? "text-yellow-600" :
          "text-red-600"
        }`}>
        {percentage}%
      </div>
    </div>
  );
}

function CategoryTab({ title, percentage, showPercentage = true }: { title: string; percentage: number; showPercentage?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      {showPercentage && <span className="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
        {percentage}%
      </span>}
    </div>
  );
}

function ItemCard({
  name,
  percentage,
  description,
  price,
  pricingType,
  isAvailable,
  onClick,
  isSelected,
  showStockInfo
}: {
  name: string;
  percentage: number;
  description?: string;
  price?: number;
  pricingType?: string;
  isAvailable?: boolean;
  onClick: () => void;
  isSelected: boolean;
  showStockInfo?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card
        className={cn(
          "glass border transition-all duration-300 hover:shadow-xl cursor-pointer h-full",
          "bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-xl",
          isSelected ? "ring-2 ring-foreground border-border shadow-lg " : "hover:border-border border-border/50"
        )}
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1.5 flex-1 pr-2">
              <h3 className="font-semibold text-base text-foreground leading-tight">{name}</h3>
              {description && (
                <p className="text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">{description}</p>
              )}
            </div>
            {showStockInfo !== false && <CapacityIndicator percentage={percentage} />}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            {showStockInfo !== false ? <div className="bg-gradient-to-r from-muted/60 to-muted/40 px-3 py-1.5 rounded-lg border border-border/40">
              <span className="text-sm font-bold text-foreground">{percentage}%</span>
            </div> : <div></div>}
            <div className="flex flex-col items-end gap-1.5">
              {typeof isAvailable !== 'undefined' && (
                <Badge variant={isAvailable ? "default" : "destructive"} className="text-xs shadow-sm">
                  {isAvailable ? "Available" : "Unavailable"}
                </Badge>
              )}
              {price && (
                <div className="text-sm font-semibold text-foreground">
                  {pricingType === 'fixed' ? `₵${Number(price).toFixed(2)}` : `+₵${Number(price).toFixed(2)}`}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function OverallCard() {
  return (
    <Card className="glass ">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground">Overall Inventory</span>
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More options</span>
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-5xl font-bold text-foreground">82%</div>
          <CapacityIndicator percentage={82} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  // -- New states for Detail View --
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [movementTypeFilter, setMovementTypeFilter] = useState('all');
  // --------------------------------
  const [tabData, setTabData] = useState({
    products: { items: [], percentage: 0 },
    customs: { items: [], percentage: 0 },
    rawitems: { items: [], percentage: 0 }
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isUpdatingAlerts, setIsUpdatingAlerts] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    self_required_quantity: '',
    self_quantity_in_stock: '',
    // Raw item specific fields
    quantity_in_stock: '',
    unit_batch_quantity: '',
    reorder_level: ''
  });
  const [savingInventory, setSavingInventory] = useState(false);
  const [showAddTransformableModal, setShowAddTransformableModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [rawItemsList, setRawItemsList] = useState<RawItem[]>([]);
  const [recipeItems, setRecipeItems] = useState<(RecipeItemProduct | RecipeItemCustomizable)[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const navigate = useNavigate();

  const calculatePercentage = (item: any, itemType?: string) => {
    // For raw items, use different calculation based on quantity_in_stock and reorder_level
    if (itemType === 'rawitems' || item.quantity_in_stock !== undefined) {
      const inStock = item.quantity_in_stock || 0;
      const reorderLevel = item.reorder_level || 0;

      // If no reorder level set, return 0
      if (reorderLevel <= 0) return 0;

      // Calculate percentage: how much stock we have relative to reorder level
      // If stock is at reorder level = 0%, if stock is 2x reorder level = 100%
      const percentage = Math.min(100, Math.round((inStock / (reorderLevel * 2)) * 100));
      return percentage;
    }

    // For products and customs, use self_quantity_in_stock and self_required_quantity
    const inStock = item.self_quantity_in_stock || 0;
    const required = item.self_required_quantity || 0;

    if (!required || required <= 0) return 0;

    // Calculate what percentage of required quantity is in stock
    const percentage = Math.min(100, Math.round((inStock / required) * 100));
    return percentage;
  };

  const fetchTabData = async (tabId: string) => {
    setIsLoading(true);
    setSelectedItem(null);

    try {
      let items: any[] = [];

      // Fetch data based on tab
      if (tabId === "products") {
        items = await getAllProducts() || [];
      } else if (tabId === "customs") {
        items = await getAllCustomizables() || [];
      } else if (tabId === "rawitems") {
        items = await getAllRawItems() || [];
      }

      // Calculate percentage for each item and format data
      const formattedItems = items.map((item: any) => {
        const percentage = calculatePercentage(item, tabId);
        return {
          ...item,
          percentage,
          id: item.id,
          itemType: tabId,
          inventoryMode: 'batch' // Default mode, can be updated based on item data
        };
      });

      // Calculate average percentage for the tab
      const averagePercentage = formattedItems.length > 0
        ? Math.round(formattedItems.reduce((sum: number, item: any) => sum + item.percentage, 0) / formattedItems.length)
        : 0;

      setTabData(prev => ({
        ...prev,
        [tabId]: { items: formattedItems, percentage: averagePercentage }
      }));

    } catch (error) {
      console.error(`Error fetching ${tabId}:`, error);
      setTabData(prev => ({
        ...prev,
        [tabId]: { items: [], percentage: 0 }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemUpdate = (updatedItem: any) => {
    setTabData(prev => {
      const newTabData = { ...prev };
      const items = newTabData[activeTab].items.map((item: any) => {
        if (item.id === updatedItem.id) {
          const percentage = calculatePercentage(updatedItem, activeTab);
          return {
            ...item,
            ...updatedItem,
            percentage
          };
        }
        return item;
      });

      newTabData[activeTab].items = items;
      newTabData[activeTab].percentage = items.length > 0
        ? Math.round(items.reduce((sum: number, item: any) => sum + item.percentage, 0) / items.length)
        : 0;

      return newTabData;
    });

    setSelectedItem(prev => {
      if (prev?.id === updatedItem.id) {
        const percentage = calculatePercentage(updatedItem, activeTab);
        return {
          ...prev,
          ...updatedItem,
          percentage
        };
      }
      return prev;
    });
  };

  const handleTabChange = (newTab: string) => {
    setSelectedItem(null);
    setSearchQuery("");
    setActiveTab(newTab);
    fetchTabData(newTab);
  };

  const fetchRecipeForItem = async (item: any) => {
    if (item.itemType === 'rawitems') {
      setRecipeItems([]);
      return;
    }

    setLoadingRecipe(true);
    try {
      if (item.itemType === 'products') {
        const recipe = await getProductRecipe(item.id);
        setRecipeItems(recipe || []);
      } else if (item.itemType === 'customs') {
        const recipe = await getCustomRecipe(item.id);
        setRecipeItems(recipe || []);
      }
    } catch (error) {
      console.error('Failed to fetch recipe:', error);
      setRecipeItems([]);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleItemSelect = (item: any) => {
    if (selectedItem?.id === item.id) {
      setSelectedItem(null);
      setEditingInventory(false);
      setRecipeItems([]);
      return;
    }

    setSelectedItem(item);
    setEditingInventory(false);
    setEditingInventory(false);

    // Fetch recipe for products and customs
    fetchRecipeForItem(item);

    // Set form based on item type
    if (item.itemType === 'rawitems' || item.quantity_in_stock !== undefined) {
      setInventoryForm({
        self_required_quantity: '',
        self_quantity_in_stock: '',
        quantity_in_stock: item.quantity_in_stock?.toString() || '',
        unit_batch_quantity: item.unit_batch_quantity?.toString() || '',
        reorder_level: item.reorder_level?.toString() || ''
      });
    } else {
      setInventoryForm({
        self_required_quantity: item.self_required_quantity?.toString() || '',
        self_quantity_in_stock: item.self_quantity_in_stock?.toString() || '',
        quantity_in_stock: '',
        unit_batch_quantity: '',
        reorder_level: ''
      });
    }
  };

  const fetchItemDetails = async () => {
    if (!selectedItem) {
      setLedgerData(null);
      setSalesData(null);
      return;
    }

    setLoadingDetails(true);
    try {
      // Fetch Ledger
      const typeMap: Record<string, 'PRODUCT' | 'CUSTOM' | 'RAW' | 'MAIN_STORE_RAW'> = {
        'products': 'PRODUCT',
        'customs': 'CUSTOM',
        'rawitems': 'RAW',
        'mainstorerawitems': 'MAIN_STORE_RAW'
      };

      const lData = await getInventoryLedger({
        item_id: selectedItem.id,
        item_type: typeMap[selectedItem.itemType],
        startDate,
        endDate
      });
      setLedgerData(lData);

      // Fetch Sales Analytics if not a raw item
      if (selectedItem.itemType !== 'rawitems') {
        const sData = await getSalesAnalytics({ startDate, endDate });
        const itemSales = (sData || []).find((s: any) =>
          s.id === selectedItem.id &&
          s.type.toLowerCase() === (selectedItem.itemType === 'products' ? 'product' : 'custom')
        );
        setSalesData(itemSales || { quantity: 0, revenue: 0 });
      } else {
        setSalesData({ quantity: 0, revenue: 0 }); // Raw items don't have direct sales analytics
      }

    } catch (error) {
      console.error('Failed to fetch item details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchItemDetails();
  }, [selectedItem, startDate, endDate]);

  const getMovementColor = (change: number) => {
    if (change > 0) return "text-emerald-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const handleStartEditInventory = () => {
    setEditingInventory(true);
    if (selectedItem?.itemType === 'rawitems' || selectedItem?.quantity_in_stock !== undefined) {
      setInventoryForm({
        self_required_quantity: '',
        self_quantity_in_stock: '',
        quantity_in_stock: selectedItem.quantity_in_stock?.toString() || '',
        unit_batch_quantity: selectedItem.unit_batch_quantity?.toString() || '',
        reorder_level: selectedItem.reorder_level?.toString() || ''
      });
    } else {
      setInventoryForm({
        self_required_quantity: selectedItem.self_required_quantity?.toString() || '',
        self_quantity_in_stock: selectedItem.self_quantity_in_stock?.toString() || '',
        quantity_in_stock: '',
        unit_batch_quantity: '',
        reorder_level: ''
      });
    }
  };

  const handleCancelEditInventory = () => {
    setEditingInventory(false);
    if (selectedItem?.itemType === 'rawitems' || selectedItem?.quantity_in_stock !== undefined) {
      setInventoryForm({
        self_required_quantity: '',
        self_quantity_in_stock: '',
        quantity_in_stock: selectedItem.quantity_in_stock?.toString() || '',
        unit_batch_quantity: selectedItem.unit_batch_quantity?.toString() || '',
        reorder_level: selectedItem.reorder_level?.toString() || ''
      });
    } else {
      setInventoryForm({
        self_required_quantity: selectedItem.self_required_quantity?.toString() || '',
        self_quantity_in_stock: selectedItem.self_quantity_in_stock?.toString() || '',
        quantity_in_stock: '',
        unit_batch_quantity: '',
        reorder_level: ''
      });
    }
  };

  const handleSaveInventory = async () => {
    if (!selectedItem?.id) return;

    setSavingInventory(true);
    try {
      // Handle raw items differently
      if (activeTab === 'rawitems' || selectedItem.itemType === 'rawitems' || selectedItem.quantity_in_stock !== undefined) {
        const quantityInStock = inventoryForm.quantity_in_stock ? parseInt(inventoryForm.quantity_in_stock) : undefined;
        const unitBatchQty = inventoryForm.unit_batch_quantity ? parseFloat(inventoryForm.unit_batch_quantity) : undefined;
        const reorderLevel = inventoryForm.reorder_level ? parseInt(inventoryForm.reorder_level) : undefined;

        await updateRawItem(selectedItem.id, {
          quantity_in_stock: quantityInStock,
          unit_batch_quantity: unitBatchQty,
          reorder_level: reorderLevel
        });

        // Update the selected item and tab data
        const updatedItem = {
          ...selectedItem,
          quantity_in_stock: quantityInStock,
          unit_batch_quantity: unitBatchQty,
          reorder_level: reorderLevel
        };
        const percentage = calculatePercentage(updatedItem, 'rawitems');
        updatedItem.percentage = percentage;

        setSelectedItem(updatedItem);
        handleItemUpdate(updatedItem);
        setEditingInventory(false);

        // Refresh the tab data
        await fetchTabData(activeTab);
      } else {
        // Handle products and customs
        const requiredQty = inventoryForm.self_required_quantity ? parseFloat(inventoryForm.self_required_quantity) : undefined;
        const stockQty = inventoryForm.self_quantity_in_stock ? parseFloat(inventoryForm.self_quantity_in_stock) : undefined;

        // Determine which endpoint to use based on the active tab
        if (activeTab === 'products') {
          await updateProductInventory(selectedItem.id, requiredQty, stockQty);
        } else if (activeTab === 'customs') {
          await updateCustomizableInventory(selectedItem.id, requiredQty, stockQty);
        }

        // Update the selected item and tab data
        const updatedItem = {
          ...selectedItem,
          self_required_quantity: requiredQty,
          self_quantity_in_stock: stockQty
        };
        const percentage = calculatePercentage(updatedItem, activeTab);
        updatedItem.percentage = percentage;

        setSelectedItem(updatedItem);
        handleItemUpdate(updatedItem);
        setEditingInventory(false);

        // Refresh the tab data
        await fetchTabData(activeTab);
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
    } finally {
      setSavingInventory(false);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
    fetchSuppliers();
    fetchRawItems();
  }, []);

  const fetchRawItems = async () => {
    try {
      const data = await getAllRawItems();
      setRawItemsList(data || []);
    } catch (error) {
      console.error("Failed to fetch raw items:", error);
      setRawItemsList([]);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data || []);
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
      setSuppliers([]);
    }
  };

  const handleToggleAlerts = async (enabled: boolean) => {
    if (!selectedItem) return;

    setIsUpdatingAlerts(true);
    try {
      if (selectedItem.itemType === 'products') {
        await updateProductInventory(selectedItem.id, undefined, undefined, enabled);
      } else if (selectedItem.itemType === 'customs') {
        await updateCustomizableInventory(selectedItem.id, undefined, undefined, enabled);
      } else if (selectedItem.itemType === 'rawitems') {
        await updateRawItem(selectedItem.id, { should_read_alerts: enabled });
      }

      const updatedItem = { ...selectedItem, should_read_alerts: enabled };
      setSelectedItem(updatedItem);
      handleItemUpdate(updatedItem);

      toast({
        title: enabled ? "Alerts Enabled" : "Alerts Disabled",
        description: `Notifications for ${selectedItem.name} have been ${enabled ? 'turned on' : 'turned off'}.`,
      });
    } catch (error) {
      console.error("Failed to toggle alerts:", error);
      toast({
        title: "Error",
        description: "Failed to update alert preferences",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingAlerts(false);
    }
  };

  const handleAddTransformable = async (formData: RawItem) => {
    try {
      await addRawItem(formData);
      // Refresh raw items tab
      if (activeTab === 'rawitems') {
        await fetchTabData('rawitems');
      }
      setShowAddTransformableModal(false);
    } catch (error) {
      console.error("Failed to add raw item:", error);
      // You might want to show a toast notification here
    }
  };

  const filteredItems = tabData[activeTab]?.items.filter((item: any) => {
    if (!searchQuery) return true;
    const itemName = (item?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return itemName.includes(query);
  });

  const categories = [
    {
      id: "products",
      title: "Products",
      description: "Regular menu items and products"
    },
    {
      id: "customs",
      title: "Customs",
      description: "Customizable add-ons and choices"
    },
    {
      id: "rawitems",
      title: "Raw Items",
      description: "Stock items that can be transformed into products"
    }
  ];

  return (
    <div className="min-h-full w-full">
      <AnimatePresence mode="wait">
        {!selectedItem ? (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* Header */}
            <header className="glass border-b shadow-sm">
              <div className="px-8 py-5 flex justify-between items-center">
                <div>
                  <h1 className="text-4xl md:text-5xl font-vicewave mb-3 text-foregrounden tracking-tight">Restaurant Inventory</h1>
                  <p className="text-muted-foreground font-futuristic text-lg">Manage your inventory items, stock levels, and relationships</p>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 hover:bg-muted/50 transition-colors border-border hover:border-border"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 15 15"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                  >
                    <path
                      d="M1.90321 7.29677C1.90321 10.341 4.11041 12.4147 6.58893 12.8439C6.87255 12.893 7.06266 13.1627 7.01355 13.4464C6.96444 13.73 6.69471 13.9201 6.41109 13.871C3.49942 13.3668 0.86084 10.9127 0.86084 7.29677C0.860839 5.76009 1.55996 4.55245 2.37639 3.63377C2.96124 2.97568 3.63034 2.44135 4.16846 2.03202L2.53205 2.03202C2.25591 2.03202 2.03205 1.80816 2.03205 1.53202C2.03205 1.25588 2.25591 1.03202 2.53205 1.03202L5.53205 1.03202C5.80819 1.03202 6.03205 1.25588 6.03205 1.53202L6.03205 4.53202C6.03205 4.80816 5.80819 5.03202 5.53205 5.03202C5.25591 5.03202 5.03205 4.80816 5.03205 4.53202L5.03205 2.68645L5.03054 2.68759L5.03045 2.68766L5.03044 2.68767L5.03043 2.68767C4.45896 3.11868 3.76059 3.68693 3.15554 4.37353C2.45221 5.16162 1.90321 6.16926 1.90321 7.29677ZM13.0109 7.70321C13.0109 4.69115 10.8505 2.6296 8.40384 2.17029C8.12093 2.11718 7.93465 1.84479 7.98776 1.56188C8.04087 1.27898 8.31326 1.0927 8.59616 1.14581C11.4704 1.68541 14.0532 4.12605 14.0532 7.70321C14.0532 9.23988 13.3541 10.4475 12.5377 11.3662C11.9528 12.0243 11.2837 12.5586 10.7456 12.968L12.3821 12.968C12.6582 12.968 12.8821 13.1918 12.8821 13.468C12.8821 13.7441 12.6582 13.968 12.3821 13.968L9.38205 13.968C9.10591 13.968 8.88205 13.7441 8.88205 13.468L8.88205 10.468C8.88205 10.1918 9.10591 9.96796 9.38205 9.96796C9.65819 9.96796 9.88205 10.1918 9.88205 10.468L9.88205 12.3135L9.88362 12.3123C10.4551 11.8813 11.1535 11.3131 11.7585 10.6264C12.4619 9.83835 13.0109 8.83071 13.0109 7.70321Z"
                      fill="currentColor"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sync Customizations
                </Button>
              </div>
            </header>

            {/* Main Content */}
            <div className="py-6">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="">
                <div className="glass py-4 mb-6 rounded-lg border-b shadow-md">
                  <div className="flex items-center justify-between px-4 py-2">
                    <TabsList className="w-full flex bg-transparent p-0 justify-start">
                      {categories.map((category) => (
                        <TabsTrigger
                          key={category.id}
                          value={category.id}
                          className={cn(
                            "data-[state=active]:bg-muted data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-border rounded-md data-[state=active]:border-border mx-2 px-6 py-3",
                            "text-base transition-all "
                          )}
                        >
                          <div className="flex flex-col items-start">
                            <CategoryTab
                              title={category.title}
                              percentage={tabData[category.id].percentage}
                              showPercentage={category.id === 'rawitems'}
                            />
                            <span className="text-xs text-muted-foreground mt-1">{category.description}</span>
                          </div>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 w-full bg-muted/50 border-border focus:bg-background"
                      />
                    </div>
                  </div>
                </div>

                {categories.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className="px-8 animate-in fade-in-50 data-[state=active]:animate-in"
                  >
                    {/* Add Raw Item Button - Always visible for raw items tab */}
                    {category.id === 'rawitems' && !isLoading && (
                      <div className="flex justify-end mb-6">
                        <Button
                          variant="default"
                          size="lg"
                          className="flex items-center gap-2 bg-[#00d9ff] text-white hover:bg-[#00c4e6] font-semibold border-2 border-[#00d9ff] shadow-lg shadow-[#00d9ff]/30"
                          onClick={() => setShowAddTransformableModal(true)}
                        >
                          <Plus className="h-5 w-5" />
                          Add Raw Item
                        </Button>
                      </div>
                    )}

                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
                        <div className="text-lg text-muted-foreground">Loading {category.title.toLowerCase()}...</div>
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 gap-3">
                        <div className="text-lg text-muted-foreground">No {category.title.toLowerCase()} found</div>
                        {searchQuery && (
                          <div className="text-sm text-muted-foreground">Try adjusting your search query</div>
                        )}
                        {category.id === 'rawitems' && !searchQuery && (
                          <Button
                            variant="outline"
                            size="lg"
                            className="mt-4 flex items-center gap-2 border-border hover:border-border"
                            onClick={() => setShowAddTransformableModal(true)}
                          >
                            <Plus className="h-5 w-5" />
                            Add Your First Raw Item
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {filteredItems.map((item: any) => (
                          <ItemCard
                            key={item.id}
                            name={item.name}
                            percentage={item.percentage}
                            description={item.description}
                            price={item.price}
                            pricingType={item.pricing_type}
                            isAvailable={item.is_available}
                            onClick={() => handleItemSelect(item)}
                            isSelected={selectedItem?.id === item.id}
                            showStockInfo={category.id === 'rawitems'}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </motion.div >
        ) : (
          <motion.div
            key="breakdown-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-8 space-y-6 pb-8 min-h-screen"
          >
            {/* Header Area with Back Button */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedItem(null)}
                className="hover:text-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-vicewave mb-2 text-foregrounden tracking-tight">
                  {selectedItem.name}
                </h1>
                <p className="text-muted-foreground font-futuristic">
                  Detailed inventory and performance breakdown
                </p>
              </div>
            </div>

            <div className="relative">
              {loadingDetails && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/20 backdrop-blur-[2px] rounded-xl">
                  <Loader2 className="h-10 w-10 animate-spin text-foreground" />
                </div>
              )}

              <div className={cn("space-y-8 max-w-6xl mx-auto transition-opacity duration-300", loadingDetails && "opacity-50 pointer-events-none")}>

                {/* ROW 1: Header Identity & Toggles */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn(
                      "font-bold uppercase tracking-widest px-3 py-1",
                      selectedItem.itemType === 'products' ? "border-border text-foreground" :
                        selectedItem.itemType === 'customs' ? "border-border text-foreground" :
                          "border-amber-500 text-amber-500"
                    )}>
                      {selectedItem.itemType}
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/50">Active</Badge>
                  </div>
                  {selectedItem.itemType === 'rawitems' && (
                    <div className="flex bg-muted/30 px-4 py-2 rounded-full border border-border items-center justify-center">
                      <Switch
                        id="alert-toggle-inline"
                        checked={selectedItem?.should_read_alerts ?? true}
                        onCheckedChange={handleToggleAlerts}
                        disabled={isUpdatingAlerts}
                        className="mr-2"
                      />
                      <Label htmlFor="alert-toggle-inline" className="font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2">
                        {isUpdatingAlerts ? (
                          <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                        ) : (
                          <Bell className={cn("h-4 w-4", selectedItem?.should_read_alerts ? "text-foreground" : "text-muted-foreground")} />
                        )}
                        <span>{selectedItem?.should_read_alerts ? 'Alerts On' : 'Alerts Off'}</span>
                      </Label>
                    </div>
                  )}
                </motion.div>

                {/* ROW 2: Essential Metrics (At a Glance) */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedItem.itemType === 'rawitems' && (
                    <>
                      <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent">
                        <CardContent className="p-5 flex flex-col justify-center h-full">
                          <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Current Stock</p>
                          <div className="flex items-end gap-3">
                            <span className="text-4xl font-bold font-vicewave text-foreground leading-none">
                              {selectedItem.quantity_in_stock || 0}
                            </span>
                            <div className="pb-1"><CapacityIndicator percentage={selectedItem.percentage} /></div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass border-border/50">
                        <CardContent className="p-5 flex flex-col justify-center h-full">
                          <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Reorder Level</p>
                          <p className="text-3xl font-bold font-vicewave leading-none">{selectedItem.reorder_level || 0}</p>
                          <p className="text-xs text-muted-foreground mt-2 uppercase">{selectedItem.unit || 'PIECES'}</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {selectedItem.itemType !== 'rawitems' ? (
                    <>
                      <Card className="glass border-border/50">
                        <CardContent className="p-5 flex flex-col justify-center h-full">
                          <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Unit Price</p>
                          <p className="text-3xl font-bold font-vicewave text-foreground leading-none">₵{Number(selectedItem.price || 0).toFixed(2)}</p>
                        </CardContent>
                      </Card>
                      {salesData && (
                        <>
                          <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent">
                            <CardContent className="p-5 flex flex-col justify-center h-full">
                              <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Period Quantity</p>
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-foreground" />
                                <p className="text-3xl font-bold font-vicewave text-foreground leading-none">
                                  {salesData.quantity || 0}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 uppercase">Units Sold</p>
                            </CardContent>
                          </Card>
                          <Card className="glass border-border bg-gradient-to-br from-muted/50 to-transparent">
                            <CardContent className="p-5 flex flex-col justify-center h-full">
                              <p className="text-sm font-futuristic text-muted-foreground uppercase tracking-widest mb-2">Period Revenue</p>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-foreground" />
                                <p className="text-3xl font-bold font-vicewave text-foreground leading-none">
                                  ₵{Number(salesData.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 uppercase">GHC</p>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="col-span-2 hidden lg:block"></div> /* Empty space for Raw Items layout balance */
                  )}
                </motion.div>


                {/* ROW 3: Quick Action Bar & Settings Inline */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/50 backdrop-blur-md">
                    {selectedItem.itemType === 'rawitems' && (
                      <>
                        <Button
                          onClick={() => setShowAdjustmentModal(true)}
                          className="bg-[#00d9ff] text-black hover:bg-[#00c4e6] font-bold shadow-lg shadow-[#00d9ff]/20"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Adjust Stock
                        </Button>
                        <Button variant={editingInventory ? "secondary" : "outline"} onClick={handleStartEditInventory} className="border-border hover:bg-muted group">
                          <Edit className="w-4 h-4 mr-2 group-hover:text-foreground transition-colors" /> {editingInventory ? 'Cancel Edit' : 'Edit Constraints'}
                        </Button>
                      </>
                    )}
                    {/* {selectedItem.itemType !== 'rawitems' && (
                      //<Button variant="outline" onClick={() => setShowRecipeModal(true)} className="border-border hover:bg-muted group ml-auto">
                        ///<Package className="w-4 h-4 mr-2 group-hover:text-foreground transition-colors" /> Manage Recipe ({recipeItems.length})
                      //</Button>
                    )} */}
                  </div>

                  {/* Expandable Top-Level Inline Edit Form */}
                  <AnimatePresence>
                    {editingInventory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <Card className="glass border-border border-t-2 shadow-lg">
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                              {selectedItem.itemType === 'rawitems' ? (
                                <>
                                  <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Quantity in Stock</Label>
                                    <Input type="number" value={inventoryForm.quantity_in_stock} readOnly className="mt-2 bg-muted/50 font-mono text-lg" />
                                  </div>
                                  <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Unit Batch Qty</Label>
                                    <Input type="number" value={inventoryForm.unit_batch_quantity} onChange={e => setInventoryForm(p => ({ ...p, unit_batch_quantity: e.target.value }))} className="mt-2 font-mono text-lg" />
                                  </div>
                                  <div>
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Reorder Level</Label>
                                    <Input type="number" value={inventoryForm.reorder_level} onChange={e => setInventoryForm(p => ({ ...p, reorder_level: e.target.value }))} className="mt-2 font-mono text-lg" />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="col-span-2 md:col-span-1">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Quantity in Stock</Label>
                                    <Input type="number" value={inventoryForm.self_quantity_in_stock} readOnly className="mt-2 bg-muted/50 font-mono text-lg" />
                                  </div>
                                  <div className="col-span-2 md:col-span-2">
                                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Required Quantity for Production</Label>
                                    <Input type="number" step="0.01" value={inventoryForm.self_required_quantity} onChange={e => setInventoryForm(p => ({ ...p, self_required_quantity: e.target.value }))} className="mt-2 font-mono text-lg border-border focus-visible:ring-foreground" />
                                  </div>
                                </>
                              )}
                              <div className="flex gap-3 md:col-span-1">
                                <Button size="lg" variant="ghost" onClick={handleCancelEditInventory} className="flex-1 border border-border/50">Cancel</Button>
                                <Button size="lg" onClick={handleSaveInventory} disabled={savingInventory} className="flex-1 bg-muted text-black hover:bg-cyan-400 font-bold shadow-md ">
                                  {savingInventory ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ROW 4: Full-width Stock Ledger */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-4">

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/50 pb-4">
                    <div>
                      <h3 className="font-vicewave text-3xl tracking-wide flex items-center gap-3 text-foreground">
                        <History className="w-7 h-7 text-foreground" /> Ledger History
                      </h3>
                      <p className="text-muted-foreground font-futuristic mt-1 ml-10">Comprehensive stock movement tracking</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-3 w-full sm:w-auto bg-muted/10 p-1.5 rounded-xl border border-border/30">
                        <div className="relative flex-1 sm:w-44">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50 hover:border-foreground/30 focus-visible:ring-foreground h-10 text-xs font-mono transition-all"
                          />
                        </div>
                        <span className="text-muted-foreground/40 text-[10px] uppercase font-bold tracking-tighter">to</span>
                        <div className="relative flex-1 sm:w-44">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-9 bg-background/50 border-border/50 hover:border-foreground/30 focus-visible:ring-foreground h-10 text-xs font-mono transition-all"
                          />
                        </div>
                      </div>

                      <select
                        value={movementTypeFilter}
                        onChange={(e) => setMovementTypeFilter(e.target.value)}
                        className="bg-muted/50 border border-border/50 hover:border-border transition-colors text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none cursor-pointer h-[42px] appearance-none pr-8 relative z-10 font-medium w-full sm:w-auto"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                      >
                        <option value="all">All Movements</option>
                        <option value="Sale">🔴 Sales</option>
                        <option value="Purchase">🟢 Purchases</option>
                        <option value="Disbursement">🚛 Disbursements</option>
                        <option value="Spoilage">🚮 Spoilage / Wastage</option>
                        <option value="Adjustment">🔵 Manual Adjustments</option>
                        <option value="Correction">⚙️ System Corrections</option>
                      </select>
                    </div>
                  </div>

                  {/* Period Stats Summary - Only for Raw Items as requested */}
                  {selectedItem.itemType === 'rawitems' && ledgerData && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-xl border p-4 flex flex-col md:flex-row items-center justify-between shadow-lg mb-4",
                        (ledgerData.discrepancy || 0) === 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        {(ledgerData.discrepancy || 0) === 0 ? (
                          <div className="p-2 bg-emerald-500/20 rounded-full">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="p-2 bg-red-500/20 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-lg">Status Reconciliation</h3>
                          <p className="text-xs text-muted-foreground">
                            Comparing LIVE stock vs. Historical ledger movements.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-muted-foreground text-[10px] uppercase font-bold">System Says</p>
                          <p className="font-bold text-lg">{ledgerData.current_actual_stock?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground text-[10px] uppercase font-bold">History Says</p>
                          <p className="font-bold text-lg">{ledgerData.current_theoretical_stock?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="text-center px-4 py-1 rounded bg-black/20">
                          <p className="text-muted-foreground text-[10px] uppercase font-bold">Discrepancy</p>
                          <p className={cn("font-bold text-xl", (ledgerData.discrepancy || 0) !== 0 ? "text-red-500" : "text-emerald-500")}>
                            {(ledgerData.discrepancy || 0) > 0 ? '+' : ''}{(ledgerData.discrepancy || 0)?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {selectedItem.itemType === 'rawitems' && ledgerData && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <Card className="glass border-border bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-futuristic text-blue-400 uppercase tracking-widest mb-1">Opening Stock</p>
                            <p className="text-2xl font-bold font-mono">{ledgerData.period_opening_stock?.toFixed(2) || '0.00'}</p>
                          </div>
                          <History className="w-6 h-6 text-blue-400/50" />
                        </CardContent>
                      </Card>
                      <Card className="glass border-border bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-futuristic text-emerald-400 uppercase tracking-widest mb-1">Closing Stock</p>
                            <p className="text-2xl font-bold font-mono">{ledgerData.period_closing_stock?.toFixed(2) || '0.00'}</p>
                          </div>
                          <Package className="w-6 h-6 text-emerald-400/50" />
                        </CardContent>
                      </Card>
                      <Card className="glass border-border bg-purple-500/5 hover:bg-purple-500/10 transition-colors hidden lg:block">
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] font-futuristic text-purple-400 uppercase tracking-widest mb-1">Net Change</p>
                            <p className={cn("text-2xl font-bold font-mono", (ledgerData.period_closing_stock - ledgerData.period_opening_stock) >= 0 ? "text-emerald-500" : "text-red-500")}>
                              {(ledgerData.period_closing_stock - ledgerData.period_opening_stock) > 0 ? '+' : ''}
                              {(ledgerData.period_closing_stock - ledgerData.period_opening_stock).toFixed(2)}
                            </p>
                          </div>
                          <motion.div animate={{ rotate: (ledgerData.period_closing_stock - ledgerData.period_opening_stock) >= 0 ? 0 : 180 }}>
                            <ArrowUpRight className={cn("w-6 h-6", (ledgerData.period_closing_stock - ledgerData.period_opening_stock) >= 0 ? "text-emerald-500/50" : "text-red-500/50")} />
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  <Card className="glass border-border shadow-xl overflow-hidden mt-4">
                    <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b border-border py-3 px-6">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xs font-bold tracking-widest uppercase text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Transactions
                        </CardTitle>
                        <Badge className="bg-muted text-foreground border-border hover:bg-muted cursor-default">
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
                          })()} Records Found
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[600px] overflow-y-auto w-full">
                        <Table className="w-full">
                          <TableHeader className="bg-black/40 sticky top-0 z-10 backdrop-blur-xl">
                            <TableRow className="border-border/50 hover:bg-transparent">
                              <TableHead className="w-[180px] font-futuristic text-xs uppercase text-muted-foreground/80 py-4 px-6">Date & Time</TableHead>
                              <TableHead className="font-futuristic text-xs uppercase text-muted-foreground/80 py-4">Event</TableHead>
                              <TableHead className="font-futuristic text-[11px] uppercase text-muted-foreground/80 py-4">Reference Ticket</TableHead>
                              <TableHead className="text-right font-futuristic text-xs uppercase text-muted-foreground/80 py-4">Quantity Change</TableHead>
                              <TableHead className="text-right font-futuristic text-xs uppercase text-muted-foreground/80 py-4 pr-6">Running Balance</TableHead>
                              <TableHead className="font-futuristic text-xs uppercase text-muted-foreground/80 py-4 pl-8">Additional Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const filteredMovements = ledgerData?.movements?.filter((m: any) => {
                                if (movementTypeFilter === 'all') return true;
                                if (movementTypeFilter === 'Disbursement') return m.type.startsWith('Disbursement');
                                if (movementTypeFilter === 'Spoilage') return ['Spoilage', 'Wastage', 'Leftover'].includes(m.type);
                                if (movementTypeFilter === 'Adjustment') return ['Stock Addition', 'Stock Deduction', 'Production Deduction', 'Production Reversal (Undo)'].includes(m.type);
                                if (movementTypeFilter === 'Correction') return m.type.startsWith('System Correction');
                                return m.type === movementTypeFilter;
                              }) || [];

                              return filteredMovements.length > 0 ? filteredMovements.map((m: any, i: number) => (
                                <TableRow key={i} className="border-border/30 hover:bg-muted transition-colors group">
                                  <TableCell className="text-sm font-mono text-muted-foreground pl-6 py-4">{m.date}</TableCell>
                                  <TableCell className="py-4">
                                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2.5 py-1 min-w-[120px] justify-center transition-colors shadow-sm",
                                      m.type === 'Sale' ? "border-red-500/30 text-red-500 bg-red-500/5 group-hover:border-red-500/60" :
                                        m.type === 'Purchase' ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5 group-hover:border-emerald-500/60" :
                                          m.type.startsWith('Disbursement') ? "border-amber-500/30 text-amber-500 bg-amber-500/5 group-hover:border-amber-500/60" :
                                            ['Spoilage', 'Wastage'].includes(m.type) ? "border-orange-500/30 text-orange-500 bg-orange-500/5 group-hover:border-orange-500/60" :
                                              m.type.startsWith('System Correction') ? "border-purple-500/30 text-purple-500 bg-purple-500/5 group-hover:border-purple-500/60" :
                                                "border-border text-foreground bg-muted group-hover:border-border"
                                    )}>
                                      {m.type === 'Sale' ? '🔴 Sale' :
                                        m.type === 'Purchase' ? '🟢 Purchase' :
                                          m.type.startsWith('Disbursement') ? '🚛 Transfer' :
                                            ['Spoilage', 'Wastage'].includes(m.type) ? '🚮 Spoilage' :
                                              m.type.startsWith('System Correction') ? '⚙️ System' :
                                                '🔵 Adjust'}
                                      <span className="ml-1 opacity-60 font-normal">
                                        {m.type === 'Disbursement-In' ? '(In)' : m.type === 'Disbursement-Out' ? '(Out)' : ''}
                                      </span>
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs opacity-60 truncate max-w-[120px] py-4">{m.reference || '—'}</TableCell>
                                  <TableCell className={cn("text-right font-bold text-base py-4 font-mono w-[140px]", getMovementColor(m.change))}>
                                    <span className="bg-background/50 px-2 py-1 rounded-md">
                                      {m.change > 0 ? `+${m.change.toFixed(2)}` : m.change.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-sm text-foreground/80 font-mono py-4 px-6">{m.balance.toFixed(2)}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground truncate max-w-[300px] pl-8 py-4" title={m.reason}>
                                    {m.reason || <span className="opacity-50 italic">No notes provided</span>}
                                  </TableCell>
                                </TableRow>
                              )) : (
                                <TableRow>
                                  <TableCell colSpan={6} className="h-48">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground/60 w-full h-full pattern-dots">
                                      <FileText className="w-10 h-10 mb-3 opacity-20" />
                                      <p className="font-futuristic tracking-widest text-sm uppercase">No Record Found</p>
                                      <p className="text-xs mt-1">Try adjusting the date range or event filter</p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transformable Modal */}
      < AddTransformableModal
        isOpen={showAddTransformableModal}
        onClose={() => setShowAddTransformableModal(false)}
        suppliers={suppliers}
        onSubmit={handleAddTransformable}
      />

      {/* Recipe Manager Modal */}
      {
        selectedItem && (selectedItem.itemType === 'products' || selectedItem.itemType === 'customs') && (
          <RecipeManagerModal
            isOpen={showRecipeModal}
            onClose={() => setShowRecipeModal(false)}
            itemId={selectedItem.id!}
            itemName={selectedItem.name}
            itemType={selectedItem.itemType === 'products' ? 'product' : 'custom'}
            rawItems={rawItemsList}
            existingRecipes={recipeItems.map(r => ({
              id: r.id,
              raw_item: r.raw_item,
              quantity_required: r.quantity_required,
              raw_item_name: rawItemsList.find(raw => raw.id === r.raw_item)?.name,
              raw_item_unit: rawItemsList.find(raw => raw.id === r.raw_item)?.unit
            }))}
            onRecipeAdded={() => {
              // Refresh recipe data after adding
              if (selectedItem) {
                fetchRecipeForItem(selectedItem);
              }
              fetchTabData(activeTab);
            }}
          />
        )
      }

      {/* Stock Adjustment Modal */}
      {
        selectedItem && (
          <StockAdjustmentModal
            isOpen={showAdjustmentModal}
            onClose={() => setShowAdjustmentModal(false)}
            item={selectedItem}
            onAdjustmentSuccess={(newStock) => {
              const updatedItem = { ...selectedItem };
              if (selectedItem.itemType === 'rawitems') {
                updatedItem.quantity_in_stock = newStock;
              } else {
                updatedItem.self_quantity_in_stock = newStock;
              }
              handleItemUpdate(updatedItem);
            }}
          />
        )
      }
    </div >
  );
}
