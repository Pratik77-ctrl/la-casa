import React from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FoodDetailModal } from './components/FoodDetailModal';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { MenuPage } from './components/MenuPage';
import { Navbar } from './components/Navbar';
import { OffersPage } from './components/OffersPage';
import { OrdersPage } from './components/OrdersPage';
import { ProfilePage } from './components/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';

const MainShell: React.FC = () => {
  const { activeView, toast } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8ED] text-[#242424]">
      <Navbar />

      <main className="flex-1">
        {activeView === 'home' && <HomePage />}
        {activeView === 'menu' && <MenuPage />}
        {activeView === 'offers' && <OffersPage />}
        {activeView === 'orders' && <OrdersPage />}
        {activeView === 'checkout' && <CheckoutPage />}
        {activeView === 'profile' && <ProfilePage />}
        {activeView === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      <AuthModal />
      <FoodDetailModal />
      <CartDrawer />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 left-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white ${
            toast.type === 'error'
              ? 'bg-red-700'
              : toast.type === 'info'
              ? 'bg-[#242424]'
              : 'bg-[#641E24]'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <MainShell />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
