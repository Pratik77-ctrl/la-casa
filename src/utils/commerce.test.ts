import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  canCustomerCancelOrder,
  computeAnalytics,
  filterAndSortProducts,
  validateCheckoutForm,
  validateRegistrationForm,
} from './commerce';
import { CartItem, Offer, Order, Product, UserProfile } from '../types';

const sampleCart: CartItem[] = [
  {
    productId: 'p1',
    name: 'Paneer Butter Masala Bowl',
    price: 140,
    quantity: 2,
    imageUrl: '/images/indian.svg',
    foodType: 'veg',
    category: 'Indian Cuisine',
  },
];

const percentOffer: Offer = {
  offerId: 'o1',
  title: 'Student Discount',
  description: '10% off orders above 200',
  discount: 10,
  discountType: 'percent',
  minOrder: 200,
  couponCode: 'STUDENT10',
  active: true,
  expiryDate: '2026-12-31',
};

test('calculateCartTotals computes subtotal, discount, 5% GST, and free delivery above threshold', () => {
  const totals = calculateCartTotals(sampleCart, percentOffer, 'delivery');
  assert.equal(totals.itemCount, 2);
  assert.equal(totals.subtotal, 280);
  assert.equal(totals.discount, 28);
  assert.equal(totals.tax, 13); // round(252 * 0.05) = 13
  assert.equal(totals.deliveryFee, 0);
  assert.equal(totals.totalAmount, 265);
  assert.equal(totals.couponApplied, true);
});

test('calculateCartTotals charges delivery fee below threshold and waives for takeaway', () => {
  const smallCart: CartItem[] = [{ ...sampleCart[0], quantity: 1 }];
  const delivery = calculateCartTotals(smallCart, null, 'delivery');
  assert.equal(delivery.deliveryFee, 20);
  assert.equal(delivery.tax, 7);
  assert.equal(delivery.totalAmount, 167);

  const takeaway = calculateCartTotals(smallCart, null, 'takeaway');
  assert.equal(takeaway.deliveryFee, 0);
  assert.equal(takeaway.totalAmount, 147);
});

test('filterAndSortProducts filters by category, foodType, maxPrice, search and sorts', () => {
  const products: Product[] = [
    {
      productId: 'p1',
      name: 'Paneer Bowl',
      description: 'Creamy gravy',
      category: 'Indian Cuisine',
      price: 140,
      imageUrl: '',
      foodType: 'veg',
      available: true,
      popularity: 95,
    },
    {
      productId: 'p2',
      name: 'Chicken Burger',
      description: 'Crispy patty',
      category: 'Burgers & Sandwiches',
      price: 110,
      imageUrl: '',
      foodType: 'non-veg',
      available: true,
      popularity: 88,
    },
    {
      productId: 'p3',
      name: 'Margherita Pizza',
      description: 'Classic cheese pizza',
      category: 'Pizza',
      price: 159,
      imageUrl: '',
      foodType: 'veg',
      available: true,
      popularity: 99,
    },
  ];

  const vegSorted = filterAndSortProducts(products, {
    search: '',
    category: 'All',
    foodType: 'veg',
    maxPrice: 150,
    sortBy: 'price-asc',
  });
  assert.equal(vegSorted.length, 1);
  assert.equal(vegSorted[0].productId, 'p1');

  const popularAll = filterAndSortProducts(products, {
    search: 'pizza',
    category: 'Pizza',
    foodType: 'all',
    maxPrice: null,
    sortBy: 'popularity',
  });
  assert.equal(popularAll.length, 1);
  assert.equal(popularAll[0].productId, 'p3');
});

test('validateRegistrationForm and validateCheckoutForm reject invalid inputs', () => {
  const regErrors = validateRegistrationForm({
    fullName: 'A',
    email: 'bad-email',
    phone: '123',
    password: '123',
    confirmPassword: '456',
  });
  assert.ok(regErrors.fullName);
  assert.ok(regErrors.email);
  assert.ok(regErrors.phone);
  assert.ok(regErrors.password);
  assert.ok(regErrors.confirmPassword);

  const checkoutErrors = validateCheckoutForm({
    customerName: '',
    phone: '999',
    orderType: 'delivery',
    address: 'Short',
  });
  assert.ok(checkoutErrors.customerName);
  assert.ok(checkoutErrors.phone);
  assert.ok(checkoutErrors.address);
});

test('canCustomerCancelOrder only permits cancellation when Order Placed', () => {
  assert.equal(canCustomerCancelOrder('Order Placed'), true);
  assert.equal(canCustomerCancelOrder('Preparing'), false);
  assert.equal(canCustomerCancelOrder('Completed'), false);
});

test('computeAnalytics aggregates revenue excluding cancelled orders and tracks best sellers', () => {
  const now = new Date('2026-11-19T10:00:00Z').getTime();
  const orders: Order[] = [
    {
      orderId: 'o1',
      userId: 'u1',
      customerName: 'Aarav',
      phone: '9876543210',
      items: [{ productId: 'p1', name: 'Paneer Bowl', price: 140, quantity: 2, foodType: 'veg' }],
      subtotal: 280,
      discount: 0,
      tax: 14,
      totalAmount: 294,
      orderType: 'takeaway',
      address: 'Takeaway',
      paymentMethod: 'pay_at_restaurant',
      paymentStatus: 'paid',
      orderStatus: 'Completed',
      createdAt: now,
    },
    {
      orderId: 'o2',
      userId: 'u2',
      customerName: 'Riya',
      phone: '9876543211',
      items: [{ productId: 'p2', name: 'Hakka Noodles', price: 99, quantity: 1, foodType: 'veg' }],
      subtotal: 99,
      discount: 0,
      tax: 5,
      totalAmount: 104,
      orderType: 'delivery',
      address: 'DGU Hostel',
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      orderStatus: 'Cancelled',
      createdAt: now,
    },
  ];
  const users: UserProfile[] = [
    { uid: 'u1', fullName: 'Aarav', email: 'a@b.com', phone: '9876543210', role: 'customer' },
    { uid: 'u2', fullName: 'Riya', email: 'r@b.com', phone: '9876543211', role: 'customer' },
    { uid: 'adm', fullName: 'Admin', email: 'pra77tik@gmail.com', phone: '', role: 'admin' },
  ];

  const stats = computeAnalytics(orders, [], users, now);
  assert.equal(stats.totalRevenue, 294);
  assert.equal(stats.totalOrders, 2);
  assert.equal(stats.totalCustomers, 2);
  assert.equal(stats.completedOrders, 1);
  assert.equal(stats.pendingOrders, 0);
  assert.equal(stats.bestSellingDishes[0].name, 'Paneer Bowl');
  assert.equal(stats.bestSellingDishes[0].quantity, 2);
});
