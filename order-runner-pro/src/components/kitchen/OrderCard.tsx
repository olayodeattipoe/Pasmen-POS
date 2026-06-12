import { Check, Clock, User, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { Order, BasketItem } from '@/api/models';
import { useOrderSound } from '@/hooks/useOrderSound';
import { cn } from '@/lib/utils';

interface OrderCardProps {
  order: Order;
  onComplete: (orderId: string) => void;
  variant?: 'active' | 'completed';
}

export function OrderCard({ order, onComplete, variant = 'active' }: OrderCardProps) {
  const { playSound } = useOrderSound();
  const isReadOnly = variant === 'completed';

  const timeSinceCreated = Math.floor(
    (Date.now() - order.createdAt.getTime()) / 60000
  );

  const statusClass = {
    new: 'status-new',
    preparing: 'status-preparing',
    ready: 'status-ready',
    completed: 'status-ready',
  }[order.status];

  // Helper for pricing type
  const getPricingType = (type?: string) => {
    const raw = type?.toUpperCase().trim() || '';
    if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
    return raw.toLowerCase();
  };

  // Helper for basket subtotal
  const calculateBasketTotal = (basket: BasketItem) => {
    let total = 0;

    // Product cost
    const productPricing = getPricingType(basket.pricing_type);
    if (productPricing === 'fixed') {
      total += (basket.product_price_sold * basket.product_quantity);
    } else {
      total += basket.product_price_sold;
    }

    // Customizations cost
    basket.customizations.forEach(custom => {
      const customPricing = getPricingType(custom.pricing_type);
      if (customPricing === 'fixed') {
        total += (custom.custom_price_sold * custom.custom_quantity);
      } else {
        total += custom.custom_price_sold;
      }
    });

    return total;
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden h-full">
      {/* Read-Only Status Overlay */}
      {isReadOnly && (
        <div className="absolute top-4 right-4 z-20 pointer-events-none">
          <div className="bg-success text-success-foreground px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
          </div>
        </div>
      )}

      {/* Card Content */}
      <div
        className={cn(
          "glass-card relative flex-1 flex flex-col select-none h-full",
          "transition-all duration-300 ease-out",
          order.priority === 'rush' && !isReadOnly && "pulse-glow"
        )}
      >
        {/* Priority indicator */}
        {order.priority === 'rush' && !isReadOnly && (
          <div className="absolute top-0 left-0 right-0 h-1.5 md:h-2 bg-gradient-to-r from-primary via-primary/50 to-transparent z-20" />
        )}

        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 min-h-0">
          {/* Header Section */}
          <div className="flex flex-col gap-6 mb-4 flex-shrink-0">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Calabash</span>
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customer</p>
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-none">
                  {order.customer.name}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <span className="text-sm font-medium bg-secondary/40 px-2 py-0.5 rounded-md border border-border/30">
                    Order {order.orderNumber}
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between md:justify-end gap-3 md:gap-4 md:min-w-[200px]">
                {!isReadOnly && (
                  <div className={cn("status-badge px-4 py-1.5 text-xs rounded-xl shadow-lg shadow-black/20 self-start", statusClass)}>
                    {order.status}
                  </div>
                )}
                <div className="flex flex-col items-end gap-1 px-3 py-1.5 bg-secondary/20 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {isReadOnly ? 'DONE' : `${timeSinceCreated}m`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/20 w-full" />
          </div>

          {/* Items Section - Scrollable with extra bottom padding if active */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 scrollbar-hide">
            <div className={cn("space-y-6", !isReadOnly && "pb-60")}>
              {order.order.baskets.map((basket, index) => (
                <div key={index} className="group relative">
                  {/* Header: Bowl Number */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-yellow-500">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-foreground group-hover:text-yellow-500 transition-colors uppercase tracking-tight">
                          Bowl {index + 1}
                        </h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          {1 + basket.customizations.length} Items Total
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-foreground/[0.02] border border-foreground/5 rounded-2xl overflow-hidden">
                    {/* Main Product Display */}
                    <div className="p-4 flex items-center justify-between bg-foreground/[0.03]">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground line-clamp-1">{basket.product_name}</span>
                          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Main Component</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(() => {
                          const pricingType = getPricingType(basket.pricing_type);
                          const displayPrice = pricingType === 'fixed'
                            ? Number(basket.product_price_sold) * basket.product_quantity
                            : Number(basket.product_price_sold);

                          return (
                            <>
                              {pricingType === 'fixed' && (
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">x{basket.product_quantity}</span>
                              )}
                              <span className="text-xs font-black text-foreground tabular-nums">
                                GHS {displayPrice.toFixed(2)}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Customizations Display */}
                    {basket.customizations.map((custom, cIdx) => {
                      const pricingType = getPricingType(custom.pricing_type);
                      const isFixed = pricingType === 'fixed';

                      return (
                        <div key={cIdx} className="px-4 py-3 flex items-center justify-between border-t border-foreground/5">
                          <div className="flex items-center gap-3 pl-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted" />
                            <span className="text-xs font-bold text-muted-foreground">{custom.custom_name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            {isFixed && (
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">x{custom.custom_quantity}</span>
                            )}
                            <span className="text-xs font-bold text-foreground/80 tabular-nums">
                              GHS {(isFixed
                                ? Number(custom.custom_price_sold) * custom.custom_quantity
                                : Number(custom.custom_price_sold)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Basket Subtotal */}
                    <div className="px-4 py-3 bg-foreground/5 flex items-center justify-between border-t border-foreground/10">
                      <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Bowl Subtotal</span>
                      <span className="text-sm font-black text-yellow-600 tabular-nums">
                        GHS {calculateBasketTotal(basket).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Footer: Special Instructions + Actions - ONLY IF ACTIVE */}
          {!isReadOnly && (
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 z-10 rounded-b-2xl">
              {order.order.specific_description && (
                <div className="mb-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <MessageSquare className="w-12 h-12 text-primary" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80 mb-1">
                      Wait! Special Request:
                    </p>
                    <p className="text-lg font-bold text-foreground italic leading-tight">
                      "{order.order.specific_description}"
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  playSound('complete');
                  onComplete(order.id);
                }}
                className="w-full bg-success hover:bg-success/90 text-success-foreground font-bold py-5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-success/20 group"
              >
                <Check className="w-7 h-7" strokeWidth={3} />
                <span className="uppercase tracking-widest text-xl">Mark Completed</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}