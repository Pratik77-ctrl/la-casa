export type UserRole = 'customer' | 'admin';
export type FoodType = 'veg' | 'non-veg';
export type OrderType = 'delivery' | 'takeaway';
export type PaymentMethod = 'cod' | 'pay_at_restaurant' | 'upi';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type OrderStatus =
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Preparing'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Completed'
  | 'Cancelled';

export interface AddressItem {
  id: string;
  label: string;
  line: string;
  landmark?: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses?: AddressItem[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Category {
  categoryId: string;
  name: string;
  imageUrl: string;
  displayOrder: number;
  createdAt?: unknown;
}

export interface Product {
  productId: string;
  name: string;
  description: string;
  ingredients?: string[];
  category: string;
  price: number;
  imageUrl: string;
  foodType: FoodType;
  available: boolean;
  popularity: number;
  isBestseller?: boolean;
  isRecommended?: boolean;
  prepTime?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  foodType: FoodType;
  category: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  foodType: FoodType;
}

export interface Order {
  orderId: string;
  userId: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  tax: number;
  totalAmount: number;
  orderType: OrderType;
  address: string;
  instructions?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Offer {
  offerId: string;
  title: string;
  description: string;
  discount: number;
  discountType: 'percent' | 'flat';
  minOrder: number;
  couponCode: string;
  active: boolean;
  expiryDate: string;
  createdAt?: unknown;
}

export interface Review {
  reviewId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt?: unknown;
}

export type AppView = 'home' | 'menu' | 'offers' | 'orders' | 'checkout' | 'profile' | 'admin';
