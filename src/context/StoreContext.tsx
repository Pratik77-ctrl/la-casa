import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
  STARTER_CATEGORIES,
  STARTER_OFFERS,
  STARTER_PRODUCTS,
  STARTER_REVIEWS,
} from '../data/seedCatalog';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import {
  seedStarterCatalogToFirestore,
  syncCartToFirestore,
  syncFavouritesToFirestore,
} from '../firebase/services';
import {
  AppView,
  CartItem,
  Category,
  Offer,
  Order,
  OrderType,
  Product,
  Review,
  UserProfile,
} from '../types';
import { calculateCartTotals, CartTotals, toMillis } from '../utils/commerce';
import { useAuth } from './AuthContext';

const LOCAL_CART_KEY = 'lacasa_guest_cart_v1';

interface StoreContextValue {
  activeView: AppView;
  navigateTo: (view: AppView) => void;
  categories: Category[];
  products: Product[];
  offers: Offer[];
  reviews: Review[];
  orders: Order[];
  allUsers: UserProfile[];
  favourites: string[];
  catalogLoading: boolean;
  ordersLoading: boolean;
  isCatalogSeeded: boolean;
  seedCatalogNow: () => Promise<number>;

  // Menu search & category handoff
  menuSearch: string;
  setMenuSearch: (val: string) => void;
  menuCategory: string;
  setMenuCategory: (val: string) => void;

  // Product details modal
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  // Cart & checkout state
  cartItems: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  couponCode: string;
  appliedOffer: Offer | null;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  cartTotals: CartTotals;
  addToCart: (product: Product, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCouponCode: (code: string) => { ok: boolean; message: string };
  clearCoupon: () => void;
  toggleFavourite: (productId: string) => Promise<void>;

  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, authReady, openAuthModal } = useAuth();

  const [activeView, setActiveView] = useState<AppView>('home');
  const [firestoreCategories, setFirestoreCategories] = useState<Category[]>([]);
  const [firestoreProducts, setFirestoreProducts] = useState<Product[]>([]);
  const [firestoreOffers, setFirestoreOffers] = useState<Offer[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [menuSearch, setMenuSearch] = useState('');
  const [menuCategory, setMenuCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const autoSeededRef = useRef(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3500);
  }, []);

  const navigateTo = useCallback((view: AppView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Public catalog listeners
  useEffect(() => {
    let resolved = 0;
    const markDone = () => {
      resolved += 1;
      if (resolved >= 3) setCatalogLoading(false);
    };

    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), orderBy('displayOrder', 'asc')),
      (snap) => {
        setFirestoreCategories(snap.docs.map((d) => d.data() as Category));
        markDone();
      },
      (error) => {
        setCatalogLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'categories');
      }
    );

