import { useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '@/api/models';
import { OrderCard } from '@/components/kitchen/OrderCard';
import { Package, Bell, Clock, CheckCircle, User, Zap, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOrders } from '@/context/OrdersContext';
import { useOrderSound } from '@/hooks/useOrderSound';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { activeOrders, completedOrders, addCompletedOrder, setPollingEnabled } = useOrders();
  const { playSound } = useOrderSound();
  const prevOrderIdRef = useRef<string | null>(null);

  // Use orders from context
  const orders = activeOrders;

  // activeOrders is already memoized in context or at least filtered there
  // but let's keep the sorting logic here for UI preference
  const sortedActiveOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (a.priority === 'rush' && b.priority !== 'rush') return -1;
      if (b.priority === 'rush' && a.priority !== 'rush') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }, [orders]);

  // Current order is always the first one in queue
  const currentOrder = sortedActiveOrders[0];
  const queueLength = sortedActiveOrders.length;

  // Enable polling only when on this page
  useEffect(() => {
    setPollingEnabled(true);
    return () => setPollingEnabled(false);
  }, [setPollingEnabled]);

  useEffect(() => {
    if (currentOrder && currentOrder.id !== prevOrderIdRef.current) {
      // Only play sound if it's a new order coming in (not just a re-render)
      // And ensure we don't spam on initial load unless desired
      if (prevOrderIdRef.current !== null) {
        playSound('new');
        toast.info("NEW ORDER RECEIVED", {
          position: 'top-center',
          duration: 2000
        });
      }
      prevOrderIdRef.current = currentOrder.id;
    } else if (!currentOrder) {
      prevOrderIdRef.current = null;
    }
  }, [currentOrder, playSound]);

  const handleCompleteOrder = async (orderId: string) => {
    await addCompletedOrder(orderId);

    toast.success('ORDER DISPATCHED', {
      description: 'The kitchen has cleared this ticket.',
      position: 'top-center',
      className: 'glass-surface border-success/50 text-success font-bold',
    });
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleLogout = () => {
    toast.info("Signing out...", {
      description: "Closing kitchen terminal session.",
      duration: 2000
    });
    setTimeout(() => logout(), 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05070a] text-foreground selection:bg-primary/30 pb-20 md:pb-0">
      {/* Ambient background glow - Enhanced */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-accent/10 blur-[100px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-purple-500/5 blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Compact Premium Header */}
        <header className="sticky top-0 z-50 glass-surface border-b border-border/30 px-4 py-3 md:px-6 md:py-4">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 md:gap-4">
              <button
                onClick={handleLogout}
                className="group w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-all duration-300 border border-transparent hover:border-destructive/30"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5 md:w-6 md:h-6 text-destructive/70 group-hover:text-destructive transition-colors" />
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="group relative w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-secondary/30 flex items-center justify-center hover:bg-primary/20 transition-all duration-300 border border-border/50 hover:border-primary/40 overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <User className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-success animate-pulse" />
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] hidden sm:block">Live Kitchen Terminal</p>
                </div>
                <h1 className="font-black text-xl md:text-2xl leading-tight tracking-tighter">
                  <span className="text-primary italic mr-2">Calabash</span>
                  Pasmen Kitchen
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-0.5">Terminal Time</p>
                <p className="text-2xl font-black tabular-nums tracking-tighter">{currentTime}</p>
              </div>

              <button
                onClick={() => navigate('/completed')}
                className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-2.5 rounded-xl md:rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/50 transition-all group lg:min-w-[180px]"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-success/10 flex items-center justify-center border border-success/20">
                  <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
                </div>
                <div className="text-left">
                  <p className="hidden md:block text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none mb-1">Cleared</p>
                  <p className="text-xs md:text-sm font-bold leading-none">{completedOrders.length} <span className="hidden md:inline">tickets</span></p>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Queue Status Bar - Enhanced */}
        <div className="bg-secondary/10 border-b border-border/20 backdrop-blur-md">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 py-2 md:px-6 md:py-2.5">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <Zap className={cn(
                  "w-3.5 h-3.5 md:w-4 md:h-4 transition-colors",
                  queueLength > 0 ? "text-primary fill-primary/20" : "text-muted-foreground"
                )} />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                  {queueLength > 0 ? (
                    <>
                      <span className="text-primary">{queueLength}</span>
                      <span className="text-muted-foreground ml-1.5">Pending <span className="hidden sm:inline">Tickets</span></span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Kitchen Idle</span>
                  )}
                </span>
              </div>

              {queueLength > 0 && (
                <div className="h-4 w-px bg-border/30 hidden sm:block" />
              )}

              {queueLength > 1 && (
                <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground group">
                  <Clock className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                  <span className="uppercase font-black tracking-widest">Next Up:</span>
                  <span className="font-bold text-foreground bg-secondary/40 px-2 py-0.5 rounded-md border border-border/50">
                    #{activeOrders[1]?.orderNumber}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {[...Array(Math.min(queueLength, 3))].map((_, i) => (
                  <div key={i} className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-[#05070a] bg-secondary/60 flex items-center justify-center">
                    <Package className="w-2.5 h-2.5 md:w-3 md:h-3 text-muted-foreground" />
                  </div>
                ))}
              </div>
              {queueLength > 3 && (
                <span className="text-[10px] font-black text-muted-foreground ml-1">+{queueLength - 3}</span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Single Order View */}
        <main className="flex-1 flex flex-col p-3 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {currentOrder ? (
            <div className="flex-1 flex flex-col min-h-0 max-w-5xl mx-auto w-full">
              <OrderCard
                order={currentOrder}
                onComplete={handleCompleteOrder}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 md:p-12">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] bg-secondary/30 flex items-center justify-center mb-6 md:mb-8 border border-border/50 backdrop-blur-xl">
                  <Package className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-black text-foreground mb-3 md:mb-4 tracking-tighter">
                Kitchen Clear
              </h3>
              <p className="text-muted-foreground text-lg md:text-xl max-w-sm font-medium leading-relaxed">
                All tickets have been processed. New orders will manifest here instantly.
              </p>
              <div className="flex items-center gap-3 mt-8 md:mt-10 px-6 py-3 rounded-full bg-secondary/10 border border-border/20 text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-black uppercase tracking-[0.2em]">Terminal Online</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
