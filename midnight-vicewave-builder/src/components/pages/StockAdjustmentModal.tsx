import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { adjustStock } from "@/api/features";
import { AdjustmentType } from "@/api/models";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StockAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    onAdjustmentSuccess: (newStock: number) => void;
}

const adjustmentOptions = [
    { value: AdjustmentType.WASTAGE, label: 'Wastage (-)' },
    { value: AdjustmentType.SPOILAGE, label: 'Spoilage (-)' },
    { value: AdjustmentType.LEFTOVER, label: 'Leftover (-)' },
    { value: AdjustmentType.CUSTOM_ADD, label: 'Add Stock (+)' },
    { value: AdjustmentType.CUSTOM_DEDUCT, label: 'Deduct Stock (-)' },
    { value: AdjustmentType.SYSTEM_CORRECTION_ADD, label: 'System Reconciliation (+)' },
    { value: AdjustmentType.SYSTEM_CORRECTION_DEDUCT, label: 'System Reconciliation (-)' },
];

export const StockAdjustmentModal = ({ isOpen, onClose, item, onAdjustmentSuccess }: StockAdjustmentModalProps) => {
    const [adjustmentType, setAdjustmentType] = useState<string>(AdjustmentType.CUSTOM_ADD);
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const currentStock = parseFloat((['rawitems', 'mainstorerawitems'].includes(item?.itemType)
        ? item?.quantity_in_stock
        : item?.self_quantity_in_stock) || '0');

    const handleSubmit = async () => {
        if (!quantity || parseFloat(quantity) <= 0) {
            toast({
                title: "Invalid Quantity",
                description: "Please enter a quantity greater than zero.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await adjustStock({
                item_type: item.itemType === 'rawitems'
                    ? 'RAW'
                    : item.itemType === 'mainstorerawitems'
                        ? 'MAIN_STORE_RAW'
                        : (item.itemType === 'products' ? 'PRODUCT' : 'CUSTOM'),
                item_id: item.id,
                adjustment_type: adjustmentType,
                quantity: parseFloat(quantity),
                reason: reason
            });

            toast({
                title: "Success",
                description: response.message || "Stock adjusted successfully.",
            });

            onAdjustmentSuccess(response.new_stock);
            onClose();
            // Reset form
            setQuantity('');
            setReason('');
            setAdjustmentType(AdjustmentType.CUSTOM_ADD);
        } catch (error: any) {
            toast({
                title: "Adjustment Failed",
                description: error.message || "Failed to adjust stock.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDeduction = [AdjustmentType.WASTAGE, AdjustmentType.SPOILAGE, AdjustmentType.LEFTOVER, AdjustmentType.CUSTOM_DEDUCT, AdjustmentType.SYSTEM_CORRECTION_DEDUCT].includes(adjustmentType as AdjustmentType);
    const willBeNegative = isDeduction && (currentStock - parseFloat(quantity || '0')) < 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass glass-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="text-foreground font-bold text-xl">Adjust Stock: {item?.name}</DialogTitle>
                    <DialogDescription className="text-muted-foreground font-futuristic">
                        Record stock movements manually for wastage, spoilage, or custom corrections.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="adjustment-type" className="text-sm font-futuristic">Adjustment Type</Label>
                        <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                            <SelectTrigger id="adjustment-type" className="bg-muted/50 border-border">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="glass border-border">
                                {adjustmentOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value} className="focus:bg-muted">
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-sm font-futuristic">Quantity ({item?.unit || 'units'})</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0"
                            step="0.01"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="0.00"
                            className="bg-muted/50 border-border"
                        />
                        <div className="flex justify-between text-xs mt-1">
                            <span className="text-muted-foreground">Current: {currentStock} {item?.unit}</span>
                            {quantity && (
                                <span className={cn(willBeNegative ? "text-red-500 font-bold" : "text-foreground font-semibold")}>
                                    Result: {(currentStock + (isDeduction ? -parseFloat(quantity) : parseFloat(quantity))).toFixed(2)}
                                </span>
                            )}
                        </div>
                        {willBeNegative && (
                            <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1 animate-pulse">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Insufficient stock for this deduction.
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-futuristic">Reason / Notes</Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Why is this stock being adjusted?"
                            className="bg-muted/50 border-border min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="border-border/50 hover:bg-accent">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || willBeNegative || !quantity}
                        className="bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg border border-border disabled:opacity-50"
                    >
                        {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</> : 'Apply Adjustment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
