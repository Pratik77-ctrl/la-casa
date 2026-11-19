import React from 'react';
import { Copy, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const OffersPage: React.FC = () => {
  const { offers, applyCouponCode, navigateTo, showToast } = useStore();
  const activeOffers = offers.filter((o) => o.active);

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`Copied code ${code}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#242424]">
          Promotional Offers &amp; Student Deals
        </h1>
        <p className="text-sm text-[#242424]/70 mt-1">
          Valid for both delivery and takeaway orders in Selaqui, Dehradun.
        </p>
      </div>

      {activeOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center">
          <p className="font-display text-xl font-bold text-[#242424]">No active offers right now</p>
          <p className="text-sm text-[#242424]/70 mt-1">
            Check back soon for new student discounts and combo deals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeOffers.map((offer) => (
            <article
              key={offer.offerId}
              className="bg-white rounded-2xl border border-[#EADBC8] p-6 flex flex-col justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="inline-flex items-center gap-1.5 text-[#641E24]">
                    <Tag className="w-4 h-4 text-[#F28C28]" />
                    {offer.discountType === 'percent'
                      ? `${offer.discount}% Discount`
                      : `Flat ₹${offer.discount} Off`}
                  </span>
                  <span className="text-[#242424]/60 tabular-nums">Valid till {offer.expiryDate}</span>
                </div>

                <h2 className="font-display text-xl font-bold text-[#242424]">{offer.title}</h2>
                <p className="text-sm text-[#242424]/75 leading-relaxed">{offer.description}</p>
                <p className="text-xs font-medium text-[#242424]/60 tabular-nums">
                  Minimum order value: ₹{offer.minOrder}
                </p>
              </div>

              <div className="pt-4 border-t border-[#F3E8D8] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(offer.couponCode)}
                  className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#641E24] hover:text-[#F28C28] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {offer.couponCode}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = applyCouponCode(offer.couponCode);
                    showToast(res.message, res.ok ? 'success' : 'error');
                    navigateTo('menu');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] transition-colors cursor-pointer"
                >
                  Apply &amp; Browse Menu
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
