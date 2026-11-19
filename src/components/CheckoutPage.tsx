import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Info, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { createOrderInFirestore } from '../firebase/services';
import { PaymentMethod } from '../types';
import { validateCheckoutForm } from '../utils/commerce';

export const CheckoutPage: React.FC = () => {
  const { user, profile, openAuthModal } = useAuth();
  const {
    cartItems,
    cartTotals,
    couponCode,
    orderType,
    setOrderType,
    clearCart,
    navigateTo,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    orderType === 'delivery' ? 'cod' : 'pay_at_restaurant'
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setCustomerName((prev) => prev || profile.fullName || '');
      setPhone((prev) => prev || profile.phone || '');
      if (!address && profile.addresses && profile.addresses.length > 0) {
        const first = profile.addresses[0];
        setAddress(`${first.line}${first.landmark ? `, Near ${first.landmark}` : ''}`);
      }
    } else if (user) {
      setCustomerName((prev) => prev || user.displayName || '');
    }
  }, [address, profile, user]);

  useEffect(() => {
    if (orderType === 'takeaway' && paymentMethod === 'cod') {
      setPaymentMethod('pay_at_restaurant');
    }
  }, [orderType, paymentMethod]);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#242424]">Your bag is empty</h1>
        <p className="text-sm text-[#242424]/70">
          Add dishes from the La Casa menu before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('menu')}
          className="px-6 py-3 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
        >
          Browse Menu
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!user) {
      openAuthModal('login');
      showToast('Please sign in to place your order.', 'info');
      return;
    }

    const formErrors = validateCheckoutForm({
      customerName,
      phone,
      orderType,
      address,
    });
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const orderId = await createOrderInFirestore({
        userId: user.uid,
        customerName: customerName.trim(),
        phone: phone.trim(),
        items: cartItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          foodType: i.foodType,
        })),
        subtotal: cartTotals.subtotal,
        discount: cartTotals.discount,
        couponCode: cartTotals.couponApplied ? couponCode : '',
        tax: cartTotals.tax + cartTotals.deliveryFee,
        totalAmount: cartTotals.totalAmount,
        orderType,
        address:
          orderType === 'takeaway'
            ? 'Takeaway Counter — La Casa, Chakrata Road, Selaqui'
            : address.trim(),
        instructions: instructions.trim(),
        paymentMethod,
      });

      clearCart();
      showToast(`Order ${orderId} placed successfully!`);
      navigateTo('orders');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <button
        type="button"
        onClick={() => navigateTo('menu')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#641E24] hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Menu
      </button>

      <div>
        <h1 className="font-display text-3xl font-bold text-[#242424]">Checkout</h1>
        <p className="text-sm text-[#242424]/70 mt-1">
          Review your details and confirm your order with La Casa Selaqui.
        </p>
      </div>

      {!user && (
        <div className="bg-white rounded-2xl border border-[#F28C28] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#641E24] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#242424]">Sign in required to place order</p>
              <p className="text-xs text-[#242424]/70 mt-0.5">
                Orders are linked to your verified account for live preparation tracking.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-5 py-2.5 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6" noValidate>
          {/* Order Type */}
          <section className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#242424]">1. Fulfilment Mode</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  orderType === 'delivery'
                    ? 'border-[#641E24] bg-[#FFF8ED]'
                    : 'border-[#EADBC8] hover:border-[#641E24]/40'
                }`}
              >
                <p className="text-sm font-bold text-[#242424]">Campus &amp; Local Delivery</p>
                <p className="text-xs text-[#242424]/70 mt-1">
                  Selaqui hostels, PGs &amp; residences · Free above ₹199
                </p>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  orderType === 'takeaway'
                    ? 'border-[#641E24] bg-[#FFF8ED]'
                    : 'border-[#EADBC8] hover:border-[#641E24]/40'
                }`}
              >
                <p className="text-sm font-bold text-[#242424]">Self Takeaway Pickup</p>
                <p className="text-xs text-[#242424]/70 mt-1">
                  Collect from La Casa counter on Chakrata Road · Zero fee
                </p>
              </button>
            </div>
          </section>

          {/* Customer Details */}
          <section className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#242424]">2. Contact &amp; Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Customer Name
                </label>
                <input
                  id="chk-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {errors.customerName && (
                  <p className="text-xs text-red-600 mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-[#242424] mb-1.5">
                  Mobile Number
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>
            </div>

            {orderType === 'delivery' ? (
              <div className="space-y-3">
                {profile?.addresses && profile.addresses.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-[#242424]/70">Saved Addresses</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.addresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() =>
                            setAddress(`${addr.line}${addr.landmark ? `, Near ${addr.landmark}` : ''}`)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DFCBB3] bg-[#FFF8ED] text-xs font-semibold text-[#641E24] hover:border-[#641E24] cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          {addr.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="chk-address" className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Delivery Address (Hostel / PG / Street in Selaqui)
                  </label>
                  <textarea
                    id="chk-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., Room 204, Boys Hostel Block B, DBS Global University Road, Selaqui"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
                  />
                  {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#FFF8ED] border border-[#EADBC8] text-xs text-[#242424]/80">
                Pickup Address: <span className="font-semibold">La Casa, Chakrata Road, Selaqui, Dehradun</span>
              </div>
            )}

            <div>
              <label htmlFor="chk-notes" className="block text-xs font-semibold text-[#242424] mb-1.5">
                Order Instructions (Optional)
              </label>
              <input
                id="chk-notes"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Spice preference, extra napkins, gate call instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
              />
            </div>
          </section>

          {/* Payment Options */}
          <section className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#242424]">3. Payment Option</h2>

            <div className="space-y-3">
              {orderType === 'delivery' && (
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${
                    paymentMethod === 'cod' ? 'border-[#641E24] bg-[#FFF8ED]' : 'border-[#EADBC8]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 accent-[#641E24]"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#242424]">Cash on Delivery</p>
                    <p className="text-xs text-[#242424]/70 mt-0.5">
                      Pay in cash when your order arrives at your doorstep or hostel gate.
                    </p>
                  </div>
                </label>
              )}

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${
                  paymentMethod === 'pay_at_restaurant'
                    ? 'border-[#641E24] bg-[#FFF8ED]'
                    : 'border-[#EADBC8]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'pay_at_restaurant'}
                  onChange={() => setPaymentMethod('pay_at_restaurant')}
                  className="mt-1 accent-[#641E24]"
                />
                <div>
                  <p className="text-sm font-bold text-[#242424]">Pay at Restaurant</p>
                  <p className="text-xs text-[#242424]/70 mt-0.5">
                    Pay via cash or counter QR when picking up or dining in at La Casa.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${
                  paymentMethod === 'upi' ? 'border-[#641E24] bg-[#FFF8ED]' : 'border-[#EADBC8]'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                  className="mt-1 accent-[#641E24]"
                />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#242424]">UPI Payment (Pay on Delivery / Pickup)</p>
                  <p className="text-xs text-[#242424]/70">
                    Online UPI gateway integration is future-ready. Your order will be recorded with payment pending until verified via UPI QR at delivery or counter.
                  </p>
                </div>
              </label>
            </div>

            {paymentMethod === 'upi' && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Note: Automated online UPI settlement is not live yet. Payment status remains Pending until settled at pickup or delivery.
                </span>
              </div>
            )}
          </section>

          {submitError && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-[#F28C28] text-white text-sm font-bold hover:bg-[#D97415] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitting ? 'Confirming Order...' : `Confirm & Place Order · ₹${cartTotals.totalAmount}`}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold text-[#242424]">Order Summary</h2>

          <ul className="divide-y divide-[#F3E8D8]">
            {cartItems.map((item) => (
              <li key={item.productId} className="py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-[#242424] truncate">{item.name}</p>
                  <p className="text-xs text-[#242424]/65 font-mono tabular-nums">
                    {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <span className="font-mono tabular-nums font-bold text-[#242424]">
                  ₹{item.price * item.quantity}
                </span>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#EADBC8] space-y-2 text-sm">
            <div className="flex justify-between text-[#242424]/75">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">₹{cartTotals.subtotal}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount ({couponCode})</span>
                <span className="font-mono tabular-nums">-₹{cartTotals.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-[#242424]/75">
              <span>GST (5%)</span>
              <span className="font-mono tabular-nums">₹{cartTotals.tax}</span>
            </div>
            <div className="flex justify-between text-[#242424]/75">
              <span>Delivery Fee</span>
              <span className="font-mono tabular-nums">
                {cartTotals.deliveryFee === 0 ? 'Free' : `₹${cartTotals.deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#242424] pt-3 border-t border-[#F3E8D8]">
              <span>Final Payable</span>
              <span className="font-mono tabular-nums text-[#641E24]">₹{cartTotals.totalAmount}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
