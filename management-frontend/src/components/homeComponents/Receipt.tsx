import React from 'react';
import { Basket, PrintData } from '@/api/models';

const Receipt: React.FC<PrintData> = ({
    orderNumber,
    baskets,
    totalAmount,
    paymentMethod,
    description,
    serverName,
    isDelivery,
    deliveryNumber,
    date = new Date().toLocaleString()
}) => {
    // Helper to normalize pricing type
    const getPricingType = (type?: string) => {
        const raw = type?.toUpperCase().trim() || '';
        if (raw === 'FIX' || raw === 'FIXED') return 'fixed';
        if (raw === 'VAR' || raw === 'VARIABLE') return 'variable';
        if (raw === 'FIX_VAR' || raw === 'FIX_VARIABLE' || raw.includes('&')) return 'fixed variable';
        return raw.toLowerCase();
    };

    const calculateBasketUnitTotal = (basket: Basket) => {
        const productPricingType = getPricingType(basket.product_pricing_type);
        const base = productPricingType === 'fixed'
            ? Number(basket.product_price_sold) * basket.product_quantity
            : Number(basket.product_price_sold);

        const customs = basket.customizations.reduce((acc, c) => {
            const customPricingType = getPricingType(c.pricing_type);
            const customTotal = customPricingType === 'fixed'
                ? Number(c.custom_price_sold) * c.custom_quantity
                : Number(c.custom_price_sold);
            return acc + customTotal;
        }, 0);

        return base + customs;
    };

    const groupIdenticalBaskets = (items: Basket[]) => {
        const groups: { basket: Basket; count: number; identity: string }[] = [];

        items.forEach(item => {
            const sortedCustoms = [...item.customizations].sort((a, b) => a.custom_id - b.custom_id);
            const identity = `${item.product_id}-${item.product_quantity}-${item.product_price_sold}-` +
                sortedCustoms.map(c => `${c.custom_id}:${c.custom_quantity}:${c.custom_price_sold}`).join('|');

            const existingGroup = groups.find(g => g.identity === identity);

            if (existingGroup) {
                existingGroup.count += 1;
            } else {
                groups.push({ basket: item, count: 1, identity });
            }
        });

        return groups;
    };

    const groupedBaskets = groupIdenticalBaskets(baskets);

    const renderSingleReceipt = (label: string, isFirst: boolean = false) => (
        <div
            className="bg-white text-black p-2 font-mono leading-tight"
            style={{
                width: '72mm',
                breakAfter: isFirst ? 'page' : 'auto',
                pageBreakAfter: isFirst ? 'always' : 'auto'
            }}
        >
            {/* Header */}
            <div className="text-center mb-3 border-b-2 border-black pb-2">
                <div className="mb-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/50">{label}</p>
                </div>
                <h1 className="text-[16px] font-black uppercase tracking-tight leading-tight mb-0.5">
                    Calabash Royal
                </h1>
                <h2 className="text-[14px] font-black uppercase tracking-tight">
                    Kitchen
                </h2>
                <div className="mt-1.5 text-[8px] text-black/60">
                    <p>{date}</p>
                    <p className="mt-0.5">Server: {serverName || 'Admin'}</p>
                </div>
            </div>

            {/* Delivery Badge - Prominent */}
            {isDelivery && (
                <div className="mb-2 -mx-2 px-2 py-2 bg-black text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                            <p className="text-[12px] font-black uppercase tracking-widest">DELIVERY ORDER</p>
                        </div>
                    </div>
                    {deliveryNumber && (
                        <div className="mt-1.5 pt-1.5 border-t border-white/30">
                            <p className="text-[8px] font-bold uppercase tracking-wider text-white/70">Contact</p>
                            <p className="text-[12px] font-black mt-0.5">{deliveryNumber}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Order Number - Large and Prominent */}
            <div className="text-center mb-3 py-2 bg-black/5 rounded-sm">
                <p className="text-[8px] font-bold uppercase tracking-widest text-black/50 mb-0.5">Order Number</p>
                <p className="text-[42px] font-black tracking-tighter leading-none">{orderNumber}</p>
            </div>

            {/* Items Section */}
            <div className="mb-3">
                <div className="border-t-2 border-black mb-2"></div>

                {groupedBaskets.map((group, gIdx) => {
                    const basketUnitTotal = calculateBasketUnitTotal(group.basket);
                    const groupTotal = basketUnitTotal * group.count;

                    return (
                        <div key={gIdx} className="mb-3">
                            {/* Bowl Header */}
                            <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-black/20">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black">
                                        {gIdx + 1}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wide">Bowl {gIdx + 1}</span>
                                </div>
                                {group.count > 1 && (
                                    <div className="bg-black text-white px-1.5 py-0.5 rounded-sm">
                                        <span className="text-[11px] font-black">×{group.count}</span>
                                    </div>
                                )}
                            </div>

                            {/* Main Product */}
                            <div className="mb-1.5 pl-1">
                                <div className="flex justify-between items-start gap-2 mb-0.5">
                                    <div className="flex-1">
                                        <p className="text-[16px] font-black uppercase leading-tight">
                                            {group.basket.product_name}
                                        </p>
                                        <p className="text-[7px] font-bold text-black/40 uppercase tracking-wider mt-0.5">
                                            Main
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getPricingType(group.basket.product_pricing_type) === 'fixed' && (
                                            <span className="text-[12px] font-black text-black/70">
                                                ×{group.basket.product_quantity}
                                            </span>
                                        )}
                                        <span className="text-[13px] font-black tabular-nums">
                                            {(getPricingType(group.basket.product_pricing_type) === 'fixed'
                                                ? Number(group.basket.product_price_sold) * group.basket.product_quantity
                                                : Number(group.basket.product_price_sold)).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customizations */}
                            {group.basket.customizations.length > 0 && (
                                <div className="pl-3 space-y-1 mb-1.5">
                                    {group.basket.customizations.map((custom, cIdx) => {
                                        const isCFixed = getPricingType(custom.pricing_type) === 'fixed';
                                        const cUnitPrice = Number(custom.custom_price_sold);
                                        const cTotal = isCFixed ? cUnitPrice * custom.custom_quantity : cUnitPrice;

                                        return (
                                            <div key={cIdx} className="flex justify-between items-center gap-2">
                                                <div className="flex items-center gap-1.5 flex-1">
                                                    <div className="w-1 h-1 rounded-full bg-black/30"></div>
                                                    <span className="text-[13px] font-bold text-black/70">
                                                        {custom.custom_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    {isCFixed && (
                                                        <span className="text-[11px] font-black text-black/60">
                                                            ×{custom.custom_quantity}
                                                        </span>
                                                    )}
                                                    <span className="text-[12px] font-black tabular-nums">
                                                        {cTotal.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Bowl Subtotal */}
                            <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-black/30">
                                <span className="text-[8px] font-black uppercase tracking-wider text-black/50">
                                    Bowl Total {group.count > 1 && `(×${group.count})`}
                                </span>
                                <span className="text-[11px] font-black tabular-nums">
                                    GHS {groupTotal.toFixed(2)}
                                </span>
                            </div>

                            {/* Separator between bowls */}
                            {gIdx < groupedBaskets.length - 1 && (
                                <div className="mt-2 border-t border-black/10"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Grand Total Section */}
            <div className="border-t-4 border-double border-black pt-2 mb-2">
                <div className="bg-black text-white px-2 py-2 rounded-sm mb-1.5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider">TOTAL</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[9px] font-bold">GHS</span>
                            <span className="text-[18px] font-black tabular-nums tracking-tight">
                                {Number(totalAmount).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-black/50">Payment</span>
                    <span className="text-[9px] font-black uppercase">{paymentMethod}</span>
                </div>
            </div>

            {/* Kitchen Notes */}
            {description && (
                <div className="mb-3 p-2 bg-black/5 rounded-sm border-l-4 border-black">
                    <p className="text-[8px] font-black uppercase tracking-wider text-black/60 mb-0.5">
                        Kitchen Notes
                    </p>
                    <p className="text-[10px] font-bold leading-snug break-words">
                        {description}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 border-t border-dashed border-black/30">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Thank You!</p>
                <div className="flex items-center justify-center gap-1 text-[7px] text-black/30">
                    <span className="font-bold">Powered by</span>
                    <span className="font-black text-black">PasmenPasara</span>
                </div>
            </div>

            <div className="h-4"></div>
        </div>
    );

    return (
        <div id="receipt-content" className="bg-white p-0">
            {renderSingleReceipt("Kitchen Copy", true)}
            {renderSingleReceipt("Customer Copy", false)}
            <div className="h-12"></div>
        </div>
    );
};

export default Receipt;
