import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { OrderWithItems, OrderStatus } from "@/services/orders";
import { getOrderWithItems } from "@/services/orders";

/**
 * Subscribe to live status updates for a single order.
 * Returns the latest order snapshot, loading state, and any error.
 */
export function useOrderRealtime(orderId: string | undefined) {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    setLoading(true);
    getOrderWithItems(orderId)
      .then((o) => {
        if (!cancelled) {
          setOrder(o);
          if (!o) setError("Order not found");
        }
      })
      .catch(() => !cancelled && setError("Could not load order"))
      .finally(() => !cancelled && setLoading(false));

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = payload.new as { status: OrderStatus };
          setOrder((prev) => (prev ? { ...prev, status: next.status } : prev));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  return { order, loading, error };
}