import React, { useState } from 'react';
import { CheckCircle2, Clock, Package, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { cancelOrderAsCustomer } from '../firebase/services';
import { Order, OrderStatus } from '../types';
import { canCustomerCancelOrder, toMillis } from '../utils/commerce';

const TRACKING_STEPS_DELIVERY: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing',
  'Out for Delivery',
  'Completed',
];

const TRACKING_STEPS_TAKEAWAY: OrderStatus[] = [
  'Order Placed',
  'Order Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Completed',
];

function getStepIndex(order: Order): number {
  const steps = order.orderType === 'takeaway' ? TRACKING_STEPS_TAKEAWAY : TRACKING_STEPS_DELIVERY;
  const idx = steps.indexOf(order.orderStatus);
  if (idx !== -1) return idx;
  if (order.orderStatus === 'Ready for Pickup' || order.orderStatus === 'Out for Delivery') return 3;
  return 0;
}

export const OrdersPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { orders, ordersLoading, navigateTo, showToast } = useStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#641E24]/10 text-[#641E24] flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#242424]">
          Sign in to track your orders
        </h1>
        <p className="text-sm text-[#242424]/70 max-w-md mx-auto">
          Your order history and live kitchen preparation updates are securely linked to your La Casa account.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
        >
          Sign In to View Orders
        </button>
      </div>
    );
  }

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await cancelOrderAsCustomer(orderId);
      showToast(`Order ${orderId} cancelled.`);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#242424]">Your Orders &amp; Tracking</h1>
          <p className="text-sm text-[#242424]/70 mt-1">
            Live kitchen status updates for your orders at La Casa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo('menu')}
          className="px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] self-start sm:self-auto cursor-pointer"
        >
          Order More Food
        </button>
      </div>

      {ordersLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#EADBC8] h-48 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center space-y-4">
          <Package className="w-10 h-10 text-[#641E24]/60 mx-auto" />
          <h2 className="font-display text-2xl font-bold text-[#242424]">No orders placed yet</h2>
          <p className="text-sm text-[#242424]/70 max-w-md mx-auto">
            Explore our multi-cuisine menu and place your first order for campus delivery or quick takeaway.
          </p>
          <button
            type="button"
            onClick={() => navigateTo('menu')}
            className="px-5 py-2.5 rounded-xl bg-[#F28C28] text-white text-sm font-bold hover:bg-[#D97415] cursor-pointer"
          >
            Explore Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const steps =
              order.orderType === 'takeaway' ? TRACKING_STEPS_TAKEAWAY : TRACKING_STEPS_DELIVERY;
            const currentIdx = getStepIndex(order);
            const isCancelled = order.orderStatus === 'Cancelled';
            const createdMs = toMillis(order.createdAt);
            const dateLabel = createdMs
              ? new Date(createdMs).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Just now';

            return (
              <article
                key={order.orderId}
                className="bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F3E8D8]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#242424]/65">
                      <span className="font-mono font-bold text-[#641E24]">{order.orderId}</span>
                      <span aria-hidden="true">·</span>
                      <span>{dateLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{order.orderType}</span>
                    </div>
                    <p className="text-sm font-bold text-[#242424] mt-1">{order.address}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-mono tabular-nums text-lg font-bold text-[#242424]">
                        ₹{order.totalAmount}
                      </p>
                      <p className="text-xs text-[#242424]/65 capitalize">
                        {order.paymentMethod.replace(/_/g, ' ')} · {order.paymentStatus}
                      </p>
                    </div>
                    {canCustomerCancelOrder(order.orderStatus) && (
                      <button
                        type="button"
                        disabled={cancellingId === order.orderId}
                        onClick={() => handleCancel(order.orderId)}
                        className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                      >
                        {cancellingId === order.orderId ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Progress Bar */}
                {isCancelled ? (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                    <XCircle className="w-5 h-5 shrink-0" />
                    <span>Order Cancelled</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {steps.map((step, idx) => {
                      const done = idx <= currentIdx;
                      const current = idx === currentIdx;
                      return (
                        <div
                          key={step}
                          className={`p-3 rounded-xl border text-xs ${
                            done
                              ? 'border-[#641E24] bg-[#FFF8ED] text-[#641E24]'
                              : 'border-[#EADBC8] bg-white text-[#242424]/45'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold">
                            {done ? (
                              <CheckCircle2 className="w-4 h-4 text-[#F28C28] shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 shrink-0" />
                            )}
                            <span className="truncate">{step}</span>
                          </div>
                          {current && (
                            <p className="text-[11px] font-medium text-[#242424]/70 mt-1">
                              Current stage
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Itemized Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
                  <div className="md:col-span-8 space-y-1.5">
                    <p className="text-xs font-bold text-[#242424]/70">Ordered Items</p>
                    <ul className="space-y-1 text-sm">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between text-[#242424]/85">
                          <span>
                            {item.quantity} × {item.name}
                          </span>
                          <span className="font-mono tabular-nums">₹{item.price * item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    {order.instructions && (
                      <p className="text-xs text-[#242424]/65 pt-2">
                        Note: {order.instructions}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-4 bg-[#FFF8ED] rounded-xl border border-[#EADBC8] p-3.5 space-y-1 text-xs">
                    <div className="flex justify-between text-[#242424]/75">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">₹{order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span className="font-mono tabular-nums">-₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[#242424]/75">
                      <span>GST &amp; Fees</span>
                      <span className="font-mono tabular-nums">₹{order.tax}</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#242424] pt-1.5 border-t border-[#E6D5BF]">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
