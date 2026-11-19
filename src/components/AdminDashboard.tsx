import React, { useMemo, useState } from 'react';
import {
  Database,
  Edit3,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  deleteCategoryAdmin,
  deleteOfferAdmin,
  deleteProductAdmin,
  updateOrderStatusAdmin,
  uploadFoodImageToStorage,
  upsertCategoryAdmin,
  upsertOfferAdmin,
  upsertProductAdmin,
} from '../firebase/services';
import {
  Category,
  FoodType,
  Offer,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types';
import { computeAnalytics } from '../utils/commerce';
import { AdminCharts } from './AdminCharts';
import { DishVisual } from './DishVisual';

type AdminTab = 'overview' | 'menu' | 'orders' | 'offers' | 'customers';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Completed',
  'Cancelled',
];

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin, openAuthModal } = useAuth();
  const {
    categories,
    products,
    orders,
    offers,
    allUsers,
    isCatalogSeeded,
    seedCatalogNow,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodIngredients, setProdIngredients] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.name || 'Indian Cuisine');
  const [prodPrice, setProdPrice] = useState('129');
  const [prodFoodType, setProdFoodType] = useState<FoodType>('veg');
  const [prodAvailable, setProdAvailable] = useState(true);
  const [prodBestseller, setProdBestseller] = useState(false);
  const [prodRecommended, setProdRecommended] = useState(false);
  const [prodPrepTime, setProdPrepTime] = useState('15 mins');
  const [prodImageUrl, setProdImageUrl] = useState('/images/cat-indian.svg');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [savingProd, setSavingProd] = useState(false);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('/images/cat-indian.svg');
  const [savingCat, setSavingCat] = useState(false);

  // Offer Form State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerDiscount, setOfferDiscount] = useState('15');
  const [offerType, setOfferType] = useState<'percent' | 'flat'>('percent');
  const [offerMinOrder, setOfferMinOrder] = useState('199');
  const [offerCode, setOfferCode] = useState('');
  const [offerExpiry, setOfferExpiry] = useState('2026-12-31');
  const [savingOffer, setSavingOffer] = useState(false);

  const analytics = useMemo(
    () => computeAnalytics(orders, products, allUsers),
    [allUsers, orders, products]
  );

  if (!user || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#242424]">
          Administrator Access Required
        </h1>
        <p className="text-sm text-[#242424]/70 leading-relaxed">
          This area is protected. Sign in with an authorized administrator account to manage menu items, categories, orders, offers, and live revenue analytics.
        </p>
        {!user && (
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-6 py-3 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
          >
            Sign In as Administrator
          </button>
        )}
      </div>
    );
  }

  const handleSeedCatalog = async () => {
    setSeeding(true);
    try {
      const added = await seedCatalogNow();
      showToast(
        added > 0
          ? `Synced ${added} starter items to Cloud Firestore.`
          : 'Firestore catalog is already up to date.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdDesc('');
    setProdIngredients('');
    setProdCategory(categories[0]?.name || 'Indian Cuisine');
    setProdPrice('129');
    setProdFoodType('veg');
    setProdAvailable(true);
    setProdBestseller(false);
    setProdRecommended(false);
    setProdPrepTime('15 mins');
    setProdImageUrl('/images/cat-indian.svg');
  };

  const startEditProduct = (prod: Product) => {
    setEditingProductId(prod.productId);
    setProdName(prod.name);
    setProdDesc(prod.description);
    setProdIngredients((prod.ingredients || []).join(', '));
    setProdCategory(prod.category);
    setProdPrice(String(prod.price));
    setProdFoodType(prod.foodType);
    setProdAvailable(prod.available);
    setProdBestseller(Boolean(prod.isBestseller));
    setProdRecommended(Boolean(prod.isRecommended));
    setProdPrepTime(prod.prepTime || '15 mins');
    setProdImageUrl(prod.imageUrl);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    try {
      const url = await uploadFoodImageToStorage(file, (pct) => setUploadProgress(pct));
      setProdImageUrl(url);
      showToast('Food image uploaded to Firebase Storage.');
    } catch {
      showToast(
        'Cloud Storage upload unavailable (ensure Storage rules allow admin writes). You can still paste an image path or URL.',
        'error'
      );
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(prodPrice);
    if (prodName.trim().length < 2 || prodDesc.trim().length < 5 || Number.isNaN(priceNum) || priceNum <= 0) {
      showToast('Provide a valid dish name, description (5+ chars), and price > 0.', 'error');
      return;
    }

    const isNew = !editingProductId;
    const productId =
      editingProductId ||
      `${prodName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)}-${Date.now().toString().slice(-4)}`;

    setSavingProd(true);
    try {
      await upsertProductAdmin(
        {
          productId,
          name: prodName.trim(),
          description: prodDesc.trim(),
          ingredients: prodIngredients
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          category: prodCategory,
          price: priceNum,
          imageUrl: prodImageUrl.trim() || '/images/cat-indian.svg',
          foodType: prodFoodType,
          available: prodAvailable,
          popularity: 85,
          isBestseller: prodBestseller,
          isRecommended: prodRecommended,
          prepTime: prodPrepTime.trim() || '15 mins',
        },
        isNew
      );
      showToast(isNew ? 'Dish added to Firestore menu.' : 'Dish updated.');
      resetProductForm();
    } finally {
      setSavingProd(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (catName.trim().length < 2) {
      showToast('Enter a category name.', 'error');
      return;
    }
    const categoryId = catName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    setSavingCat(true);
    try {
      const cat: Category = {
        categoryId: categoryId || `cat-${Date.now()}`,
        name: catName.trim(),
        imageUrl: catImageUrl.trim() || '/images/cat-indian.svg',
        displayOrder: categories.length + 1,
      };
      await upsertCategoryAdmin(cat, true);
      setCatName('');
      showToast(`Category "${cat.name}" saved.`);
    } finally {
      setSavingCat(false);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const discountNum = Number(offerDiscount);
    const minNum = Number(offerMinOrder);
    if (offerTitle.trim().length < 3 || offerCode.trim().length < 3 || discountNum <= 0) {
      showToast('Complete all offer fields with a valid code and discount.', 'error');
      return;
    }

    setSavingOffer(true);
    try {
      const offer: Offer = {
        offerId: `offer-${Date.now()}`,
        title: offerTitle.trim(),
        description: offerDesc.trim() || `${offerTitle.trim()} on orders above ₹${minNum}.`,
        discount: discountNum,
        discountType: offerType,
        minOrder: minNum,
        couponCode: offerCode.trim().toUpperCase(),
        active: true,
        expiryDate: offerExpiry,
      };
      await upsertOfferAdmin(offer, true);
      setOfferTitle('');
      setOfferDesc('');
      setOfferCode('');
      showToast(`Offer ${offer.couponCode} created.`);
    } finally {
      setSavingOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E6D6C2]">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#242424]">
            La Casa Admin Console
          </h1>
          <p className="text-sm text-[#242424]/70 mt-1">
            Signed in as {user.email} · Real-time Cloud Firestore Operations
          </p>
        </div>

        <button
          type="button"
          onClick={handleSeedCatalog}
          disabled={seeding}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-xs font-semibold text-[#641E24] hover:border-[#641E24] cursor-pointer self-start md:self-auto"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
          {isCatalogSeeded ? 'Sync Missing Starter Items' : 'Initialize Menu in Firestore'}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Total Revenue</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#641E24] mt-1">
            ₹{analytics.totalRevenue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Total Orders</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#242424] mt-1">
            {analytics.totalOrders}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Customers</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#242424] mt-1">
            {analytics.totalCustomers}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Food Items</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#242424] mt-1">
            {analytics.totalFoodItems}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Pending Orders</p>
          <p className="font-mono tabular-nums text-xl font-bold text-[#F28C28] mt-1">
            {analytics.pendingOrders}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-4">
          <p className="text-xs text-[#242424]/65 font-medium">Completed</p>
          <p className="font-mono tabular-nums text-xl font-bold text-emerald-700 mt-1">
            {analytics.completedOrders}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'overview', label: 'Analytics & Overview' },
            { id: 'menu', label: 'Menu & Categories' },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'offers', label: `Offers (${offers.length})` },
            { id: 'customers', label: `Customers (${allUsers.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#641E24] text-[#FFF8ED]'
                : 'bg-white border border-[#EADBC8] text-[#242424] hover:border-[#641E24]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'overview' && <AdminCharts analytics={analytics} />}

      {/* TAB 2: MENU & CATEGORIES */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add/Edit Product Form */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleSaveProduct}
              className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-[#242424]">
                  {editingProductId ? 'Edit Food Item' : 'Add New Food Item'}
                </h2>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs font-semibold text-[#641E24] hover:underline cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Food Name</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g., Paneer Tikka Wrap"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Price (INR)</label>
                  <input
                    type="number"
                    min={1}
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Food Type</label>
                  <select
                    value={prodFoodType}
                    onChange={(e) => setProdFoodType(e.target.value as FoodType)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={prodPrepTime}
                    onChange={(e) => setProdPrepTime(e.target.value)}
                    placeholder="15 mins"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Describe taste, portion size, and accompaniments..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={prodIngredients}
                  onChange={(e) => setProdIngredients(e.target.value)}
                  placeholder="Paneer, Tomato Gravy, Butter, Garlic Naan"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold">Food Image (Upload or Path)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="/images/cat-indian.svg"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-xs"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4E7D3] text-[#641E24] text-xs font-semibold cursor-pointer hover:bg-[#EADBC8]">
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
                {uploadProgress !== null && (
                  <p className="text-xs text-[#641E24] font-mono tabular-nums">
                    Uploading: {uploadProgress}%
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodAvailable}
                    onChange={(e) => setProdAvailable(e.target.checked)}
                    className="accent-[#641E24]"
                  />
                  Available
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodBestseller}
                    onChange={(e) => setProdBestseller(e.target.checked)}
                    className="accent-[#641E24]"
                  />
                  Bestseller
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodRecommended}
                    onChange={(e) => setProdRecommended(e.target.checked)}
                    className="accent-[#641E24]"
                  />
                  Recommended
                </label>
              </div>

              <button
                type="submit"
                disabled={savingProd}
                className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] disabled:opacity-60 cursor-pointer"
              >
                {savingProd
                  ? 'Saving...'
                  : editingProductId
                  ? 'Update Dish'
                  : 'Add Dish to Menu'}
              </button>
            </form>

            {/* Category Manager */}
            <div className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-[#242424]">Manage Categories</h3>
              <form onSubmit={handleSaveCategory} className="space-y-3">
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="New category name"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={catImageUrl}
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    placeholder="Image path (/images/cat-indian.svg)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-xs"
                  />
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F28C28] text-white text-xs font-bold hover:bg-[#D97415] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </form>

              <ul className="divide-y divide-[#F3E8D8] max-h-60 overflow-y-auto">
                {categories.map((cat) => (
                  <li key={cat.categoryId} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#242424]">{cat.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        deleteCategoryAdmin(cat.categoryId).then(() =>
                          showToast(`Removed category ${cat.name}`)
                        )
                      }
                      aria-label={`Delete category ${cat.name}`}
                      className="p-1 text-[#242424]/50 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC8] overflow-hidden">
            <div className="p-5 border-b border-[#F3E8D8] flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#242424]">
                Menu Catalog ({products.length})
              </h2>
            </div>

            <div className="divide-y divide-[#F3E8D8]">
              {products.map((prod) => (
                <div key={prod.productId} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-[#F7ECE0] shrink-0">
                    <DishVisual
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#242424] truncate">{prod.name}</p>
                    <p className="text-xs text-[#242424]/65">
                      {prod.category} · <span className="font-mono tabular-nums font-bold">₹{prod.price}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      upsertProductAdmin({ ...prod, available: !prod.available }, false).then(() =>
                        showToast(`${prod.name} marked ${!prod.available ? 'Available' : 'Sold Out'}`)
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      prod.available
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                    }`}
                  >
                    {prod.available ? 'Available' : 'Sold Out'}
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditProduct(prod)}
                    aria-label={`Edit ${prod.name}`}
                    className="p-2 rounded-lg hover:bg-[#FFF8ED] text-[#641E24] cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      deleteProductAdmin(prod.productId).then(() =>
                        showToast(`Deleted ${prod.name}`)
                      )
                    }
                    aria-label={`Delete ${prod.name}`}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#EADBC8] overflow-hidden">
          <div className="p-5 border-b border-[#F3E8D8]">
            <h2 className="font-display text-xl font-bold text-[#242424]">All Customer Orders</h2>
          </div>

          {orders.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#242424]/65">No orders received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8ED] text-[#242424]/70 border-b border-[#EADBC8]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Order ID</th>
                    <th className="py-3 px-4 font-semibold">Customer</th>
                    <th className="py-3 px-4 font-semibold">Items</th>
                    <th className="py-3 px-4 font-semibold">Total</th>
                    <th className="py-3 px-4 font-semibold">Order Status</th>
                    <th className="py-3 px-4 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8D8]">
                  {orders.map((order) => (
                    <tr key={order.orderId} className="hover:bg-[#FFF8ED]/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#641E24] whitespace-nowrap">
                        {order.orderId}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#242424]">{order.customerName}</p>
                        <p className="text-[#242424]/65 tabular-nums">{order.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums font-bold text-[#242424]">
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Order status for ${order.orderId}`}
                          value={order.orderStatus}
                          onChange={(e) =>
                            updateOrderStatusAdmin(
                              order.orderId,
                              e.target.value as OrderStatus,
                              order.paymentStatus
                            ).then(() => showToast(`Order ${order.orderId} updated`))
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[#DFCBB3] bg-white text-xs font-semibold"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Payment status for ${order.orderId}`}
                          value={order.paymentStatus}
                          onChange={(e) =>
                            updateOrderStatusAdmin(
                              order.orderId,
                              order.orderStatus,
                              e.target.value as PaymentStatus
                            ).then(() => showToast(`Payment updated for ${order.orderId}`))
                          }
                          className="px-2.5 py-1.5 rounded-lg border border-[#DFCBB3] bg-white text-xs font-semibold capitalize"
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROMOTIONAL OFFERS */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveOffer}
            className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4"
          >
            <h2 className="font-display text-xl font-bold text-[#242424]">Create Promotional Offer</h2>
            <div>
              <label className="block text-xs font-semibold mb-1">Offer Title</label>
              <input
                type="text"
                value={offerTitle}
                onChange={(e) => setOfferTitle(e.target.value)}
                placeholder="Hostel Weekend Special"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <input
                type="text"
                value={offerDesc}
                onChange={(e) => setOfferDesc(e.target.value)}
                placeholder="Save 15% on orders above ₹199"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="WEEKEND15"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Discount Type</label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as 'percent' | 'flat')}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Discount</label>
                <input
                  type="number"
                  min={1}
                  value={offerDiscount}
                  onChange={(e) => setOfferDiscount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Min Order (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={offerMinOrder}
                  onChange={(e) => setOfferMinOrder(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={offerExpiry}
                  onChange={(e) => setOfferExpiry(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingOffer}
              className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
            >
              {savingOffer ? 'Saving...' : 'Publish Offer'}
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC8] divide-y divide-[#F3E8D8]">
            {offers.map((offer) => (
              <div key={offer.offerId} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs font-bold text-[#641E24]">{offer.couponCode}</p>
                  <p className="text-sm font-bold text-[#242424] mt-0.5">{offer.title}</p>
                  <p className="text-xs text-[#242424]/65 mt-0.5">{offer.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      upsertOfferAdmin({ ...offer, active: !offer.active }, false).then(() =>
                        showToast(`Offer ${offer.couponCode} ${!offer.active ? 'activated' : 'paused'}`)
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      offer.active ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {offer.active ? 'Active' : 'Paused'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      deleteOfferAdmin(offer.offerId).then(() =>
                        showToast(`Deleted offer ${offer.couponCode}`)
                      )
                    }
                    aria-label={`Delete offer ${offer.couponCode}`}
                    className="p-2 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMERS */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-[#EADBC8] overflow-hidden">
          <div className="p-5 border-b border-[#F3E8D8]">
            <h2 className="font-display text-xl font-bold text-[#242424]">Registered Users</h2>
          </div>
          {allUsers.length === 0 ? (
            <p className="p-10 text-center text-sm text-[#242424]/65">
              No registered users found yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8ED] text-[#242424]/70 border-b border-[#EADBC8]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Full Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Mobile</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold text-right">Orders Placed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3E8D8]">
                  {allUsers.map((u) => {
                    const count = orders.filter((o) => o.userId === u.uid).length;
                    return (
                      <tr key={u.uid}>
                        <td className="py-3.5 px-4 font-semibold text-[#242424]">{u.fullName}</td>
                        <td className="py-3.5 px-4 text-[#242424]/75">{u.email}</td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-[#242424]/75">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4 capitalize font-semibold text-[#641E24]">
                          {u.role}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
