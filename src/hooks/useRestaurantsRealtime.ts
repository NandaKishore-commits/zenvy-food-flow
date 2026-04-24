import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listRestaurants } from "@/services/dataLayer";
import type { Database } from "@/integrations/supabase/types";

type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type Favorite = Database["public"]["Tables"]["favorites"]["Row"];

interface Options {
  /** When provided, also tracks this user's favorite restaurant ids in real time. */
  userId?: string | null;
  /** Forwarded to listRestaurants on initial load and search changes. */
  search?: string;
  cuisine?: string;
}

/**
 * Live restaurant directory.
 *
 * Subscribes to:
 *  - `restaurants`  → add / edit / remove restaurants instantly
 *  - `menu_items`   → bumps the affected restaurant so menu changes propagate
 *  - `favorites`    → keeps the current user's favorite-ids in sync across tabs
 */
export function useRestaurantsRealtime({ userId, search, cuisine }: Options = {}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track latest filters in a ref so realtime callbacks always re-query with
  // the current search/cuisine without re-subscribing.
  const filtersRef = useRef({ search, cuisine });
  filtersRef.current = { search, cuisine };

  const refetch = useCallback(async () => {
    try {
      const { data } = await listRestaurants(filtersRef.current);
      setRestaurants(data);
    } catch {
      setError("Could not load restaurants");
    }
  }, []);

  // Initial + filter-change load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listRestaurants({ search, cuisine })
      .then(({ data }) => !cancelled && setRestaurants(data))
      .catch(() => !cancelled && setError("Could not load restaurants"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, cuisine]);

  // Initial favorites load
  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set());
      return;
    }
    let cancelled = false;
    supabase
      .from("favorites")
      .select("restaurant_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setFavoriteIds(new Set(data.map((f) => f.restaurant_id)));
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("restaurants-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "restaurants" },
        (payload) => {
          // Re-query so server-side ordering / filters are respected.
          void refetch();
          // Best-effort optimistic prepend if it matches no active filter:
          const row = payload.new as Restaurant;
          setRestaurants((prev) =>
            prev.some((r) => r.id === row.id) ? prev : [row, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "restaurants" },
        (payload) => {
          const row = payload.new as Restaurant;
          setRestaurants((prev) => prev.map((r) => (r.id === row.id ? row : r)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "restaurants" },
        (payload) => {
          const row = payload.old as Restaurant;
          setRestaurants((prev) => prev.filter((r) => r.id !== row.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        (payload) => {
          // A dish changed → bump the parent restaurant's updated_at so
          // consumers re-render. The full menu is fetched lazily by detail
          // pages, so we don't store it here.
          const row = (payload.new ?? payload.old) as MenuItem;
          setRestaurants((prev) =>
            prev.map((r) =>
              r.id === row.restaurant_id
                ? { ...r, updated_at: new Date().toISOString() }
                : r,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Per-user favorites channel (separate so it can be skipped for guests)
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`favorites-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "favorites",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            if (payload.eventType === "INSERT") {
              next.add((payload.new as Favorite).restaurant_id);
            } else if (payload.eventType === "DELETE") {
              next.delete((payload.old as Favorite).restaurant_id);
            }
            return next;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return { restaurants, favoriteIds, loading, error, refetch };
}