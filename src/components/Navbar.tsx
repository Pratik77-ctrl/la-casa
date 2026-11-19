import React, { useState } from 'react';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { AppView } from '../types';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, openAuthModal } = useAuth();
  const { activeView, navigateTo, cartTotals, setCartOpen } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { label: string; view: AppView }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Menu', view: 'menu' },
    { label: 'Offers', view: 'offers' },
    { label: 'Orders', view: 'orders' },
    ...(isAdmin ? [{ label: 'Admin', view: 'admin' as AppView }] : []),
  ];

  const handleNav = (view: AppView) => {
    navigateTo(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFF8ED]/95 backdrop-blur-sm border-b border-[#E8D8C3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="font-display text-2xl font-bold tracking-tight text-[#641E24] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F28C28]"
        >
          La Casa
        </button>

        {/* Zone 2: Clean Single-line Text Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNav(item.view)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#641E24] border-[#F28C28]'
                    : 'text-[#242424]/75 border-transparent hover:text-[#641E24]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action & Cart / Account */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping cart with ${cartTotals.itemCount} items`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E6D6C2] text-sm font-semibold text-[#242424] hover:border-[#641E24]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-[#641E24]" />
            <span>Cart</span>
            <span className="font-mono tabular-nums text-xs font-bold text-[#641E24]">
              ({cartTotals.itemCount})
            </span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => handleNav('profile')}
              aria-label="Open customer profile"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="max-w-[110px] truncate">
                {profile?.fullName?.split(' ')[0] || user.displayName?.split(' ')[0] || 'Account'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In
            </button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2 rounded-xl border border-[#E6D6C2] bg-white text-[#242424] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8D8C3] bg-[#FFF8ED] px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => handleNav(item.view)}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer ${
                activeView === item.view
                  ? 'bg-[#641E24] text-[#FFF8ED]'
                  : 'text-[#242424] hover:bg-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#E8D8C3]">
            {user ? (
              <button
                type="button"
                onClick={() => handleNav('profile')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#641E24] border border-[#E6D6C2] cursor-pointer"
              >
                My Profile ({profile?.fullName || user.email})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full px-4 py-2.5 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold cursor-pointer"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
