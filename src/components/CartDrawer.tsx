import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FREE_DELIVERY_THRESHOLD } from '../utils/commerce';
import { DishVisual } from './DishVisual';

export const CartDrawer: React.FC = () => {
  const {
    cartOpen,
    setCartOpen,
    cartItems,
    cartTotals,
    offers,
    couponCode,
    orderType,
    setOrderType,
    updateCartQty,
    removeFromCart,
    clearCart,
    applyCouponCode,
    clearCoupon,
    navigateTo,
    showToast,
  } = useStore();

  const [couponInput, setCouponInput] = useState('');

  if (!cartOpen) return null;

  const activeOffers = offers.filter((o) => o.active);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCouponCode(couponInput);
    showToast(res.message, res.ok ? 'success' : 'error');
    if (res.ok) setCouponInput('');
  };

  const handleCheckout = () => {
    setCartOpen(false);
    navigateTo('checkout');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="bg-[#FFF8ED] w-full max-w-md h-full flex flex-col border-l border-[#E5D5BF] shadow-2xl">
        <div className="px-6 py-4 bg-white border-b border-[#EADBC8] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#641E24]" />
            <h2 id="cart-drawer-title" className="font-display text-lg font-bold text-[#242424]">
              Your Order Bag ({cartTotals.itemCount})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-red-700 hover:underline px-2 py-1 cursor-pointer"
              >
                Empty Cart
              </button>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              aria-label="Close shopping cart"
              className="p-1.5 rounded-lg hover:bg-[#FFF8ED] text-[#242424] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F4E7D3] text-[#641E24] flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-bold text-[#242424]">Your bag is empty</h3>
                <p className="text-sm text-[#242424]/70 max-w-xs">
                  Add delicious Indian, Chinese, Italian, or Mexican dishes from the menu.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigateTo('menu');
                }}
                className="px-5 py-2.5 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Delivery vs Takeaway toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFE2CE]">
                <button
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    orderType === 'delivery' ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/75'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('takeaway')}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    orderType === 'takeaway' ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/75'
                  }`}
                >
                  Takeaway (Free)
                </button>
              </div>

              {orderType === 'delivery' && cartTotals.subtotal < FREE_DELIVERY_THRESHOLD && (
                <p className="text-xs text-[#641E24] bg-white rounded-xl border border-[#EADBC8] px-3.5 py-2.5">
                  Add{' '}
                  <span className="font-bold tabular-nums">
                    ₹{FREE_DELIVERY_THRESHOLD - cartTotals.subtotal}
                  </span>{' '}
                  more for free local delivery in Selaqui.
                </p>
              )}

              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="bg-white rounded-2xl border border-[#EADBC8] p-3.5 flex items-center gap-3.5"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F7ECE0] shrink-0">
                      <DishVisual
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#242424] truncate">{item.name}</p>
                      <p className="text-xs text-[#242424]/65 font-mono tabular-nums mt-0.5">
                        ₹{item.price} each
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFCBB3] bg-[#FFF8ED] px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="w-6 h-6 flex items-center justify-center hover:text-[#641E24] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono tabular-nums text-xs font-bold min-w-[1.25rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            className="w-6 h-6 flex items-center justify-center hover:text-[#641E24] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          aria-label={`Remove ${item.name}`}
                          className="p-1.5 text-[#242424]/50 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="font-mono tabular-nums text-sm font-bold text-[#242424]">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coupon Form */}
              <div className="bg-white rounded-2xl border border-[#EADBC8] p-4 space-y-3">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-[#641E24] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Promo code (e.g. STUDENT15)"
                      aria-label="Promo coupon code"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FFF8ED]/60 border border-[#DFCBB3] text-xs font-mono uppercase focus:outline-none focus:border-[#641E24]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] cursor-pointer"
                  >
                    Apply
                  </button>
                </form>

                {couponCode && (
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={
                        cartTotals.couponApplied ? 'text-emerald-700 font-semibold' : 'text-amber-700'
                      }
                    >
                      {cartTotals.couponMessage}
                    </span>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="text-xs font-semibold text-red-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {!couponCode && activeOffers.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeOffers.slice(0, 3).map((offer) => (
                      <button
                        key={offer.offerId}
                        type="button"
                        onClick={() => {
                          const res = applyCouponCode(offer.couponCode);
                          showToast(res.message, res.ok ? 'success' : 'error');
                        }}
                        className="text-[11px] font-mono font-semibold text-[#641E24] underline hover:text-[#F28C28] cursor-pointer"
                      >
                        Try {offer.couponCode}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Totals */}
        {cartItems.length > 0 && (
          <div className="bg-white border-t border-[#EADBC8] p-6 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#242424]/75">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">₹{cartTotals.subtotal}</span>
              </div>
              {cartTotals.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Promo Discount</span>
                  <span className="font-mono tabular-nums">-₹{cartTotals.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#242424]/75">
                <span>GST (5%)</span>
                <span className="font-mono tabular-nums">₹{cartTotals.tax}</span>
              </div>
              <div className="flex justify-between text-[#242424]/75">
                <span>{orderType === 'delivery' ? 'Local Delivery' : 'Takeaway Pickup'}</span>
                <span className="font-mono tabular-nums">
                  {cartTotals.deliveryFee === 0 ? 'Free' : `₹${cartTotals.deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#242424] pt-2 border-t border-[#F3E8D8]">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums text-[#641E24]">
                  ₹{cartTotals.totalAmount}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full py-3.5 px-5 rounded-xl bg-[#F28C28] text-white text-sm font-bold hover:bg-[#D97415] transition-colors cursor-pointer"
            >
              Proceed to Checkout · ₹{cartTotals.totalAmount}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
