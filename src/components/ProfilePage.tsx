import React, { useEffect, useState } from 'react';
import { LogOut, MapPin, Plus, ShieldCheck, Trash2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { logoutUser, updateUserProfileData } from '../firebase/services';
import { AddressItem } from '../types';
import { FoodCard } from './FoodCard';

export const ProfilePage: React.FC = () => {
  const { user, profile, isAdmin, openAuthModal } = useAuth();
  const { products, favourites, orders, navigateTo, showToast } = useStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newLine, setNewLine] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setAddresses(profile.addresses || []);
    }
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#641E24]/10 text-[#641E24] flex items-center justify-center mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#242424]">Customer Profile</h1>
        <p className="text-sm text-[#242424]/70 max-w-md mx-auto">
          Sign in to manage your personal information, delivery addresses, saved favourite dishes, and past orders.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] cursor-pointer"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  const favouriteProducts = products.filter((p) => favourites.includes(p.productId));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      showToast('Full name must be at least 2 characters.', 'error');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfileData(user.uid, { fullName, phone, addresses });
      showToast('Profile updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || newLine.trim().length < 6) {
      showToast('Enter both an address label and street/hostel details.', 'error');
      return;
    }
    const updated: AddressItem[] = [
      ...addresses,
      {
        id: `addr-${Date.now()}`,
        label: newLabel.trim(),
        line: newLine.trim(),
        landmark: newLandmark.trim(),
      },
    ];
    setAddresses(updated);
    await updateUserProfileData(user.uid, {
      fullName: fullName || profile?.fullName || 'La Casa Guest',
      phone,
      addresses: updated,
    });
    setNewLabel('');
    setNewLine('');
    setNewLandmark('');
    showToast('Address saved.');
  };

  const handleRemoveAddress = async (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    await updateUserProfileData(user.uid, {
      fullName: fullName || profile?.fullName || 'La Casa Guest',
      phone,
      addresses: updated,
    });
    showToast('Address removed.');
  };

  const handleLogout = async () => {
    await logoutUser();
    showToast('Signed out.');
    navigateTo('home');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6D6C2]">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#242424]">
            {profile?.fullName || user.displayName || 'Your Account'}
          </h1>
          <p className="text-sm text-[#242424]/70 mt-1">
            {user.email} · {isAdmin ? 'Administrator' : 'Customer'} ·{' '}
            <span className="tabular-nums">{orders.length} Orders</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F28C28] text-white text-xs font-bold hover:bg-[#D97415] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              Open Admin Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#DFCBB3] text-xs font-semibold text-[#242424] hover:border-red-300 hover:text-red-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Personal Info */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-5 bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-4"
        >
          <h2 className="font-display text-xl font-bold text-[#242424]">Personal Information</h2>
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-[#242424] mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
            />
          </div>
          <div>
            <label htmlFor="prof-email" className="block text-xs font-semibold text-[#242424] mb-1">
              Email Address
            </label>
            <input
              id="prof-email"
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F4E7D3]/50 border border-[#DFCBB3] text-sm text-[#242424]/65"
            />
          </div>
          <div>
            <label htmlFor="prof-phone" className="block text-xs font-semibold text-[#242424] mb-1">
              Mobile Number
            </label>
            <input
              id="prof-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 px-4 rounded-xl bg-[#641E24] text-[#FFF8ED] text-sm font-semibold hover:bg-[#4A1419] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Saved Addresses */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EADBC8] p-6 space-y-5">
          <h2 className="font-display text-xl font-bold text-[#242424]">Saved Delivery Addresses</h2>

          {addresses.length === 0 ? (
            <p className="text-sm text-[#242424]/65">
              No saved addresses yet. Add your hostel, PG, or home address for faster checkout.
            </p>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-xl bg-[#FFF8ED]/70 border border-[#EADBC8] flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#641E24] shrink-0 mt-1" />
                    <div>
                      <p className="text-sm font-bold text-[#242424]">{addr.label}</p>
                      <p className="text-xs text-[#242424]/75 mt-0.5">{addr.line}</p>
                      {addr.landmark && (
                        <p className="text-xs text-[#242424]/60 mt-0.5">Near {addr.landmark}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAddress(addr.id)}
                    aria-label={`Delete address ${addr.label}`}
                    className="p-1.5 text-[#242424]/50 hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddAddress} className="pt-4 border-t border-[#F3E8D8] space-y-3">
            <h3 className="text-xs font-bold text-[#242424]">Add New Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g., Hostel Block B)"
                className="px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
              />
              <input
                type="text"
                value={newLandmark}
                onChange={(e) => setNewLandmark(e.target.value)}
                placeholder="Landmark (Optional)"
                className="px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newLine}
                onChange={(e) => setNewLine(e.target.value)}
                placeholder="Full address in Selaqui, Dehradun"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#FFF8ED]/50 border border-[#DFCBB3] text-sm focus:outline-none focus:border-[#641E24]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#641E24] text-[#FFF8ED] text-xs font-semibold hover:bg-[#4A1419] whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Favourites */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#242424]">
            Favourite Dishes ({favouriteProducts.length})
          </h2>
          <button
            type="button"
            onClick={() => navigateTo('orders')}
            className="text-sm font-semibold text-[#641E24] hover:underline cursor-pointer"
          >
            View Order History
          </button>
        </div>

        {favouriteProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EADBC8] p-8 text-center">
            <p className="text-sm text-[#242424]/70">
              Tap the heart icon on any dish to save your go-to favourites here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favouriteProducts.map((prod) => (
              <FoodCard key={prod.productId} product={prod} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
