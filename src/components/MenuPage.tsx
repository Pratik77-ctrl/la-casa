import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { filterAndSortProducts } from '../utils/commerce';
import { FoodCard } from './FoodCard';

export const MenuPage: React.FC = () => {
  const {
    categories,
    products,
    catalogLoading,
    menuSearch,
    setMenuSearch,
    menuCategory,
    setMenuCategory,
  } = useStore();

  const [foodType, setFoodType] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [sortBy, setSortBy] = useState<'popularity' | 'price-asc' | 'price-desc'>('popularity');

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        search: menuSearch,
        category: menuCategory,
        foodType,
        maxPrice: maxPrice >= 300 ? null : maxPrice,
        sortBy,
      }),
    [foodType, maxPrice, menuCategory, menuSearch, products, sortBy]
  );

  const resetFilters = () => {
    setMenuSearch('');
    setMenuCategory('All');
    setFoodType('all');
    setMaxPrice(300);
    setSortBy('popularity');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#242424]">
            La Casa Menu
          </h1>
          <p className="text-sm text-[#242424]/70 mt-1">
            Freshly cooked Indian &amp; international dishes at student-friendly prices.
          </p>
        </div>
        <p className="text-xs font-semibold text-[#242424]/65 tabular-nums">
          Showing {filteredProducts.length} of {products.length} dishes
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EADBC8] p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#242424]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              aria-label="Search menu dishes"
              placeholder="Search dishes, ingredients, or cuisines..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFF8ED]/70 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1 p-1 rounded-xl bg-[#F4E7D3]">
            {(['all', 'veg', 'non-veg'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFoodType(type)}
                className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  foodType === type ? 'bg-white text-[#641E24] shadow-xs' : 'text-[#242424]/75'
                }`}
              >
                {type === 'all' ? 'All' : type === 'veg' ? 'Veg Only' : 'Non-Veg'}
              </button>
            ))}
          </div>

          <div className="md:col-span-2 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#641E24] shrink-0" />
            <div className="flex-1">
              <label htmlFor="price-range" className="block text-[11px] font-semibold text-[#242424]/70 tabular-nums">
                Max Price: {maxPrice >= 300 ? 'Any' : `₹${maxPrice}`}
              </label>
              <input
                id="price-range"
                type="range"
                min={50}
                max={300}
                step={10}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#641E24] cursor-pointer"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="sort-menu" className="sr-only">
              Sort dishes
            </label>
            <select
              id="sort-menu"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popularity' | 'price-asc' | 'price-desc')}
              className="w-full px-3 py-2.5 rounded-xl bg-[#FFF8ED]/70 border border-[#DFCBB3] text-xs font-semibold text-[#242424] focus:outline-none focus:border-[#641E24] cursor-pointer"
            >
              <option value="popularity">Sort: Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setMenuCategory('All')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              menuCategory === 'All'
                ? 'bg-[#641E24] text-[#FFF8ED]'
                : 'bg-[#FFF8ED] text-[#242424]/80 hover:bg-[#F4E7D3]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.categoryId}
              type="button"
              onClick={() => setMenuCategory(cat.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                menuCategory === cat.name
                  ? 'bg-[#641E24] text-[#FFF8ED]'
                  : 'bg-[#FFF8ED] text-[#242424]/80 hover:bg-[#F4E7D3]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      {catalogLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EADBC8] h-80 animate-pulse"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#242424]">
            No matching dishes found
          </h2>
          <p className="text-sm text-[#242424]/70 max-w-md mx-auto">
            Try clearing your search term or widening the price filter to view all dishes.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <FoodCard key={product.productId} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
