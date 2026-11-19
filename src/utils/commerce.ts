import { CartItem, Offer, Order, OrderStatus, OrderType, Product, UserProfile } from '../types';

export const TAX_RATE = 0.05; // 5% Restaurant GST in India
export const DELIVERY_FEE = 20;
export const FREE_DELIVERY_THRESHOLD = 199;

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Completed',
];

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  totalAmount: number;
  couponApplied: boolean;
  couponMessage: string | null;
}

export function calculateCartTotals(
  items: CartItem[],
  offer: Offer | null,
  orderType: OrderType
): CartTotals {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const rawSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = Math.round(rawSubtotal * 100) / 100;

  let discount = 0;
  let couponApplied = false;
  let couponMessage: string | null = null;

  if (offer && offer.active && subtotal > 0) {
    if (subtotal < offer.minOrder) {
      couponMessage = `Add ₹${Math.ceil(offer.minOrder - subtotal)} more to apply ${offer.couponCode}`;
    } else {
      if (offer.discountType === 'percent') {
        discount = Math.round((subtotal * offer.discount) / 100);
      } else {
        discount = Math.min(subtotal, offer.discount);
      }
      couponApplied = true;
      couponMessage = `${offer.couponCode} applied (-₹${discount})`;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = Math.round(discountedSubtotal * TAX_RATE);
  const deliveryFee =
    orderType === 'delivery' && subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;

  const totalAmount = Math.max(0, discountedSubtotal + tax + deliveryFee);

  return {
    itemCount,
    subtotal,
    discount,
    tax,
    deliveryFee,
    totalAmount,
    couponApplied,
    couponMessage,
  };
}

export interface ProductFilterOptions {
  search: string;
  category: string;
  foodType: 'all' | 'veg' | 'non-veg';
  maxPrice: number | null;
  sortBy: 'popularity' | 'price-asc' | 'price-desc';
}

export function filterAndSortProducts(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const query = options.search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (options.category !== 'All' && product.category !== options.category) {
      return false;
    }
    if (options.foodType !== 'all' && product.foodType !== options.foodType) {
      return false;
    }
    if (options.maxPrice !== null && product.price > options.maxPrice) {
      return false;
    }
    if (query) {
      const matchesName = product.name.toLowerCase().includes(query);
      const matchesDesc = product.description.toLowerCase().includes(query);
      const matchesCat = product.category.toLowerCase().includes(query);
      if (!matchesName && !matchesDesc && !matchesCat) {
        return false;
      }
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (options.sortBy === 'price-asc') return a.price - b.price;
    if (options.sortBy === 'price-desc') return b.price - a.price;
    return b.popularity - a.popularity;
  });
}

export interface RegistrationValidationInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function validateRegistrationForm(
  input: RegistrationValidationInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name (at least 2 characters).';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  const digitsOnly = input.phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    errors.phone = 'Please enter a valid 10-digit mobile number.';
  }
  if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }
  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export interface CheckoutValidationInput {
  customerName: string;
  phone: string;
  orderType: OrderType;
  address: string;
}

export function validateCheckoutForm(
  input: CheckoutValidationInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.customerName.trim().length < 2) {
    errors.customerName = 'Customer name is required.';
  }
  const digitsOnly = input.phone.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }
  if (input.orderType === 'delivery' && input.address.trim().length < 8) {
    errors.address = 'Please enter a complete Selaqui / hostel delivery address.';
  }

  return errors;
}

export function canCustomerCancelOrder(status: OrderStatus): boolean {
  return status === 'Order Placed';
}

export function generateOrderId(): string {
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LC-${yymmdd}-${rand}`;
}

export function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'object' && ts !== null) {
    const maybe = ts as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') return maybe.toMillis();
    if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  }
  return 0;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface DishPerformancePoint {
  name: string;
  quantity: number;
  revenue: number;
}

export interface StatusDistributionPoint {
  status: OrderStatus;
  count: number;
}

export interface DashboardAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalFoodItems: number;
  pendingOrders: number;
  completedOrders: number;
  dailyRevenue: RevenuePoint[];
  weeklyRevenue: RevenuePoint[];
  monthlyRevenue: RevenuePoint[];
  bestSellingDishes: DishPerformancePoint[];
  statusDistribution: StatusDistributionPoint[];
}

export function computeAnalytics(
  orders: Order[],
  products: Product[],
  users: UserProfile[],
  referenceNowMs: number = Date.now()
): DashboardAnalytics {
  const nonCancelled = orders.filter((o) => o.orderStatus !== 'Cancelled');
  const totalRevenue = nonCancelled.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = orders.length;
  const totalCustomers = users.filter((u) => u.role === 'customer').length;
  const totalFoodItems = products.length;
  const pendingOrders = orders.filter(
    (o) => o.orderStatus !== 'Completed' && o.orderStatus !== 'Cancelled'
  ).length;
  const completedOrders = orders.filter((o) => o.orderStatus === 'Completed').length;

  // Daily Revenue (last 7 days)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyMap = new Map<string, RevenuePoint>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(referenceNowMs - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { label: `${dayNames[d.getDay()]} ${d.getDate()}`, revenue: 0, orders: 0 });
  }
  for (const o of nonCancelled) {
    const ms = toMillis(o.createdAt) || referenceNowMs;
    const key = new Date(ms).toISOString().slice(0, 10);
    const entry = dailyMap.get(key);
    if (entry) {
      entry.revenue += o.totalAmount;
      entry.orders += 1;
    }
  }
  const dailyRevenue = Array.from(dailyMap.values());

  // Weekly Revenue (last 4 weeks)
  const weeklyRevenue: RevenuePoint[] = [];
  for (let w = 3; w >= 0; w--) {
    const startMs = referenceNowMs - (w + 1) * 7 * 86400000;
    const endMs = referenceNowMs - w * 7 * 86400000;
    let rev = 0;
    let count = 0;
    for (const o of nonCancelled) {
      const ms = toMillis(o.createdAt) || referenceNowMs;
      if (ms > startMs && ms <= endMs) {
        rev += o.totalAmount;
        count += 1;
      }
    }
    weeklyRevenue.push({ label: w === 0 ? 'This Week' : `${w}w ago`, revenue: rev, orders: count });
  }

  // Monthly Revenue (last 6 months)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyMap = new Map<string, RevenuePoint>();
  const refDate = new Date(referenceNowMs);
  for (let m = 5; m >= 0; m--) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, { label: monthNames[d.getMonth()], revenue: 0, orders: 0 });
  }
  for (const o of nonCancelled) {
    const ms = toMillis(o.createdAt) || referenceNowMs;
    const d = new Date(ms);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const entry = monthlyMap.get(key);
    if (entry) {
      entry.revenue += o.totalAmount;
      entry.orders += 1;
    }
  }
  const monthlyRevenue = Array.from(monthlyMap.values());

  // Best-selling dishes
  const dishMap = new Map<string, DishPerformancePoint>();
  for (const o of nonCancelled) {
    for (const item of o.items) {
      const existing = dishMap.get(item.name) ?? { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
      dishMap.set(item.name, existing);
    }
  }
  const bestSellingDishes = Array.from(dishMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Order status distribution
  const allStatuses: OrderStatus[] = [
    'Order Placed',
    'Order Confirmed',
    'Preparing',
    'Ready for Pickup',
    'Out for Delivery',
    'Completed',
    'Cancelled',
  ];
  const statusDistribution = allStatuses.map((status) => ({
    status,
    count: orders.filter((o) => o.orderStatus === status).length,
  }));

  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalFoodItems,
    pendingOrders,
    completedOrders,
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    bestSellingDishes,
    statusDistribution,
  };
}
