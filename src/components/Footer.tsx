import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

export default function Footer() {
  const features = [
    { icon: Truck, title: 'Free Delivery', desc: 'On orders over Rs. 5,000' },
    { icon: ShieldCheck, title: 'Secure Payments', desc: '100% protected checkout' },
    { icon: RotateCcw, title: '7-Day Returns', desc: 'Easy return policy' },
    { icon: Headphones, title: '24/7 Support', desc: 'Dedicated assistance' },
  ];

  return (
    <footer className="mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white/70 p-6 backdrop-blur md:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-50 to-sky-50 text-emerald-600">
                <f.icon width={20} height={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{f.title}</p>
                <p className="text-xs text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white font-extrabold">P</div>
              <span className="text-xl font-extrabold text-white">PriceHub</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Pakistan's trusted destination for smartphones, laptops, and electronics at the best prices.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/catalog?category=smartphones" className="hover:text-white">Smartphones</Link></li>
              <li><Link to="/catalog?category=laptops" className="hover:text-white">Laptops</Link></li>
              <li><Link to="/catalog?category=audio" className="hover:text-white">Audio</Link></li>
              <li><Link to="/catalog?deals=1" className="hover:text-white">Today's Deals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Account</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
              <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
              <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
              <li><Link to="/login" className="hover:text-white">Sign in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-400">
              <li>UAN: 0800-PRICE</li>
              <li>support@pricehub.pk</li>
              <li>Mon–Sun, 9am–9pm</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-slate-500 sm:px-6">
            © {new Date().getFullYear()} PriceHub.pk — All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
