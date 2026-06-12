import { Order, OrderStatus } from '@/api/models';
import { OrderCard } from './OrderCard';
import { Package } from 'lucide-react';

interface OrderQueueProps {
  orders: Order[];
  filter: OrderStatus | 'all';
  onCompleteOrder: (orderId: string) => void;
}

export function OrderQueue({ orders, filter, onCompleteOrder }: OrderQueueProps) {
  const filteredOrders = orders.filter(
    (order) => filter === 'all' || order.status === filter
  );

  // Sort: rush orders first, then by creation time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a.priority === 'rush' && b.priority !== 'rush') return -1;
    if (b.priority === 'rush' && a.priority !== 'rush') return 1;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  if (sortedOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No orders yet
        </h3>
        <p className="text-muted-foreground text-sm">
          {filter === 'all'
            ? 'New orders will appear here'
            : `No ${filter} orders at the moment`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-6 space-y-4">
      {sortedOrders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onComplete={onCompleteOrder}
        />
      ))}
    </div>
  );
}
