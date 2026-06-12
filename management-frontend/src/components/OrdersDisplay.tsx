
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, XCircle, AlertCircle, Timer } from 'lucide-react';
import { cn } from "@/lib/utils";

// Dummy Data Logic
const DUMMY_ORDERS = [
    {
        uuid: "12345678-abcd-efgh",
        status: "pending",
        timestamp: new Date().toISOString(),
        order_type: "Dine-in",
        location: "Table 4",
        containers: {
            "1": [
                {
                    item_name: "Jollof Rice with Chicken",
                    food_type: "MD",
                    main_dish_price: 45.00,
                    customization_price: 5.00,
                    quantity: 1,
                    customizations: {
                        "Spiciness": [{ name: "Hot", price: 0, quantity: 1 }],
                        "Extras": [{ name: "Coleslaw", price: 5.00, quantity: 1 }]
                    }
                }
            ]
        }
    },
    {
        uuid: "87654321-zyxw-vuht",
        status: "preparing",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        order_type: "Takeaway",
        containers: {
            "1": [
                {
                    item_name: "Fried Rice",
                    food_type: "MD",
                    main_dish_price: 35.00,
                    quantity: 2,
                    customizations: {}
                },
                {
                    item_name: "Grilled Tilapia",
                    food_type: "SA",
                    base_price: 55.00,
                    quantity: 1
                }
            ]
        }
    }
];

interface OrderStatusBadgeProps {
    status: string;
}

const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
    const statusConfig = {
        'pending': {
            color: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
            icon: Clock,
            label: 'Pending'
        },
        'preparing': {
            color: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
            icon: Timer,
            label: 'Preparing'
        },
        'completed': {
            color: 'bg-green-400/10 text-green-400 border-green-400/20',
            icon: CheckCircle2,
            label: 'Completed'
        },
        'cancelled': {
            color: 'bg-red-400/10 text-red-400 border-red-400/20',
            icon: XCircle,
            label: 'Cancelled'
        }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={cn(config.color, "flex items-center gap-1.5 px-2 py-1")}>
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-wide">{config.label}</span>
        </Badge>
    );
};

const OrderCard = ({ order }: { order: any }) => {
    const calculateItemTotal = (item: any) => {
        if (item.food_type === 'MD' || item.food_type === 'PK') {
            return (item.main_dish_price || 0) + (item.customization_price || 0);
        } else if (item.food_type === 'SA') {
            return item.base_price * item.quantity;
        } else {
            return item.item_price || 0;
        }
    };

    const calculateContainerTotal = (items: any[]) => {
        return items.reduce((total: number, item: any) => total + calculateItemTotal(item), 0);
    };

    return (
        <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg space-y-3 hover:border-gray-700 transition-colors">
            {/* Order Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-200">
                        Order #{order.uuid.slice(0, 8)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                </div>
                <span className="text-xs text-gray-400 font-medium">
                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Order Items */}
            <div className="space-y-3">
                {Object.entries(order.containers).map(([containerId, items]) => (
                    <div key={containerId} className="pl-3 border-l-2 border-gray-800">
                        <div className="flex justify-between items-center mb-1">
                            <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                Container {containerId}
                            </div>
                            <div className="text-xs font-bold text-yellow-400">
                                GHS {calculateContainerTotal(items as any[]).toFixed(2)}
                            </div>
                        </div>
                        {(items as any[]).map((item: any, itemIdx: number) => (
                            <div key={itemIdx} className="space-y-1 mb-2 last:mb-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <span className="text-gray-300 text-sm font-medium">{item.item_name}</span>
                                            <span className="text-gray-400 text-xs ml-2 tabular-nums">
                                                GHS {(item.main_dish_price || item.base_price || 0).toFixed(2)}
                                                {item.quantity > 1 && ` × ${item.quantity}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customizations */}
                                {item.customizations && (
                                    <div className="ml-3 space-y-1 mt-1">
                                        {Object.entries(item.customizations).map(([category, options]) => (
                                            <div key={category} className="space-y-0.5">
                                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                                    {category}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {(Object.values(options as any) as any[]).map((option: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-xs text-gray-400">
                                                            <span>
                                                                {option.name}
                                                                {option.quantity > 1 && ` ×${option.quantity}`}
                                                            </span>
                                                            {option.price > 0 && (
                                                                <span>
                                                                    GHS {option.price.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Order Footer */}
            <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs font-normal bg-gray-800 text-gray-300 hover:bg-gray-700">
                        {order.order_type}
                    </Badge>
                    {order.location && (
                        <span className="text-xs text-gray-400 font-medium">• {order.location}</span>
                    )}
                </div>
                <div className="text-base font-bold text-yellow-500 tabular-nums">
                    GHS {Object.values(order.containers).reduce((total: number, items: any) =>
                        total + calculateContainerTotal(items), 0).toFixed(2)}
                </div>
            </div>
        </div>
    );
};

export default function OrdersDisplay() {
    const orders = DUMMY_ORDERS; // Logic replacement

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <AlertCircle className="w-12 h-12 text-gray-600 mb-3" />
                <h3 className="text-lg text-gray-300 font-semibold">No Orders Today</h3>
                <p className="text-sm text-gray-500 mt-1">Orders you make today will appear here</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[calc(100vh-180px)] sm:h-[calc(100vh-200px)] pr-4">
            <div className="space-y-4">
                {orders.map((order) => (
                    <OrderCard key={order.uuid} order={order} />
                ))}
            </div>
        </ScrollArea>
    );
}
