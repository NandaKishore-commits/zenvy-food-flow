import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/services/orders";

const LABELS: Record<OrderStatus, { label: string; className: string }> = {
  placed: { label: "Pending", className: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", className: "bg-primary/10 text-primary border-primary/30" },
  preparing: { label: "Preparing", className: "bg-secondary/15 text-secondary-foreground border-secondary/30" },
  out_for_delivery: { label: "On the way", className: "bg-primary/15 text-primary border-primary/40" },
  delivered: { label: "Delivered", className: "bg-accent/15 text-accent border-accent/30" },
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