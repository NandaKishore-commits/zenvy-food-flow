import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Package, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { listMyOrdersWithItems, type OrderWithItems } from "@/services/orders";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";

export default function OrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    listMyOrdersWithItems(user.id)
      .then((d) => !cancelled && setOrders(d))
      .catch(() => !cancelled && toast({ title: "Couldn't load orders", variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user, toast]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="font-heading text-xl font-bold">My Orders</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-card animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Your orders will show up here once you place one.</p>
            <Button onClick={() => navigate("/dashboard")}>Browse restaurants</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o, i) => (
              <motion.button
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="w-full text-left bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {o.restaurants?.image_url ? (
                      <img src={o.restaurants.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Receipt className="w-6 h-6 text-muted-foreground m-auto mt-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{o.restaurants?.name ?? "Order"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleString()}
                        </p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 truncate">
                      {o.order_items.map((it) => `${it.quantity}× ${it.name_snapshot}`).join(", ")}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{o.order_items.length} item(s)</span>
                      <span className="font-heading font-bold">₹{Number(o.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}