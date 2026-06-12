import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { Order, Sale, RawSaleItem, BasketItem, Customization } from '@/api/models';
import { getNextKitchenOrder, getSaleItems, markOrderAsCompleted as apiMarkOrderAsCompleted, getCompletedOrders } from '@/api/features';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface OrdersContextType {
  activeOrders: Order[];
  completedOrders: Order[];
  addCompletedOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
  isLoading: boolean;
  pollingEnabled: boolean;
  setPollingEnabled: (enabled: boolean) => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

// Helper to map backend Sale + SaleItems to frontend Order
const mapSaleToOrder = (sale: Sale, items: RawSaleItem[]): Order => {
  const baskets: BasketItem[] = [];
  let currentBasketItem: BasketItem | null = null;
  const rawItems = items || []; // Handle potential null/undefined

  rawItems.forEach((item) => {
    if (item.item_type === 'PRODUCT') {
      currentBasketItem = {
        product_id: item.product || 0,
        product_name: item.item_name,
        product_price_sold: parseFloat(item.price_sold) || 0,
        product_quantity: item.quantity,
        pricing_type: item.pricing_type,
        customizations: []
      };
      baskets.push(currentBasketItem);
    } else if (item.item_type === 'CUSTOM') {
      const customization: Customization = {
        custom_id: item.custom || 0,
        custom_name: item.item_name,
        custom_price_sold: parseFloat(item.price_sold) || 0,
        custom_quantity: item.quantity,
        pricing_type: item.pricing_type
      };

      if (currentBasketItem) {
        currentBasketItem.customizations.push(customization);
      } else {
        // Handle orphaned customization
        currentBasketItem = {
          product_id: 0,
          product_name: "Unassigned Customizations",
          product_price_sold: 0,
          product_quantity: 1,
          customizations: [customization]
        };
        baskets.push(currentBasketItem);
      }
    }
  });

  return {
    id: String(sale.id),
    orderNumber: `#${String(sale.daily_sequence_number || 0).padStart(3, '0')}`,
    customer: {
      id: Number(sale.customer?.id) || 0,
      name: sale.customer?.username || "Guest Customer",
      phone: "N/A"
    },
    order: {
      total_amount: String(sale.total_amount || "0.00"),
      payment_method: sale.payment_method || "Unknown",
      specific_description: sale.specific_description || "",
      prepared_by_id: Number(sale.prepared_by?.id) || 0,
      processed_by_id: Number(sale.processed_by_id) || 0,
      baskets
    },
    status: (sale.sale_status || 'preparing') as any, // Handle status from backend
    createdAt: new Date(sale.sale_date),
    priority: sale.priority === 'rush' ? 'rush' : 'normal',
  };
};

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const isPollingRef = useRef(false);
  const isCompletingRef = useRef(false); // Track completion in progress
  const { isAuthenticated } = useAuth();

  // Fetch Completed Orders from Backend
  const fetchCompletedOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const { data: sales, error } = await getCompletedOrders();
      if (error) {
        if (error.includes('401')) {
          // handled by auth check usually, but good to have
        }
        console.error("Failed to fetch completed orders:", error);
        return;
      }

      if (sales) {
        // Map all completed sales to Order objects
        // Note: We might need to fetch items for each to show details.
        // For efficiency, we will fetch items for the most recent 10.
        const recentSales = sales.slice(0, 10);
        const mappedOrders = await Promise.all(recentSales.map(async (sale) => {
          const { data: items } = await getSaleItems(sale.id);
          // Override status to completed just in case
          return { ...mapSaleToOrder(sale, items || []), status: 'completed' as const };
        }));

        setCompletedOrders(mappedOrders);
      }
    } catch (err) {
      console.error("Error fetching completed orders:", err);
    }
  }, [isAuthenticated]);

  // Initial fetch of completed orders
  useEffect(() => {
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);


  const fetchNextOrder = useCallback(async () => {
    // Don't fetch if completing an order to avoid race condition
    if (!isAuthenticated || isPollingRef.current || activeOrders.length > 0 || isCompletingRef.current) return;
    isPollingRef.current = true;

    try {
      const { data: sale, error } = await getNextKitchenOrder();

      if (error) {
        // Handle 401 Session Expiry
        if (typeof error === 'string' && error.includes('401')) {
          toast.error("Session Expired", {
            description: "Your session has expired. Please refresh the page.",
            action: {
              label: "Refresh",
              onClick: () => window.location.reload()
            },
            duration: Infinity, // Keep it visible until action
          });
          setPollingEnabled(false); // Stop polling
          return;
        }
        console.error("Error fetching next order:", error);
        return;
      }

      if (sale) {
        const { data: items, error: itemsError } = await getSaleItems(sale.id);

        if (itemsError) {
          console.error("Error fetching sale items:", itemsError);
          return;
        }

        const newOrder = mapSaleToOrder(sale, items || []);
        setActiveOrders(prev => {
          if (prev.some(o => o.id === newOrder.id)) return prev;
          return [...prev, newOrder];
        });
        return;
      }
    } catch (err) {
      console.error("Polling error:", err);
    } finally {
      isPollingRef.current = false;
    }
  }, [isAuthenticated, activeOrders.length]);

  // Polling Effect
  useEffect(() => {
    if (!isAuthenticated || !pollingEnabled) return;

    const interval = setInterval(() => {
      if (activeOrders.length === 0) {
        // console.log("Polling for next order...");
        fetchNextOrder();
      }
    }, 5000);

    if (activeOrders.length === 0) {
      fetchNextOrder();
    }

    return () => clearInterval(interval);
  }, [fetchNextOrder, isAuthenticated, activeOrders.length, pollingEnabled]);

  const addCompletedOrder = async (orderId: string) => {
    isCompletingRef.current = true; // Block polling during completion
    setIsLoading(true);

    // Optimistic update - but save original state for potential revert
    const orderToComplete = activeOrders.find(o => o.id === orderId);

    if (orderToComplete) {
      // Remove from active
      setActiveOrders(prev => prev.filter(o => o.id !== orderId));

      // Add to completed list locally first
      const completedOrder = { ...orderToComplete, status: 'completed' as const };
      setCompletedOrders(prev => [completedOrder, ...prev]);
    }

    try {
      const { error } = await apiMarkOrderAsCompleted(orderId);
      if (error) {
        // REVERT optimistic update since it failed
        if (orderToComplete) {
          setActiveOrders(prev => [...prev, orderToComplete]);
          setCompletedOrders(prev => prev.filter(o => o.id !== orderId));
        }

        // Handle specific errors
        if (typeof error === 'string' && error.includes('401')) {
          toast.error("Session Expired", {
            description: "Please refresh the page to continue.",
            action: {
              label: "Refresh",
              onClick: () => window.location.reload()
            }
          });
        } else {
          // Show the actual error from backend
          toast.error("Failed to complete order", {
            description: error || "This user is likely logged in on another device."
          });
        }
      } else {
        // Success - completion is done
        toast.success("Order completed!", {
          description: "Inventory has been updated."
        });
      }
    } catch (err) {
      // REVERT optimistic update on exception
      if (orderToComplete) {
        setActiveOrders(prev => [...prev, orderToComplete]);
        setCompletedOrders(prev => prev.filter(o => o.id !== orderId));
      }

      console.error("Error completing order:", err);
      toast.error("Error completing order", {
        description: "An unexpected error occurred."
      });
    } finally {
      setIsLoading(false);
      isCompletingRef.current = false; // Re-enable polling
    }
  };

  const refreshOrders = async () => {
    setIsLoading(true);
    await fetchNextOrder();
    // Also refresh completed history
    await fetchCompletedOrders();
    setIsLoading(false);
  };

  return (
    <OrdersContext.Provider value={{
      activeOrders,
      completedOrders,
      addCompletedOrder,
      refreshOrders,
      isLoading,
      pollingEnabled,
      setPollingEnabled
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider');
  }
  return context;
}

