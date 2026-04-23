import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/services/orders";

const LABELS: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: "Pending", className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  preparing: { label: "Preparing", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
  out_for_delivery: { label: "On the way", className: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30" },
  delivered: { label: "Delivered", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Cancelled", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = LABELS[status];
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}