import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHasRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import {
  listAllOrdersAdmin,
  advanceOrderStatus,
  type OrderWithItems,
  type OrderStatus,
} from "@/services/orders";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

const NEXT_STATUS: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  placed: { label: "Confirm", next: "confirmed" },
  confirmed: { label: "Start preparing", next: "preparing" },
  preparing: { label: "Send for delivery", next: "out_for_delivery" },
  out_for_delivery: { label: "Mark delivered", next: "delivered" },
};

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = useHasRole("admin");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isAdmin === false) return;
    if (isAdmin !== true) return;
    let cancelled = false;
    setLoading(true);
    listAllOrdersAdmin()
      .then((d) => !cancelled && setOrders(d))
      .catch(() => !cancelled && toast({ title: "Couldn't load orders", variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));

    // Live subscribe so admin sees new orders as they arrive
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        listAllOrdersAdmin().then((d) => !cancelled && setOrders(d));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, toast]);

  const handleAdvance = async (orderId: string, next: OrderStatus) => {
    if (busyId) return;
    setBusyId(orderId);
    try {
      await advanceOrderStatus(orderId, next);
      toast({ title: "Status updated" });
    } catch (e: any) {
      const msg = /invalid transition/i.test(e?.message ?? "")
        ? "Order already moved to the next stage."
        : e?.message;
      toast({ title: "Update failed", description: msg, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading || isAdmin === null) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Checking access…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Admin only</h1>
          <p className="text-muted-foreground mb-6">
            This page is restricted to admins. To grant yourself the admin role, insert a row into <code className="bg-muted px-1 rounded">user_roles</code> with your user id and role <code className="bg-muted px-1 rounded">admin</code>.
          </p>
          <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-heading text-xl font-bold">Admin · Orders</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const action = NEXT_STATUS[o.status];
              const isBusy = busyId === o.id;
              return (
                <div key={o.id} className="bg-card rounded-xl p-4 shadow-card border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="font-semibold mt-1">{o.restaurants?.name ?? "Order"}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {o.order_items.map((it) => `${it.quantity}× ${it.name_snapshot}`).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(o.created_at).toLocaleString()} · ₹{Number(o.total).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {action && (
                        <Button
                          size="sm"
                          disabled={isBusy || busyId !== null}
                          onClick={() => handleAdvance(o.id, action.next)}
                        >
                          {isBusy ? "…" : action.label}
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/orders/${o.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}