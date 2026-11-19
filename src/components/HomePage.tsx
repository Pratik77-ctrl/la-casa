import React, { useState } from 'react';
import { ArrowRight, Clock, MapPin, Phone, Search, Star, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { submitReviewInFirestore } from '../firebase/services';
import { DishVisual } from './DishVisual';
import { FoodCard } from './FoodCard';

export const HomePage: React.FC = () => {
  const { user, profile, openAuthModal } = useAuth();
  const {
    categories,
    products,
    offers,
    reviews,
    navigateTo,
    setMenuCategory,
    setMenuSearch,
    applyCouponCode,
    showToast,
  } = useStore();

  const [heroSearch, setHeroSearch] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const popularDishes = [...products]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 6);

  const recommendedDishes = products.filter((p) => p.isRecommended).slice(0, 3);
  const activeOffers = offers.filter((o) => o.active);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMenuSearch(heroSearch);
    setMenuCategory('All');
    navigateTo('menu');
  };

  const handleCategoryClick = (categoryName: string) => {
    setMenuCategory(categoryName);
    setMenuSearch('');
    navigateTo('menu');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (reviewText.trim().length < 5) {
      showToast('Please write at least 5 characters for your review.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      await submitReviewInFirestore({
        userId: user.uid,
        userName: profile?.fullName || user.displayName || 'La Casa Guest',
        rating: reviewRating,
        comment: reviewText.trim(),
      });
      setReviewText('');
      setReviewRating(5);
      showToast('Thank you for sharing your review!');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-20 pb-8">
      {/* Hero Section */}
      <section className="bg-[#641E24] text-[#FFF8ED] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-semibold tracking-wide text-[#F28C28]">
                Selaqui, Dehradun · A World of Flavours. One Affordable Place.
              </p>

              <h1
                className="font-display font-bold leading-[1.08] tracking-tight text-[#FFF8ED]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.6rem)', textWrap: 'balance' }}
              >
                Discover the World of Flavours at La Casa
              </h1>

              <p className="text-base sm:text-lg text-[#FFF8ED]/85 leading-relaxed max-w-xl">
                Delicious food, global flavours and affordable prices. Your favourite food destination is just a click away.
              </p>

              {/* Hero Search */}
              <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#242424]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    aria-label="Search dishes by name or cuisine"
                    placeholder="Search paneer, pizza, hakka noodles, momos..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#242424] text-sm placeholder:text-[#242424]/50 focus:outline-none focus:ring-2 focus:ring-[#F28C28]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 rounded-xl bg-[#F28C28] text-white text-sm font-bold hover:bg-[#D97415] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Find Food
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuCategory('All');
                    navigateTo('menu');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FFF8ED] text-[#641E24] text-sm font-bold hover:bg-white transition-colors cursor-pointer"
                >
                  Explore Menu
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('menu')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#FFF8ED]/35 text-[#FFF8ED] text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Order Now
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 flex">
              <div className="w-full rounded-2xl overflow-hidden border border-white/15 bg-[#3E1216] min-h-[280px] lg:min-h-[380px]">
                <DishVisual
                  src="/images/hero-feast.svg"
                  alt="La Casa multi-cuisine spread featuring Paneer Butter Masala, wood-fired pizza, Hakka noodles, and gourmet burgers"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column Key Highlights Strip */}
          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#F28C28]">₹55 – ₹199</p>
              <p className="text-xs text-[#FFF8ED]/75 mt-1">Student-friendly everyday pricing</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#FFF8ED]">10 Cuisines</p>
              <p className="text-xs text-[#FFF8ED]/75 mt-1">Indian, Chinese, Italian, Mexican &amp; more</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#FFF8ED]">15–20 mins</p>
              <p className="text-xs text-[#FFF8ED]/75 mt-1">Freshly prepared takeaway &amp; delivery</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-2xl font-bold text-[#FFF8ED]">Selaqui</p>
              <p className="text-xs text-[#FFF8ED]/75 mt-1">Near campus hostels &amp; Chakrata Road</p>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Offers */}
      {activeOffers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242424]">
                Student Deals &amp; Offers
              </h2>
              <p className="text-sm text-[#242424]/70 mt-1">
                Apply a coupon directly to your bag before checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('offers')}
              className="text-sm font-semibold text-[#641E24] hover:underline self-start sm:self-auto cursor-pointer"
            >
              View all offers
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeOffers.slice(0, 3).map((offer) => (
              <div
                key={offer.offerId}
                className="bg-white rounded-2xl border border-[#EADBC8] p-6 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#641E24]">
                    <span className="inline-flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#F28C28]" />
                      {offer.discountType === 'percent'
                        ? `${offer.discount}% OFF`
                        : `₹${offer.discount} OFF`}
                    </span>
                    <span className="text-[#242424]/55 tabular-nums">Min ₹{offer.minOrder}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#242424]">{offer.title}</h3>
                  <p className="text-xs text-[#242424]/70 leading-relaxed">{offer.description}</p>
                </div>

                <div className="pt-4 border-t border-[#F3E8D8] flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold tracking-wide text-[#641E24]">
                    {offer.couponCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const res = applyCouponCode(offer.couponCode);
                      showToast(res.message, res.ok ? 'success' : 'error');
                      navigateTo('menu');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#FFF8ED] border border-[#641E24]/20 text-xs font-bold text-[#641E24] hover:bg-[#641E24] hover:text-[#FFF8ED] transition-colors cursor-pointer"
                  >
                    Apply &amp; Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Food Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242424]">
              Explore by Cuisine
            </h2>
            <p className="text-sm text-[#242424]/70 mt-1">
              From comforting North Indian bowls to fiery wok noodles and stone-baked pizzas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setMenuCategory('All');
              navigateTo('menu');
            }}
            className="text-sm font-semibold text-[#641E24] hover:underline self-start sm:self-auto cursor-pointer"
          >
            Browse full menu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => handleCategoryClick(cat.name)}
              className="group bg-white rounded-2xl border border-[#EADBC8] p-3 text-left hover:border-[#641E24]/45 hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F7ECE0] mb-3">
                <DishVisual
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-sm font-bold text-[#242424] group-hover:text-[#641E24] truncate">
                {cat.name}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Popular & Best-Selling Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242424]">
              Popular &amp; Best-Selling Dishes
            </h2>
            <p className="text-sm text-[#242424]/70 mt-1">
              Most ordered favourites across Selaqui campuses and local households.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('menu')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#641E24] hover:underline self-start sm:self-auto cursor-pointer"
          >
            See all {products.length} dishes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularDishes.map((dish) => (
            <FoodCard key={dish.productId} product={dish} />
          ))}
        </div>
      </section>

      {/* Chef's Recommended Dishes */}
      {recommendedDishes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242424]">
              Recommended Today
            </h2>
            <p className="text-sm text-[#242424]/70 mt-1">
              Balanced value picks crafted for solo lunches or group hangouts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedDishes.map((dish) => (
              <FoodCard key={dish.productId} product={dish} />
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews + Restaurant Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#242424]">
                Loved by Students &amp; Families
              </h2>
              <p className="text-sm text-[#242424]/70 mt-1">
                Verified feedback from diners in Selaqui, Dehradun.
              </p>
            </div>

            <div className="space-y-4">
              {reviews.slice(0, 4).map((rev) => (
                <article
                  key={rev.reviewId}
                  className="bg-white rounded-2xl border border-[#EADBC8] p-5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-bold text-[#242424]">{rev.userName}</p>
                    <div className="flex items-center gap-1 text-[#F28C28]" aria-label={`${rev.rating} out of 5 stars`}>
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-[#F28C28]" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-[#242424]/80 leading-relaxed">{rev.comment}</p>
                </article>
              ))}
            </div>

            {/* Leave a review */}
            <form
              onSubmit={handleReviewSubmit}
              className="bg-white rounded-2xl border border-[#EADBC8] p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-[#242424]">Share Your Experience</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= reviewRating ? 'fill-[#F28C28] text-[#F28C28]' : 'text-[#242424]/25'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={2}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={
                  user
                    ? 'Tell us what you ordered and how it tasted...'
                    : 'Sign in to post your review...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/60 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] disabled:opacity-60 cursor-pointer"
              >
                {user ? (submittingReview ? 'Posting...' : 'Post Review') : 'Sign In to Review'}
              </button>
            </form>
          </div>

          <aside className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC8] p-7 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#F28C28] tracking-wide">
                Our Kitchen in Selaqui
              </p>
              <h2 className="font-display text-2xl font-bold text-[#242424] mt-1">
                Quality Multi-Cuisine Without the Chain Markup
              </h2>
              <p className="text-sm text-[#242424]/75 leading-relaxed mt-3">
                La Casa was created so college students, young professionals, and local families in Selaqui don&apos;t have to travel far into Dehradun or pay premium chain prices for hygienic, diverse food.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#F3E8D8] text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#641E24] shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#242424]">Location</p>
                  <p className="text-[#242424]/70">
                    Chakrata Road, Selaqui, Dehradun, Uttarakhand 248011
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#641E24] shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#242424]">Kitchen Hours</p>
                  <p className="text-[#242424]/70">Monday – Sunday · 10:30 AM to 11:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#641E24] shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-[#242424]">Order Support</p>
                  <p className="text-[#242424]/70 tabular-nums">+91 135 269 4410 · hello@lacasakitchen.in</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};
