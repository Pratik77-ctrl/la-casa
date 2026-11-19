import React from 'react';
import { Heart, Minus, Plus } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { DishVisual } from './DishVisual';

interface FoodCardProps {
  product: Product;
}

export const FoodCard: React.FC<FoodCardProps> = ({ product }) => {
  const { cartItems, addToCart, updateCartQty, setSelectedProduct, favourites, toggleFavourite } =
    useStore();

  const cartEntry = cartItems.find((i) => i.productId === product.productId);
  const isFav = favourites.includes(product.productId);

  return (
    <article className="group bg-white rounded-2xl border border-[#EADBC8] overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="relative aspect-[4/3] bg-[#F7ECE0] overflow-hidden">
        <button
          type="button"
          onClick={() => setSelectedProduct(product)}
          aria-label={`View details for ${product.name}`}
          className="w-full h-full block cursor-pointer"
        >
          <DishVisual
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        </button>

        <button
          type="button"
          onClick={() => toggleFavourite(product.productId)}
          aria-label={isFav ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 border border-[#EADBC8] flex items-center justify-center text-[#641E24] hover:scale-105 transition-transform cursor-pointer"
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-[#641E24] text-[#641E24]' : 'text-[#242424]/70'}`} />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs text-[#242424]/65">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center justify-center w-4 h-4 rounded-xs border shrink-0 ${
                  product.foodType === 'veg' ? 'border-emerald-700' : 'border-red-700'
                }`}
                title={product.foodType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                aria-label={product.foodType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    product.foodType === 'veg' ? 'bg-emerald-700' : 'bg-red-700'
                  }`}
                />
              </span>
              <span className="truncate font-medium">{product.category}</span>
              {product.prepTime && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap shrink-0">{product.prepTime}</span>
                </>
              )}
            </div>
            {product.isBestseller && (
              <span className="text-[11px] font-semibold text-[#F28C28] whitespace-nowrap shrink-0">
                Bestseller
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSelectedProduct(product)}
            className="text-left block w-full cursor-pointer"
          >
            <h3 className="font-display text-lg font-semibold text-[#242424] leading-snug group-hover:text-[#641E24] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </button>

          <p className="text-xs text-[#242424]/70 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#F3E8D8] flex items-center justify-between gap-3">
          <div>
            <span className="font-mono tabular-nums text-lg font-bold text-[#242424]">
              ₹{product.price}
            </span>
          </div>

          {!product.available ? (
            <span className="text-xs font-semibold text-[#242424]/50">Sold Out</span>
          ) : cartEntry ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#641E24] bg-[#641E24] text-[#FFF8ED] px-2 py-1">
              <button
                type="button"
                onClick={() => updateCartQty(product.productId, cartEntry.quantity - 1)}
                aria-label={`Decrease quantity of ${product.name}`}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono tabular-nums text-sm font-bold min-w-[1.25rem] text-center">
                {cartEntry.quantity}
              </span>
              <button
                type="button"
                onClick={() => updateCartQty(product.productId, cartEntry.quantity + 1)}
                aria-label={`Increase quantity of ${product.name}`}
                className="w-7 h-7 rounded-lg hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              className="px-4 py-2 rounded-xl bg-[#F28C28] text-white text-xs font-bold hover:bg-[#D97415] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
