import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Wifi } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useOrderRealtime } from "@/hooks/useOrderRealtime";
import { OrderStepper } from "@/components/orders/OrderStepper";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { Button } from "@/components/ui/button";
import { getPaymentForOrder, type PaymentRow } from "@/services/payments";

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { order, loading, error } = useOrderRealtime(id);
  const [payment, setPayment] = useState<PaymentRow | null>(null);

  const refetchPayment = useCallback(() => {
    if (!id) return;
    getPaymentForOrder(id).then(setPayment);
  }, [id]);

  useEffect(() => {
    refetchPayment();
  }, [refetchPayment]);

  // When the order status flips to cancelled, the linked payment was just
  // updated server-side too (paid->refunded / unpaid->cancelled).
  useEffect(() => {
    if (order?.status === "cancelled") refetchPayment();
  }, [order?.status, refetchPayment]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/orders" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Orders
          </Link>
          <h1 className="font-heading text-xl font-bold">Track order</h1>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="w-3 h-3" /> Live
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {loading ? (
          <div className="space-y-3">
            <div className="h-24 rounded-xl bg-card animate-pulse" />
            <div className="h-96 rounded-xl bg-card animate-pulse" />
          </div>
        ) : error || !order ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{error ?? "Order not found"}</p>
            <Button asChild className="mt-4"><Link to="/orders">Back to orders</Link></Button>
          </div>
        ) : (
          <>
            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                  <h2 className="font-heading text-xl font-bold mt-1">{order.restaurants?.name ?? "Order"}</h2>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Placed {new Date(order.created_at).toLocaleString()}
              </div>
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <h3 className="font-heading font-bold mb-4">Progress</h3>
              <OrderStepper status={order.status} />
            </div>

            <div className="bg-card rounded-xl p-5 shadow-card border border-border">
              <h3 className="font-heading font-bold mb-3">Items</h3>
              <div className="space-y-2">
                {order.order_items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span>
                      <span className="text-muted-foreground">{it.quantity}×</span> {it.name_snapshot}
                    </span>
                    <span className="font-medium">₹{(Number(it.price_snapshot) * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span>₹{Number(order.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-heading font-bold text-base pt-1">
                  <span>Total</span><span>₹{Number(order.total).toFixed(2)}</span>
                </div>
                {payment && (
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>Payment ({payment.method.toUpperCase()})</span>
                    <span className={payment.status === "paid" ? "text-accent" : payment.status === "failed" ? "text-destructive" : ""}>
                      {payment.status}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {order.status !== "cancelled" && order.status !== "delivered" && (
              <CancelOrderButton
                orderId={order.id}
                status={order.status}
                className="w-full"
                onCancelled={refetchPayment}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}