    const unsubProds = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        setFirestoreProducts(snap.docs.map((d) => d.data() as Product));
        markDone();
      },
      (error) => {
        setCatalogLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'products');
      }
    );

    const unsubOffers = onSnapshot(
      collection(db, 'offers'),
      (snap) => {
        setFirestoreOffers(snap.docs.map((d) => d.data() as Offer));
        markDone();
      },
      (error) => {
        setCatalogLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'offers');
      }
    );

    const unsubReviews = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Review);
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setFirestoreReviews(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'reviews');
      }
    );

    return () => {
      unsubCats();
      unsubProds();
      unsubOffers();
      unsubReviews();
    };
  }, []);

  const isCatalogSeeded = firestoreProducts.length > 0 && firestoreCategories.length > 0;

  const seedCatalogNow = useCallback(async () => {
    const existingProdIds = new Set(firestoreProducts.map((p) => p.productId));
    const existingCatIds = new Set(firestoreCategories.map((c) => c.categoryId));
    const existingOfferIds = new Set(firestoreOffers.map((o) => o.offerId));
    const added = await seedStarterCatalogToFirestore(
      STARTER_CATEGORIES,
      STARTER_PRODUCTS,
      STARTER_OFFERS,
      existingProdIds,
      existingCatIds,
      existingOfferIds
    );
    return added;
  }, [firestoreCategories, firestoreOffers, firestoreProducts]);

  // Auto-seed starter catalog into Firestore when an Admin signs in and Firestore is empty or missing new starter dishes
  useEffect(() => {
    if (!authReady || !isAdmin || catalogLoading || autoSeededRef.current) return;
    const syncMarker = 'lacasa_starter_catalog_v2';
    const hasSyncedV2 = (() => {
      try {
        return localStorage.getItem(syncMarker) === '1';
      } catch {
        return false;
      }
    })();

    if (firestoreProducts.length === 0 || firestoreCategories.length === 0 || !hasSyncedV2) {
      autoSeededRef.current = true;
      seedCatalogNow()
        .then(() => {
          try {
            localStorage.setItem(syncMarker, '1');
          } catch {
            // Ignore storage errors
          }
        })
        .catch(() => {
          // User can retry via Admin Dashboard seed button
        });
    }
  }, [authReady, catalogLoading, firestoreCategories.length, firestoreProducts.length, isAdmin, seedCatalogNow]);

  // User-specific Firestore listeners (Orders, Favourites, Cart, Admin Users)
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setOrders([]);
      setAllUsers([]);
      setFavourites([]);
      return;
    }

    setOrdersLoading(true);
    const ordersQuery = isAdmin
      ? collection(db, 'orders')
      : query(collection(db, 'orders'), where('userId', '==', user.uid));

    const unsubOrders = onSnapshot(
      ordersQuery,
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Order);
        list.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
        setOrders(list);
        setOrdersLoading(false);
      },
      (error) => {
        setOrdersLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    const unsubFavs = onSnapshot(
      doc(db, 'favourites', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { productIds?: string[] };
          setFavourites(data.productIds || []);
        } else {
          setFavourites([]);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `favourites/${user.uid}`);
      }
    );

    const unsubCart = onSnapshot(
      doc(db, 'carts', user.uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as { items?: CartItem[]; couponCode?: string };
          if (Array.isArray(data.items) && data.items.length > 0) {
            setCartItems(data.items);
          }
          if (typeof data.couponCode === 'string') {
            setCouponCode(data.couponCode);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `carts/${user.uid}`);
      }
    );

    let unsubUsers: (() => void) | undefined;
    if (isAdmin) {
      unsubUsers = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          setAllUsers(snap.docs.map((d) => d.data() as UserProfile));
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      );
    } else {
      setAllUsers([]);
    }

    return () => {
      unsubOrders();
      unsubFavs();
      unsubCart();
      if (unsubUsers) unsubUsers();
    };
  }, [authReady, isAdmin, user]);

  // Persist guest cart in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota issues
    }
  }, [cartItems]);

  const categories = firestoreCategories.length > 0 ? firestoreCategories : STARTER_CATEGORIES;
  const products = firestoreProducts.length > 0 ? firestoreProducts : STARTER_PRODUCTS;
  const offers = firestoreOffers.length > 0 ? firestoreOffers : STARTER_OFFERS;
  const reviews = firestoreReviews.length > 0 ? firestoreReviews : STARTER_REVIEWS;

  const appliedOffer = useMemo(() => {
    if (!couponCode.trim()) return null;
    return (
      offers.find(
        (o) => o.active && o.couponCode.toUpperCase() === couponCode.trim().toUpperCase()
      ) || null
    );
  }, [couponCode, offers]);

  const cartTotals = useMemo(
    () => calculateCartTotals(cartItems, appliedOffer, orderType),
    [appliedOffer, cartItems, orderType]
  );

  const persistCart = useCallback(
    (nextItems: CartItem[], nextCoupon: string) => {
      if (user) {
        syncCartToFirestore(user.uid, nextItems, nextCoupon).catch(() => {
          // Handled inside helper
        });
      }
    },
    [user]
  );

  const addToCart = useCallback(
    (product: Product, qty = 1) => {
      if (!product.available) {
        showToast(`${product.name} is currently unavailable.`, 'error');
        return;
      }
      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === product.productId);
        const next = existing
          ? prev.map((i) =>
              i.productId === product.productId
                ? { ...i, quantity: Math.min(20, i.quantity + qty), price: product.price }
                : i
            )
          : [
              ...prev,
              {
                productId: product.productId,
                name: product.name,
                price: product.price,
                quantity: qty,
                imageUrl: product.imageUrl,
                foodType: product.foodType,
                category: product.category,
              },
            ];
        persistCart(next, couponCode);
        return next;
      });
      showToast(`Added ${product.name} to cart.`);
    },
    [couponCode, persistCart, showToast]
  );

  const updateCartQty = useCallback(
    (productId: string, qty: number) => {
      setCartItems((prev) => {
        const next =
          qty <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.min(20, qty) } : i));
        persistCart(next, couponCode);
        return next;
      });
    },
    [couponCode, persistCart]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        persistCart(next, couponCode);
        return next;
      });
    },
    [couponCode, persistCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCouponCode('');
    persistCart([], '');
  }, [persistCart]);

  const applyCouponCode = useCallback(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      const found = offers.find((o) => o.active && o.couponCode.toUpperCase() === normalized);
      if (!found) {
        return { ok: false, message: 'Invalid or expired coupon code.' };
      }
      setCouponCode(normalized);
      persistCart(cartItems, normalized);
      return { ok: true, message: `${found.couponCode} selected.` };
    },
    [cartItems, offers, persistCart]
  );

  const clearCoupon = useCallback(() => {
    setCouponCode('');
    persistCart(cartItems, '');
  }, [cartItems, persistCart]);

  const toggleFavourite = useCallback(
    async (productId: string) => {
      if (!user) {
        openAuthModal('login');
        showToast('Sign in to save favourite dishes.', 'info');
        return;
      }
      const exists = favourites.includes(productId);
      const next = exists ? favourites.filter((id) => id !== productId) : [...favourites, productId];
      setFavourites(next);
      await syncFavouritesToFirestore(user.uid, next);
      showToast(exists ? 'Removed from favourites.' : 'Saved to favourites.');
    },
    [favourites, openAuthModal, showToast, user]
  );

  return (
    <StoreContext.Provider
      value={{
        activeView,
        navigateTo,
        categories,
        products,
        offers,
        reviews,
        orders,
        allUsers,
        favourites,
        catalogLoading,
        ordersLoading,
        isCatalogSeeded,
        seedCatalogNow,
        menuSearch,
        setMenuSearch,
        menuCategory,
        setMenuCategory,
        selectedProduct,
        setSelectedProduct,
        cartItems,
        cartOpen,
        setCartOpen,
        couponCode,
        appliedOffer,
        orderType,
        setOrderType,
        cartTotals,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        applyCouponCode,
        clearCoupon,
        toggleFavourite,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
