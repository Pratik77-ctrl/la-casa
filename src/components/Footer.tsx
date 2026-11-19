import React from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const Footer: React.FC = () => {
  const { navigateTo } = useStore();

  return (
    <footer className="bg-[#242424] text-[#FFF8ED] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-display text-2xl font-bold text-[#FFF8ED]">La Casa</h2>
            <p className="text-sm font-medium text-[#F28C28]">
              A World of Flavours. One Affordable Place.
            </p>
            <p className="text-sm text-[#FFF8ED]/75 max-w-md leading-relaxed">
              Serving freshly cooked Indian, Chinese, Italian, Mexican, wood-fired pizzas, and cafe favourites at student-friendly prices in Selaqui, Dehradun.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FFF8ED]">Quick Links</h3>
            <ul className="space-y-2 text-sm text-[#FFF8ED]/75">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="hover:text-[#F28C28] transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('menu')}
                  className="hover:text-[#F28C28] transition-colors cursor-pointer"
                >
                  Explore Menu
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('offers')}
                  className="hover:text-[#F28C28] transition-colors cursor-pointer"
                >
                  Student Offers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('orders')}
                  className="hover:text-[#F28C28] transition-colors cursor-pointer"
                >
                  Track Orders
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#FFF8ED]">Visit &amp; Contact</h3>
            <ul className="space-y-2.5 text-sm text-[#FFF8ED]/75">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F28C28] shrink-0 mt-0.5" />
                <span>Chakrata Road, Near Campus Hub, Selaqui, Dehradun, Uttarakhand 248011</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span>Daily · 10:30 AM – 11:00 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span className="tabular-nums">+91 7561906302</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span>pratikkrpatel04@gmail.co</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FFF8ED]/60">
          <p>© {new Date().getFullYear()} La Casa Restaurant, Selaqui, Dehradun. All rights reserved.</p>
          <p>Freshly Prepared · Hygienic Kitchen · Student-Friendly Dining</p>
        </div>
      </div>
    </footer>
  );
};
