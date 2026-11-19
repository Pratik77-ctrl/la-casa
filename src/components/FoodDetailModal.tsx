import React, { useEffect, useState } from 'react';
import { Clock, Heart, Minus, Plus, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DishVisual } from './DishVisual';

export const FoodDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart, favourites, toggleFavourite } =
    useStore();
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setQty(1);
  }, [selectedProduct?.productId]);

  if (!selectedProduct) return null;

  const isFav = favourites.includes(selectedProduct.productId);

  const handleAdd = () => {
    addToCart(selectedProduct, qty);
    setSelectedProduct(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div className="bg-[#FFF8ED] w-full max-w-3xl rounded-2xl border border-[#E5D5BF] shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-6 bg-[#F7ECE0] relative min-h-[260px]">
            <DishVisual
              src={selectedProduct.imageUrl}
              alt={selectedProduct.name}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => toggleFavourite(selectedProduct.productId)}
              aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
              className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/95 border border-[#EADBC8] flex items-center justify-center cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 ${isFav ? 'fill-[#641E24] text-[#641E24]' : 'text-[#242424]/70'}`}
              />
            </button>
          </div>

          <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#242424]/70">
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border ${
                      selectedProduct.foodType === 'veg' ? 'border-emerald-700' : 'border-red-700'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedProduct.foodType === 'veg' ? 'bg-emerald-700' : 'bg-red-700'
                      }`}
                    />
                  </span>
                  <span className="font-semibold text-[#641E24]">{selectedProduct.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className={selectedProduct.available ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                    {selectedProduct.available ? 'Available' : 'Sold Out'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  aria-label="Close dish details"
                  className="p-1.5 rounded-lg hover:bg-[#EFE2CE] text-[#242424] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h2
                  id="product-detail-title"
                  className="font-display text-2xl font-bold text-[#242424] leading-snug"
                >
                  {selectedProduct.name}
                </h2>
                <p className="font-mono tabular-nums text-2xl font-bold text-[#641E24] mt-2">
                  ₹{selectedProduct.price}
                </p>
              </div>

              <p className="text-sm text-[#242424]/80 leading-relaxed">
                {selectedProduct.description}
              </p>

              {selectedProduct.prepTime && (
                <div className="flex items-center gap-2 text-xs text-[#242424]/70">
                  <Clock className="w-4 h-4 text-[#F28C28]" />
                  <span>Estimated preparation: {selectedProduct.prepTime}</span>
                </div>
              )}

              {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                <div className="pt-2 border-t border-[#EADBC8]">
                  <p className="text-xs font-bold text-[#242424] mb-1.5">Key Ingredients</p>
                  <p className="text-xs text-[#242424]/75 leading-relaxed">
                    {selectedProduct.ingredients.join(' · ')}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#EADBC8] flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-[#DFCBB3] bg-white px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-8 h-8 rounded-lg hover:bg-[#FFF8ED] flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono tabular-nums text-sm font-bold min-w-[1.5rem] text-center">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  aria-label="Increase quantity"
                  className="w-8 h-8 rounded-lg hover:bg-[#FFF8ED] flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={!selectedProduct.available}
                onClick={handleAdd}
                className="flex-1 py-3 px-5 rounded-xl bg-[#F28C28] text-white text-sm font-bold hover:bg-[#D97415] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {selectedProduct.available
                  ? `Add to Cart · ₹${selectedProduct.price * qty}`
                  : 'Currently Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
