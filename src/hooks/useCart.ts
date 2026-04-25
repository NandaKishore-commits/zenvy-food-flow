import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export interface CartMenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
}

export interface CartItem extends CartMenuItem {
  quantity: number;
}

const STORAGE_PREFIX = "zenvy.cart.";
const GUEST_KEY = `${STORAGE_PREFIX}guest`;

function readCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function useCart() {
  const { user } = useAuth();
  // Per-user storage key; falls back to a guest cart before login.
  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : GUEST_KEY;

  const [items, setItems] = useState<CartItem[]>(() => readCart(storageKey));
  const lastKeyRef = useRef(storageKey);

  // When the active user changes (login / logout / switch account),
  // load that user's saved cart so each account keeps its own items.
  useEffect(() => {
    if (lastKeyRef.current === storageKey) return;
    lastKeyRef.current = storageKey;
    setItems(readCart(storageKey));
  }, [storageKey]);

  // Persist on every change so a refresh restores the cart.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (items.length === 0) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(items));
      }
    } catch {
      // Ignore quota / privacy-mode errors — cart will simply not persist.
    }
  }, [items, storageKey]);

  // Sync across tabs for the same user.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey) return;
      setItems(readCart(storageKey));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey]);

  const addItem = useCallback((item: CartMenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((i) => i.id === id ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { items, addItem, removeItem, clearCart, total, count };
}
