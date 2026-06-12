import { useNavigate } from "react-router-dom";
import { ArrowLeft, Utensils, ChevronDown, User, Clock, Package, DollarSign } from "lucide-react";
import { useOrders } from "@/context/OrdersContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Order } from "@/api/models";

const CompletedOrders = () => {
  const navigate = useNavigate();
  const { completedOrders } = useOrders();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (orderId: string) => {
    setExpandedId(expandedId === orderId ? null : orderId);
  };

  const calculateOrderTotal = (order: Order) => {
    return order.order.baskets.reduce((total, basket) => {
      let basketTotal = 0;

      // Product price
      const productPricing = basket.pricing_type?.toUpperCase();
      if (productPricing === 'FIX' || productPricing === 'FIXED') {
        basketTotal += basket.product_price_sold * basket.product_quantity;
      } else {
        basketTotal += basket.product_price_sold;
      }

      // Customizations
      basket.customizations.forEach(custom => {
        const customPricing = custom.pricing_type?.toUpperCase();
        if (customPricing === 'FIX' || customPricing === 'FIXED') {
          basketTotal += custom.custom_price_sold * custom.custom_quantity;
        } else {
          basketTotal += custom.custom_price_sold;
        }
      });

      return total + basketTotal;
    }, 0);
  };

  const getTotalItemCount = (order: Order) => {
    return order.order.baskets.reduce((count, basket) => {
      return count + 1 + basket.customizations.length;
    }, 0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 glass-card rounded-none border-x-0 border-t-0 p-4 sticky top-0 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Order History</h1>
            <p className="text-sm text-muted-foreground">
              {completedOrders.length} completed today
            </p>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <div className="relative z-10 flex-1 p-4 overflow-y-auto">
        {completedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <Utensils className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              No completed orders yet
            </h2>
            <p className="text-sm text-muted-foreground">
              Completed orders will appear here
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {completedOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const totalAmount = calculateOrderTotal(order);
              const itemCount = getTotalItemCount(order);

              return (
                <div
                  key={order.id}
                  className="glass-card overflow-hidden transition-all duration-300"
                >
                  {/* Compact Summary Card */}
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="w-full p-4 text-left hover:bg-foreground/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Order Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-black text-success">
                            {order.orderNumber}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <p className="font-bold text-foreground truncate">
                              {order.customer.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{order.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              <span>{itemCount} items</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Total & Expand */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mb-0.5">
                            <DollarSign className="w-3 h-3" />
                            <span className="uppercase tracking-wider font-bold">Total</span>
                          </div>
                          <p className="text-lg font-black text-foreground tabular-nums">
                            GHS {totalAmount.toFixed(2)}
                          </p>
                        </div>

                        <ChevronDown
                          className={cn(
                            "w-5 h-5 text-muted-foreground transition-transform duration-300",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Expandable Details */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-border/50">
                      <div className="space-y-4">
                        {/* Baskets/Bowls */}
                        {order.order.baskets.map((basket, idx) => (
                          <div key={idx} className="bg-foreground/[0.02] border border-foreground/5 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-xs font-black text-yellow-600">{idx + 1}</span>
                              </div>
                              <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                                Bowl {idx + 1}
                              </h4>
                            </div>

                            {/* Main Product */}
                            <div className="mb-2 p-2 bg-foreground/[0.03] rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-foreground">{basket.product_name}</span>
                                <div className="flex items-center gap-2">
                                  {(() => {
                                    const pricingType = basket.pricing_type?.toUpperCase();
                                    const isFixed = pricingType === 'FIX' || pricingType === 'FIXED';
                                    const displayPrice = isFixed
                                      ? basket.product_price_sold * basket.product_quantity
                                      : basket.product_price_sold;

                                    return (
                                      <>
                                        {isFixed && (
                                          <span className="text-xs text-muted-foreground">x{basket.product_quantity}</span>
                                        )}
                                        <span className="text-sm font-bold text-foreground tabular-nums">
                                          GHS {displayPrice.toFixed(2)}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Customizations */}
                            {basket.customizations.length > 0 && (
                              <div className="space-y-1 pl-3">
                                {basket.customizations.map((custom, cIdx) => {
                                  const pricingType = custom.pricing_type?.toUpperCase();
                                  const isFixed = pricingType === 'FIX' || pricingType === 'FIXED';
                                  const displayPrice = isFixed
                                    ? custom.custom_price_sold * custom.custom_quantity
                                    : custom.custom_price_sold;

                                  return (
                                    <div key={cIdx} className="flex items-center justify-between text-sm py-1">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-1 rounded-full bg-muted" />
                                        <span className="text-muted-foreground">{custom.custom_name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isFixed && (
                                          <span className="text-xs text-muted-foreground/60">x{custom.custom_quantity}</span>
                                        )}
                                        <span className="text-foreground/80 font-semibold tabular-nums">
                                          GHS {displayPrice.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Special Instructions */}
                        {order.order.specific_description && (
                          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                            <p className="text-xs font-black uppercase tracking-wider text-primary/80 mb-1">
                              Special Instructions:
                            </p>
                            <p className="text-sm text-foreground italic">
                              "{order.order.specific_description}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedOrders;
