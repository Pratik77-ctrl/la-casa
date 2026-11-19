import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import {
  AddressItem,
  CartItem,
  Category,
  Offer,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  UserProfile,
} from '../types';
import { generateOrderId } from '../utils/commerce';
import { auth, db, googleProvider, handleFirestoreError, OperationType, storage } from './config';

export function mapAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check your credentials.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not yet enabled in Firebase Console → Authentication → Sign-in method. You can enable it there or use Google Sign-In.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing authentication.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    default:
      return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
  }
}

export async function ensureUserDocument(params: {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
}): Promise<void> {
  const userRef = doc(db, 'users', params.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: params.uid,
        fullName: params.fullName.slice(0, 100) || 'La Casa Guest',
        email: params.email.slice(0, 160),
        phone: (params.phone || '').slice(0, 20),
        role: 'customer',
        addresses: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${params.uid}`);
  }
}

export async function registerWithEmail(params: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  await updateProfile(cred.user, { displayName: params.fullName.trim() });
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // Verification email send failure shouldn't block account creation
  }
  await ensureUserDocument({
    uid: cred.user.uid,
    fullName: params.fullName.trim(),
    email: params.email.trim(),
    phone: params.phone.trim(),
  });
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureUserDocument({
    uid: cred.user.uid,
    fullName: cred.user.displayName || email.split('@')[0],
    email: cred.user.email || email.trim(),
    phone: '',
  });
}

export async function loginWithGoogle(): Promise<void> {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureUserDocument({
    uid: cred.user.uid,
    fullName: cred.user.displayName || 'La Casa Customer',
    email: cred.user.email || '',
    phone: cred.user.phoneNumber || '',
  });
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function updateUserProfileData(
  uid: string,
  payload: { fullName: string; phone: string; addresses: AddressItem[] }
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      fullName: payload.fullName.trim().slice(0, 100),
      phone: payload.phone.trim().slice(0, 20),
      addresses: payload.addresses.slice(0, 10),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncCartToFirestore(
  uid: string,
  items: CartItem[],
  couponCode: string
): Promise<void> {
  const path = `carts/${uid}`;
  try {
    await setDoc(doc(db, 'carts', uid), {
      userId: uid,
      items: items.slice(0, 50).map((i) => ({
        productId: i.productId,
        name: i.name.slice(0, 120),
        price: i.price,
        quantity: i.quantity,
        imageUrl: i.imageUrl.slice(0, 1000),
        foodType: i.foodType,
        category: i.category.slice(0, 80),
      })),
      couponCode: couponCode.slice(0, 32),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncFavouritesToFirestore(uid: string, productIds: string[]): Promise<void> {
  const path = `favourites/${uid}`;
  try {
    await setDoc(doc(db, 'favourites', uid), {
      userId: uid,
      productIds: productIds.slice(0, 100),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createOrderInFirestore(
  orderInput: Omit<Order, 'orderId' | 'paymentStatus' | 'orderStatus' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const orderId = generateOrderId();
  const path = `orders/${orderId}`;
  try {
    await setDoc(doc(db, 'orders', orderId), {
      ...orderInput,
      orderId,
      customerName: orderInput.customerName.trim().slice(0, 100),
      phone: orderInput.phone.trim().slice(0, 20),
      address: orderInput.address.trim().slice(0, 300),
      instructions: (orderInput.instructions || '').trim().slice(0, 300),
      couponCode: (orderInput.couponCode || '').trim().slice(0, 32),
      paymentStatus: 'pending',
      orderStatus: 'Order Placed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelOrderAsCustomer(orderId: string): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus: 'Cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitReviewInFirestore(params: {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const reviewId = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const path = `reviews/${reviewId}`;
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      reviewId,
      userId: params.userId,
      userName: params.userName.trim().slice(0, 80),
      rating: Math.min(5, Math.max(1, Math.round(params.rating))),
      comment: params.comment.trim().slice(0, 400),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// Admin operations
export async function seedStarterCatalogToFirestore(
  categories: Category[],
  products: Product[],
  offers: Offer[],
  existingProductIds: Set<string>,
  existingCategoryIds: Set<string>,
  existingOfferIds: Set<string>
): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const cat of categories) {
    if (!existingCategoryIds.has(cat.categoryId)) {
      batch.set(doc(db, 'categories', cat.categoryId), {
        ...cat,
        createdAt: serverTimestamp(),
      });
      count++;
    }
  }

  for (const prod of products) {
    if (!existingProductIds.has(prod.productId)) {
      batch.set(doc(db, 'products', prod.productId), {
        ...prod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      count++;
    }
  }

  for (const offer of offers) {
    if (!existingOfferIds.has(offer.offerId)) {
      batch.set(doc(db, 'offers', offer.offerId), {
        ...offer,
        createdAt: serverTimestamp(),
      });
      count++;
    }
  }

  if (count > 0) {
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/seed');
    }
  }
  return count;
}

export async function upsertProductAdmin(product: Product, isNew: boolean): Promise<void> {
  const path = `products/${product.productId}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'products', product.productId), {
        productId: product.productId,
        name: product.name.trim().slice(0, 120),
        description: product.description.trim().slice(0, 600),
        ingredients: (product.ingredients || []).slice(0, 25),
        category: product.category.trim().slice(0, 80),
        price: Number(product.price),
        imageUrl: product.imageUrl.trim().slice(0, 1000) || '/images/cat-indian.svg',
        foodType: product.foodType,
        available: product.available,
        popularity: Number(product.popularity || 80),
        isBestseller: Boolean(product.isBestseller),
        isRecommended: Boolean(product.isRecommended),
        prepTime: (product.prepTime || '15 mins').slice(0, 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'products', product.productId), {
        name: product.name.trim().slice(0, 120),
        description: product.description.trim().slice(0, 600),
        ingredients: (product.ingredients || []).slice(0, 25),
        category: product.category.trim().slice(0, 80),
        price: Number(product.price),
        imageUrl: product.imageUrl.trim().slice(0, 1000) || '/images/cat-indian.svg',
        foodType: product.foodType,
        available: product.available,
        popularity: Number(product.popularity || 80),
        isBestseller: Boolean(product.isBestseller),
        isRecommended: Boolean(product.isRecommended),
        prepTime: (product.prepTime || '15 mins').slice(0, 40),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteProductAdmin(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCategoryAdmin(category: Category, isNew: boolean): Promise<void> {
  const path = `categories/${category.categoryId}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'categories', category.categoryId), {
        categoryId: category.categoryId,
        name: category.name.trim().slice(0, 80),
        imageUrl: category.imageUrl.trim().slice(0, 1000) || '/images/cat-indian.svg',
        displayOrder: Number(category.displayOrder || 1),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'categories', category.categoryId), {
        name: category.name.trim().slice(0, 80),
        imageUrl: category.imageUrl.trim().slice(0, 1000) || '/images/cat-indian.svg',
        displayOrder: Number(category.displayOrder || 1),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteCategoryAdmin(categoryId: string): Promise<void> {
  const path = `categories/${categoryId}`;
  try {
    await deleteDoc(doc(db, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateOrderStatusAdmin(
  orderId: string,
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      orderStatus,
      paymentStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function upsertOfferAdmin(offer: Offer, isNew: boolean): Promise<void> {
  const path = `offers/${offer.offerId}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'offers', offer.offerId), {
        offerId: offer.offerId,
        title: offer.title.trim().slice(0, 100),
        description: offer.description.trim().slice(0, 300),
        discount: Number(offer.discount),
        discountType: offer.discountType,
        minOrder: Number(offer.minOrder),
        couponCode: offer.couponCode.trim().toUpperCase().slice(0, 24),
        active: Boolean(offer.active),
        expiryDate: offer.expiryDate.slice(0, 32),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'offers', offer.offerId), {
        title: offer.title.trim().slice(0, 100),
        description: offer.description.trim().slice(0, 300),
        discount: Number(offer.discount),
        discountType: offer.discountType,
        minOrder: Number(offer.minOrder),
        couponCode: offer.couponCode.trim().toUpperCase().slice(0, 24),
        active: Boolean(offer.active),
        expiryDate: offer.expiryDate.slice(0, 32),
      });
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteOfferAdmin(offerId: string): Promise<void> {
  const path = `offers/${offerId}`;
  try {
    await deleteDoc(doc(db, 'offers', offerId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function uploadFoodImageToStorage(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storageRef = ref(storage, `menu-images/${Date.now()}_${cleanName}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export type { UserProfile };
