import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, ShoppingCart, Plus, Minus, X, ArrowLeft, Leaf, LogOut, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCart, type CartMenuItem } from "@/hooks/useCart";
import { useAuth } from "@/contexts/AuthContext";
import {
  listRestaurants,
  getRestaurantWithMenu,
  placeOrder,
  toggleFavorite,
  getAll,
  type Row,
} from "@/services/dataLayer";

type Restaurant = Row<"restaurants">;
type MenuItem = Row<"menu_items">;

const ALL = "All";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { items: cartItems, addItem, removeItem, clearCart, total, count } = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [placing, setPlacing] = useState(false);

  // ---- Fetch restaurants (with debounced search/category filter) -----------
  useEffect(() => {
    let cancelled = false;
    setRestaurantsLoading(true);
    const handle = setTimeout(async () => {
      try {
        const { data } = await listRestaurants({
          search: search.trim() || undefined,
          cuisine: selectedCategory,
        });
        if (!cancelled) setRestaurants(data);
      } catch (e) {
        if (!cancelled) toast({ title: "Failed to load restaurants", variant: "destructive" });
      } finally {
        if (!cancelled) setRestaurantsLoading(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [search, selectedCategory, toast]);

  // ---- Fetch menu when a restaurant is opened ------------------------------
  useEffect(() => {
    if (!selectedRestaurant) { setMenu([]); return; }
    let cancelled = false;
    setMenuLoading(true);
    getRestaurantWithMenu(selectedRestaurant.id)
      .then((res) => {
        if (cancelled) return;
        const items = (res?.menu_items ?? []) as MenuItem[];
        setMenu(items.filter((i) => i.available));
      })
      .catch(() => !cancelled && toast({ title: "Failed to load menu", variant: "destructive" }))
      .finally(() => !cancelled && setMenuLoading(false));
    return () => { cancelled = true; };
  }, [selectedRestaurant, toast]);

  // ---- Load user's favorites -----------------------------------------------
  useEffect(() => {
    if (!user) return;
    getAll("favorites", { filters: { user_id: user.id }, pageSize: 100 })
      .then(({ data }) => setFavorites(new Set(data.map((f) => f.restaurant_id))))
      .catch(() => { /* non-blocking */ });
  }, [user]);

  // ---- Categories from loaded data -----------------------------------------
  const categories = useMemo(() => {
    const set = new Set<string>(restaurants.map((r) => r.cuisine));
    return [ALL, ...Array.from(set).sort()];
  }, [restaurants]);

  const handleToggleFavorite = async (restaurantId: string) => {
    if (!user) return;
    const isFav = favorites.has(restaurantId);
    // optimistic
    setFavorites((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(restaurantId) : next.add(restaurantId);
      return next;
    });
    try {
      await toggleFavorite(user.id, restaurantId);
    } catch {
      // rollback
      setFavorites((prev) => {
        const next = new Set(prev);
        isFav ? next.add(restaurantId) : next.delete(restaurantId);
        return next;
      });
      toast({ title: "Couldn't update favorite", variant: "destructive" });
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cartItems.length === 0) return;
    const restaurantId = cartItems[0].restaurant_id;
    setPlacing(true);
    try {
      await placeOrder({
        userId: user.id,
        restaurantId,
        items: cartItems.map((c) => ({
          menu_item_id: c.id,
          name_snapshot: c.name,
          price_snapshot: c.price,
          quantity: c.quantity,
        })),
      });
      toast({ title: "Order placed! 🎉", description: "Your food is being prepared." });
      clearCart();
      setCartOpen(false);
    } catch (e: any) {
      toast({ title: "Failed to place order", description: e?.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-2xl font-bold text-gradient">Zenvy</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="icon" className="relative" onClick={() => setCartOpen(true)}>
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants or food..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setSelectedCategory(cat); setSelectedRestaurant(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedRestaurant ? (
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button
                onClick={() => setSelectedRestaurant(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to restaurants
              </button>
              <div className="relative rounded-xl overflow-hidden mb-6 h-48">
                <img
                  src={selectedRestaurant.image_url ?? ""}
                  alt={selectedRestaurant.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h2 className="font-heading text-2xl font-bold text-secondary-foreground">
                    {selectedRestaurant.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-secondary-foreground/80">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />{Number(selectedRestaurant.rating)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{selectedRestaurant.delivery_time}
                    </span>
                    <span>{selectedRestaurant.price_range}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {menuLoading ? (
                  <p className="text-center text-muted-foreground py-12">Loading menu…</p>
                ) : menu.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No items available.</p>
                ) : menu.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onAdd={() => {
                      const cartItem: CartMenuItem = {
                        id: item.id,
                        restaurant_id: item.restaurant_id,
                        name: item.name,
                        description: item.description,
                        price: Number(item.price),
                        image_url: item.image_url,
                        is_veg: item.is_veg,
                      };
                      // Prevent mixing restaurants in the same order
                      if (cartItems.length > 0 && cartItems[0].restaurant_id !== item.restaurant_id) {
                        toast({
                          title: "Different restaurant",
                          description: "Place or clear your current order before adding from another restaurant.",
                          variant: "destructive",
                        });
                        return;
                      }
                      addItem(cartItem);
                      toast({ title: `${item.name} added to cart` });
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="restaurants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {restaurantsLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-card rounded-xl overflow-hidden shadow-card animate-pulse">
                      <div className="h-40 bg-muted" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : restaurants.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No restaurants found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {restaurants.map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer group relative"
                    >
                      <div className="relative h-40 overflow-hidden" onClick={() => setSelectedRestaurant(r)}>
                        <img
                          src={r.image_url ?? ""}
                          alt={r.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {r.featured && (
                          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Featured</Badge>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleFavorite(r.id); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur grid place-items-center hover:bg-background transition-colors"
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          className={`w-4 h-4 ${favorites.has(r.id) ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        />
                      </button>
                      <div className="p-4" onClick={() => setSelectedRestaurant(r)}>
                        <h3 className="font-heading font-semibold text-lg">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.cuisine}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-primary text-primary" />{Number(r.rating)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{r.delivery_time}
                          </span>
                          <span>{r.price_range}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-heading text-lg font-bold">Your Cart ({count})</h3>
                <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Your cart is empty.</p>
                ) : cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <img src={item.image_url ?? ""} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeItem(item.id)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addItem(item)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {cartItems.length > 0 && (
                <div className="p-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between font-heading font-bold text-lg">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? "Placing…" : "Place Order"}
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-card rounded-xl p-4 shadow-card hover:shadow-hover transition-shadow">
      <img src={item.image_url ?? ""} alt={item.name} className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{item.name}</h4>
          {item.is_veg && <Leaf className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
        </div>
        {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
        <p className="font-heading font-semibold mt-1">₹{Number(item.price)}</p>
      </div>
      <Button size="sm" onClick={onAdd} className="flex-shrink-0 gap-1">
        <Plus className="w-4 h-4" /> Add
      </Button>
    </div>
  );
}
