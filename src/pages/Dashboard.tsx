import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, ShoppingCart, Plus, Minus, X, ArrowLeft, Leaf, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { restaurants, menuItems, categories, type Restaurant, type MenuItem } from "@/data/mockData";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const { items: cartItems, addItem, removeItem, clearCart, total, count } = useCart();
  const { toast } = useToast();

  const filtered = restaurants.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.cuisine.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === "All" || r.cuisine === selectedCategory;
    return matchSearch && matchCategory;
  });

  const restaurantMenu = selectedRestaurant ? menuItems.filter((m) => m.restaurantId === selectedRestaurant.id) : [];

  const placeOrder = () => {
    toast({ title: "Order placed! 🎉", description: "Your food is being prepared." });
    clearCart();
    setCartOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="font-heading text-2xl font-bold text-gradient">Zenvy</Link>
          <div className="flex items-center gap-3">
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
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search restaurants or food..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => { setSelectedCategory(cat); setSelectedRestaurant(null); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedRestaurant ? (
            /* Menu View */
            <motion.div key="menu" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <button onClick={() => setSelectedRestaurant(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to restaurants
              </button>
              <div className="relative rounded-xl overflow-hidden mb-6 h-48">
                <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h2 className="font-heading text-2xl font-bold text-secondary-foreground">{selectedRestaurant.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-secondary-foreground/80">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-primary text-primary" />{selectedRestaurant.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedRestaurant.deliveryTime}</span>
                    <span>{selectedRestaurant.priceRange}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {restaurantMenu.map((item) => (
                  <MenuItemCard key={item.id} item={item} onAdd={() => { addItem(item); toast({ title: `${item.name} added to cart` }); }} />
                ))}
              </div>
            </motion.div>
          ) : (
            /* Restaurant Grid */
            <motion.div key="restaurants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">No restaurants found.</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedRestaurant(r)}
                      className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer group">
                      <div className="relative h-40 overflow-hidden">
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        {r.featured && <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">Featured</Badge>}
                      </div>
                      <div className="p-4">
                        <h3 className="font-heading font-semibold text-lg">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.cuisine}</p>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-primary text-primary" />{r.rating}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.deliveryTime}</span>
                          <span>{r.priceRange}</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-heading text-lg font-bold">Your Cart ({count})</h3>
                <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}><X className="w-5 h-5" /></Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">Your cart is empty.</p>
                ) : cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => removeItem(item.id)}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm font-medium w-5 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => addItem(item)}><Plus className="w-3 h-3" /></Button>
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
                  <Button className="w-full" size="lg" onClick={placeOrder}>Place Order</Button>
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
      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{item.name}</h4>
          {item.isVeg && <Leaf className="w-3.5 h-3.5 text-accent flex-shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        <p className="font-heading font-semibold mt-1">₹{item.price}</p>
      </div>
      <Button size="sm" onClick={onAdd} className="flex-shrink-0 gap-1">
        <Plus className="w-4 h-4" /> Add
      </Button>
    </div>
  );
}
