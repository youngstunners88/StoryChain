import { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  User, 
  MapPin, 
  Star, 
  Clock, 
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  Bike,
  Phone,
  CheckCircle2,
  Zap,
  Flame,
  UtensilsCrossed,
  ShoppingCart,
  Leaf,
  Coffee,
  Pizza
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster, toast } from 'sonner';

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  popular?: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  menu: MenuItem[];
}

interface CartItem extends MenuItem {
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

interface Order {
  id: string;
  restaurantName: string;
  items: CartItem[];
  total: number;
  status: 'preparing' | 'ready' | 'delivering' | 'delivered';
  estimatedTime: string;
  driverName?: string;
  driverPhone?: string;
  createdAt: Date;
}

// Mock Data
const categories = [
  { id: 'all', name: 'All', icon: UtensilsCrossed },
  { id: 'fastfood', name: 'Fast Food', icon: Flame },
  { id: 'groceries', name: 'Groceries', icon: ShoppingCart },
  { id: 'fresh', name: 'Fresh', icon: Leaf },
  { id: 'pizza', name: 'Pizza', icon: Pizza },
  { id: 'coffee', name: 'Coffee', icon: Coffee },
];

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Ekasi Fresh Produce',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    rating: 4.8,
    reviews: 234,
    deliveryTime: '25-40 min',
    deliveryFee: 15,
    minOrder: 50,
    categories: ['fresh', 'groceries'],
    menu: [
      { id: '1-1', name: 'Fresh Veggie Pack', description: 'Tomatoes, onions, spinach, carrots & peppers', price: 85, image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=200&h=200&fit=crop', category: 'fresh', popular: true },
      { id: '1-2', name: 'Fruit Basket', description: 'Apples, bananas, oranges & seasonal fruits', price: 120, image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop', category: 'fresh' },
      { id: '1-3', name: 'Cooking Essentials', description: 'Cooking oil, salt, sugar & spices', price: 95, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop', category: 'groceries' },
    ]
  },
  {
    id: '2',
    name: 'Soweto Kitchen',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop',
    rating: 4.6,
    reviews: 189,
    deliveryTime: '30-45 min',
    deliveryFee: 20,
    minOrder: 60,
    categories: ['fastfood'],
    menu: [
      { id: '2-1', name: 'Kota Special', description: 'Quarter loaf with chips, polony, cheese & atchar', price: 45, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=200&fit=crop', category: 'fastfood', popular: true },
      { id: '2-2', name: 'Braai Plate', description: 'Pap, wors, chops & chakalaka', price: 95, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop', category: 'fastfood', popular: true },
      { id: '2-3', name: 'Bunny Chow', description: 'Hollowed bread filled with curry', price: 65, image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=200&h=200&fit=crop', category: 'fastfood' },
    ]
  },
  {
    id: '3',
    name: 'Kasi Pizza',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&h=300&fit=crop',
    rating: 4.5,
    reviews: 156,
    deliveryTime: '35-50 min',
    deliveryFee: 25,
    minOrder: 80,
    categories: ['pizza'],
    menu: [
      { id: '3-1', name: 'Meat Lovers', description: 'Beef, chicken, bacon & ham', price: 110, image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=200&h=200&fit=crop', category: 'pizza', popular: true },
      { id: '3-2', name: 'Chicken Tikka', description: 'Tandoori chicken, peppers & onions', price: 95, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop', category: 'pizza' },
      { id: '3-3', name: 'Veggie Supreme', description: 'Mushrooms, peppers, olives & feta', price: 85, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200&h=200&fit=crop', category: 'pizza' },
    ]
  },
  {
    id: '4',
    name: 'Spaza Quick Shop',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=300&fit=crop',
    rating: 4.3,
    reviews: 312,
    deliveryTime: '15-25 min',
    deliveryFee: 10,
    minOrder: 30,
    categories: ['groceries'],
    menu: [
      { id: '4-1', name: 'Snack Pack', description: 'Chips, chocolates & cold drink', price: 55, image: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=200&h=200&fit=crop', category: 'groceries', popular: true },
      { id: '4-2', name: 'Bread & Milk', description: 'Fresh loaf & 2L milk', price: 45, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop', category: 'groceries' },
      { id: '4-3', name: 'Airtime & Data', description: 'Mobile recharge vouchers', price: 30, image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop', category: 'groceries' },
    ]
  },
  {
    id: '5',
    name: 'Kasi Brew',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    rating: 4.7,
    reviews: 98,
    deliveryTime: '20-30 min',
    deliveryFee: 15,
    minOrder: 40,
    categories: ['coffee'],
    menu: [
      { id: '5-1', name: 'Cappuccino', description: 'Rich espresso with frothy milk', price: 28, image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', category: 'coffee', popular: true },
      { id: '5-2', name: 'Muffin Combo', description: 'Fresh muffin with coffee', price: 45, image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=200&h=200&fit=crop', category: 'coffee' },
      { id: '5-3', name: 'Iced Coffee', description: 'Chilled coffee with ice cream', price: 35, image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&h=200&fit=crop', category: 'coffee' },
    ]
  },
];

// Main App Component
function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [location] = useState('Soweto, Johannesburg');

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('ihhashi-cart');
    const savedOrders = localStorage.getItem('ihhashi-orders');
    if (savedCart) setCart(JSON.parse(savedCart));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('ihhashi-cart', JSON.stringify(cart));
  }, [cart]);

  // Save orders to localStorage
  useEffect(() => {
    localStorage.setItem('ihhashi-orders', JSON.stringify(orders));
  }, [orders]);

  const addToCart = (item: MenuItem, restaurant: Restaurant) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.restaurantId === restaurant.id);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.restaurantId === restaurant.id 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, restaurantId: restaurant.id, restaurantName: restaurant.name }];
    });
    toast.success(`Added ${item.name} to cart`);
  };

  const removeFromCart = (itemId: string, restaurantId: string) => {
    setCart(prev => prev.filter(i => !(i.id === itemId && i.restaurantId === restaurantId)));
  };

  const updateQuantity = (itemId: string, restaurantId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId && item.restaurantId === restaurantId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const placeOrder = () => {
    if (cart.length === 0) return;
    
    const order: Order = {
      id: `ORD${Date.now()}`,
      restaurantName: cart[0].restaurantName,
      items: [...cart],
      total: getCartTotal() + 25, // Including delivery fee
      status: 'preparing',
      estimatedTime: '30-45 min',
      driverName: 'Thabo M.',
      driverPhone: '+27 82 123 4567',
      createdAt: new Date(),
    };
    
    setOrders(prev => [order, ...prev]);
    setCurrentOrder(order);
    setOrderDialogOpen(true);
    clearCart();
    setCartOpen(false);
    toast.success('Order placed successfully!');
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesCategory = selectedCategory === 'all' || r.categories.includes(selectedCategory);
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         r.menu.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Home Screen
  const HomeScreen = () => (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#FFD700] safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-black">iHhashi</h1>
                <p className="text-xs text-black/70">Delivering to</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-black">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium truncate max-w-[120px]">{location}</span>
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black/50" />
            <Input 
              placeholder="Search food, groceries..."
              className="pl-10 h-12 bg-white/90 border-0 rounded-xl text-black placeholder:text-black/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-180px)]">
        {/* Categories */}
        <div className="px-4 py-4">
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-xl transition-all ${
                    selectedCategory === cat.id 
                      ? 'bg-black text-[#FFD700]' 
                      : 'bg-white text-black'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium whitespace-nowrap">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="px-4 mb-4">
          <Card className="bg-gradient-to-r from-black to-gray-900 text-[#FFD700] border-0 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-[#FFD700] text-black mb-2">NEW</Badge>
                  <h3 className="text-lg font-bold">Empty Fridge?</h3>
                  <p className="text-sm text-white/80">Full feast! iHhashi delivers</p>
                  <p className="text-xs text-white/60 mt-1">Free delivery on first order</p>
                </div>
                <div className="w-20 h-20 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                  <Bike className="w-10 h-10 text-[#FFD700]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Restaurants */}
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-black">Popular Near You</h2>
            <Button variant="ghost" size="sm" className="text-black text-sm">
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {filteredRestaurants.map(restaurant => (
              <Card 
                key={restaurant.id} 
                className="overflow-hidden border-0 shadow-md cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <div className="relative h-32">
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
                    <span className="text-sm font-bold">{restaurant.rating}</span>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-black">{restaurant.name}</h3>
                      <p className="text-xs text-gray-500">{restaurant.categories.join(' • ')}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime}</span>
                      </div>
                      <p className="text-xs text-gray-500">R{restaurant.deliveryFee} delivery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-black mb-3">Quick Order</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-md bg-black text-[#FFD700]">
              <CardContent className="p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">Groceries</p>
                <p className="text-xs text-white/70">Essentials delivered</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-[#FF6B00] text-white">
              <CardContent className="p-4 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">Fast Food</p>
                <p className="text-xs text-white/70">Hot & fresh</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // Restaurant Detail Screen
  const RestaurantDetail = ({ restaurant }: { restaurant: Restaurant }) => (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-[#FFD700] safe-area-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="bg-black/10 hover:bg-black/20"
            onClick={() => setSelectedRestaurant(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold truncate">{restaurant.name}</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        {/* Restaurant Header */}
        <div className="relative h-48">
          <img 
            src={restaurant.image} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#FFD700] text-black">
                <Star className="w-3 h-3 mr-1 fill-current" />
                {restaurant.rating}
              </Badge>
              <span className="text-sm">({restaurant.reviews} reviews)</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {restaurant.deliveryTime}
              </span>
              <span>R{restaurant.deliveryFee} delivery</span>
              <span>Min R{restaurant.minOrder}</span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-black mb-3">Menu</h2>
          <div className="space-y-3">
            {restaurant.menu.map(item => (
              <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-black">{item.name}</h3>
                          {item.popular && (
                            <Badge className="bg-[#FF6B00] text-white text-xs mt-1">Popular</Badge>
                          )}
                        </div>
                        <p className="font-bold text-black">R{item.price}</p>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-black text-[#FFD700] hover:bg-black/90"
                        onClick={() => addToCart(item, restaurant)}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // Orders Screen
  const OrdersScreen = () => (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-[#FFD700] safe-area-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-black text-black">My Orders</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="px-4 py-4">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto text-black/30 mb-4" />
              <h3 className="text-lg font-bold text-black mb-2">No orders yet</h3>
              <p className="text-gray-500 mb-4">Start ordering from your favorite restaurants</p>
              <Button 
                className="bg-black text-[#FFD700]"
                onClick={() => setActiveTab('home')}
              >
                Browse Restaurants
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm text-gray-500">{order.id}</p>
                        <h3 className="font-bold text-black">{order.restaurantName}</h3>
                      </div>
                      <Badge className={`
                        ${order.status === 'delivered' ? 'bg-green-500' : ''}
                        ${order.status === 'preparing' ? 'bg-[#FFD700] text-black' : ''}
                        ${order.status === 'delivering' ? 'bg-[#FF6B00] text-white' : ''}
                        ${order.status === 'ready' ? 'bg-blue-500 text-white' : ''}
                      `}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {order.items.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{item.quantity}x {item.name}</span>
                          <span className="text-black">R{item.price * item.quantity}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-500">+{order.items.length - 2} more items</p>
                      )}
                    </div>
                    
                    <Separator className="my-3" />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-bold text-black">R{order.total}</p>
                      </div>
                      {order.status !== 'delivered' && (
                        <div className="flex items-center gap-2">
                          <Bike className="w-5 h-5 text-[#FF6B00]" />
                          <span className="text-sm font-medium">{order.estimatedTime}</span>
                        </div>
                      )}
                    </div>
                    
                    {order.status === 'delivering' && order.driverName && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-[#FFD700] rounded-full flex items-center justify-center">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{order.driverName}</p>
                            <p className="text-xs text-gray-500">Your driver</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Phone className="w-4 h-4" /> Call
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Profile Screen
  const ProfileScreen = () => (
    <div className="pb-24">
      <div className="sticky top-0 z-10 bg-[#FFD700] safe-area-top">
        <div className="px-4 py-4">
          <h1 className="text-xl font-black text-black">Profile</h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="px-4 py-4">
          {/* User Info */}
          <Card className="border-0 shadow-md mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#FFD700]" />
                </div>
                <div>
                  <h2 className="font-bold text-black text-lg">Welcome to iHhashi!</h2>
                  <p className="text-gray-500">{location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-black">{orders.length}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-black">R{orders.reduce((s, o) => s + o.total, 0)}</p>
                <p className="text-xs text-gray-500">Spent</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-black">0</p>
                <p className="text-xs text-gray-500">Rewards</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              {[
                { icon: MapPin, label: 'Delivery Addresses', action: () => {} },
                { icon: ShoppingBag, label: 'Order History', action: () => setActiveTab('orders') },
                { icon: Star, label: 'Saved Restaurants', action: () => {} },
                { icon: Phone, label: 'Help & Support', action: () => {} },
              ].map((item, idx, arr) => (
                <div key={item.label}>
                  <button 
                    className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                    onClick={item.action}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-black">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  {idx < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center mt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-black" />
              <span className="font-black text-black text-xl">iHhashi</span>
            </div>
            <p className="text-sm text-gray-500">Version 1.0.0</p>
            <p className="text-xs text-gray-400 mt-1">Empty fridge? Full feast!</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFD700]">
      <Toaster position="top-center" richColors />
      
      {/* Main Content */}
      <div className="max-w-md mx-auto bg-[#FFD700] min-h-screen relative">
        {selectedRestaurant ? (
          <RestaurantDetail restaurant={selectedRestaurant} />
        ) : activeTab === 'home' ? (
          <HomeScreen />
        ) : activeTab === 'orders' ? (
          <OrdersScreen />
        ) : activeTab === 'profile' ? (
          <ProfileScreen />
        ) : null}

        {/* Bottom Navigation */}
        {!selectedRestaurant && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
            <div className="max-w-md mx-auto flex items-center justify-around py-2">
              {[
                { id: 'home', icon: Home, label: 'Home' },
                { id: 'search', icon: Search, label: 'Search' },
                { id: 'orders', icon: ShoppingBag, label: 'Orders' },
                { id: 'profile', icon: User, label: 'Profile' },
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                      isActive ? 'text-black' : 'text-gray-400'
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cart Button */}
        {getCartItemCount() > 0 && !selectedRestaurant && (
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button className="fixed bottom-20 right-4 z-40 bg-black text-[#FFD700] p-4 rounded-full shadow-lg flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                <span className="font-bold">{getCartItemCount()}</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="text-left flex items-center justify-between">
                  <span>Your Cart</span>
                  {cart.length > 0 && (
                    <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600">
                      Clear All
                    </button>
                  )}
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="h-[calc(80vh-200px)] mt-4">
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={`${item.restaurantId}-${item.id}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-black">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.restaurantName}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id, item.restaurantId)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <p className="font-bold text-black mt-1">R{item.price * item.quantity}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button 
                            className="w-8 h-8 bg-black text-[#FFD700] rounded-full flex items-center justify-center"
                            onClick={() => updateQuantity(item.id, item.restaurantId, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold w-8 text-center">{item.quantity}</span>
                          <button 
                            className="w-8 h-8 bg-black text-[#FFD700] rounded-full flex items-center justify-center"
                            onClick={() => updateQuantity(item.id, item.restaurantId, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">R{getCartTotal()}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="font-bold">R25</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-lg">R{getCartTotal() + 25}</span>
                </div>
                <Button 
                  className="w-full h-14 bg-black text-[#FFD700] text-lg font-bold rounded-xl"
                  onClick={placeOrder}
                >
                  Place Order
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        )}

        {/* Order Confirmation Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                Order Confirmed!
              </DialogTitle>
            </DialogHeader>
            {currentOrder && (
              <div className="text-center">
                <p className="text-gray-500 mb-4">Your order from {currentOrder.restaurantName} has been placed</p>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-bold text-black">{currentOrder.id}</p>
                  <p className="text-sm text-gray-500 mt-2">Estimated Delivery</p>
                  <p className="font-bold text-black">{currentOrder.estimatedTime}</p>
                </div>
                <Button 
                  className="w-full bg-black text-[#FFD700]"
                  onClick={() => {
                    setOrderDialogOpen(false);
                    setActiveTab('orders');
                  }}
                >
                  Track Order
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
