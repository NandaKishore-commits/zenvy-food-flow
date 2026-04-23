import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/common/ConfirmationModal";
import { useToast } from "@/hooks/use-toast";
import { cancelMyOrder, type OrderStatus } from "@/services/orders";
import { cn } from "@/lib/utils";

const CANCELABLE: OrderStatus[] = ["placed", "confirmed"];

interface Props extends Omit<ButtonProps, "onClick"> {
  orderId: string;
  status: OrderStatus;
  onCancelled?: () => void;
  label?: string;
}

/**
 * Cancel-order CTA. Disabled (with explanatory tooltip text) once the
 * order has moved past the 'confirmed' stage. Opens a confirmation modal
 * before calling the secure RPC.
 */
export function CancelOrderButton({
  orderId,
  status,
  onCancelled,
  label = "Cancel order",
  className,
  variant = "outline",
  size,
  ...rest
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const allowed = CANCELABLE.includes(status);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await cancelMyOrder(orderId);
      toast({ title: "Order cancelled successfully" });
      setOpen(false);
      onCancelled?.();
    } catch (e: any) {
      toast({
        title: "Couldn't cancel order",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={!allowed || loading}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          allowed && "text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30",
          className,
        )}
        title={allowed ? undefined : "This order can no longer be cancelled"}
        {...rest}
      >
        <XCircle className="w-4 h-4 mr-2" />
        {label}
      </Button>
      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        title="Are you sure you want to cancel this order?"
        description="This can't be undone. If you've already paid, the amount will be refunded to your original payment method."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        destructive
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
}