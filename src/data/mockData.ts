export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceRange: string;
  image: string;
  featured?: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export const restaurants: Restaurant[] = [
  { id: "r1", name: "Burger Barn", cuisine: "American", rating: 4.5, deliveryTime: "20-30 min", priceRange: "$$", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", featured: true },
  { id: "r2", name: "Sushi Palace", cuisine: "Japanese", rating: 4.8, deliveryTime: "25-35 min", priceRange: "$$$", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop" },
  { id: "r3", name: "Pizza Planet", cuisine: "Italian", rating: 4.3, deliveryTime: "15-25 min", priceRange: "$$", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop", featured: true },
  { id: "r4", name: "Taco Town", cuisine: "Mexican", rating: 4.6, deliveryTime: "20-30 min", priceRange: "$", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop" },
  { id: "r5", name: "Wok Express", cuisine: "Chinese", rating: 4.2, deliveryTime: "25-35 min", priceRange: "$$", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop" },
  { id: "r6", name: "Curry House", cuisine: "Indian", rating: 4.7, deliveryTime: "30-40 min", priceRange: "$$", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop", featured: true },
  { id: "r7", name: "Green Bowl", cuisine: "Healthy", rating: 4.4, deliveryTime: "15-20 min", priceRange: "$", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop" },
  { id: "r8", name: "BBQ Brothers", cuisine: "BBQ", rating: 4.1, deliveryTime: "30-45 min", priceRange: "$$$", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&h=300&fit=crop" },
];

export const menuItems: MenuItem[] = [
  // Burger Barn
  { id: "m1", restaurantId: "r1", name: "Classic Smash Burger", description: "Double patty with cheese, lettuce, tomato", price: 199, category: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop", isVeg: false },
  { id: "m2", restaurantId: "r1", name: "Crispy Chicken Burger", description: "Buttermilk fried chicken with slaw", price: 179, category: "Burgers", image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&h=200&fit=crop", isVeg: false },
  { id: "m3", restaurantId: "r1", name: "Loaded Fries", description: "Cheese, bacon, jalapeños", price: 129, category: "Sides", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&h=200&fit=crop", isVeg: true },
  // Sushi Palace
  { id: "m4", restaurantId: "r2", name: "Salmon Nigiri Set", description: "8 pieces of premium salmon nigiri", price: 449, category: "Sushi", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=200&fit=crop", isVeg: false },
  { id: "m5", restaurantId: "r2", name: "Dragon Roll", description: "Eel, avocado, cucumber", price: 349, category: "Rolls", image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=200&h=200&fit=crop", isVeg: false },
  // Pizza Planet
  { id: "m6", restaurantId: "r3", name: "Margherita Pizza", description: "Fresh mozzarella, basil, tomato sauce", price: 249, category: "Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop", isVeg: true },
  { id: "m7", restaurantId: "r3", name: "Pepperoni Feast", description: "Double pepperoni, mozzarella", price: 299, category: "Pizza", image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=200&fit=crop", isVeg: false },
  { id: "m8", restaurantId: "r3", name: "Garlic Bread", description: "With herbs and butter", price: 99, category: "Sides", image: "https://images.unsplash.com/photo-1619535860434-ba1f915b0569?w=200&h=200&fit=crop", isVeg: true },
  // Taco Town
  { id: "m9", restaurantId: "r4", name: "Chicken Tacos", description: "3 tacos with salsa and guacamole", price: 179, category: "Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&h=200&fit=crop", isVeg: false },
  { id: "m10", restaurantId: "r4", name: "Veggie Burrito Bowl", description: "Rice, beans, veggies, sour cream", price: 159, category: "Bowls", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=200&fit=crop", isVeg: true },
  // Wok Express
  { id: "m11", restaurantId: "r5", name: "Kung Pao Chicken", description: "Spicy chicken with peanuts", price: 219, category: "Mains", image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=200&fit=crop", isVeg: false },
  { id: "m12", restaurantId: "r5", name: "Veg Fried Rice", description: "Wok-tossed vegetables with rice", price: 149, category: "Rice", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop", isVeg: true },
  // Curry House
  { id: "m13", restaurantId: "r6", name: "Butter Chicken", description: "Creamy tomato-based curry", price: 259, category: "Curry", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&h=200&fit=crop", isVeg: false },
  { id: "m14", restaurantId: "r6", name: "Paneer Tikka Masala", description: "Grilled paneer in spiced gravy", price: 229, category: "Curry", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&h=200&fit=crop", isVeg: true },
  { id: "m15", restaurantId: "r6", name: "Garlic Naan", description: "Freshly baked with garlic butter", price: 49, category: "Breads", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop", isVeg: true },
  // Green Bowl
  { id: "m16", restaurantId: "r7", name: "Açaí Bowl", description: "Topped with granola and berries", price: 199, category: "Bowls", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop", isVeg: true },
  // BBQ Brothers
  { id: "m17", restaurantId: "r8", name: "Smoked Brisket Plate", description: "Slow-smoked with coleslaw and pickles", price: 399, category: "BBQ", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=200&h=200&fit=crop", isVeg: false },
];

export const categories = ["All", "American", "Japanese", "Italian", "Mexican", "Chinese", "Indian", "Healthy", "BBQ"];
