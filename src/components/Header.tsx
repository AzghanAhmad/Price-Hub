import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, X, LayoutDashboard, LogOut, Package } from 'lucide-react';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { searchSuggestions } from '../lib/data';
import { formatPKR } from '../lib/format';
import type { Product } from '../lib/types';
import SafeImage from './SafeImage';

export default function Header() {
  const { cartCount, wishlist } = useStore();
  const { profile, isAdmin, signOut } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const navigate = useNavigate();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const res = await searchSuggestions(query);
        setSuggestions(res);
        setShowSug(true);
      } else {
        setSuggestions([]);
        setShowSug(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSug(false);
        setUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(query.trim())}`);
      setShowSug(false);
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-dark text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>

          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white font-extrabold shadow-lg">
              P
            </div>
            <span className="text-xl font-extrabold tracking-tight hidden sm:block">PriceHub</span>
          </Link>

          <div ref={boxRef} className="relative flex-1 max-w-2xl mx-auto">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width={18} height={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length && setShowSug(true)}
                placeholder="Search smartphones, laptops, audio…"
                className="w-full rounded-xl bg-white/95 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none ring-1 ring-white/20 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-400"
              />
            </form>
            {showSug && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    onClick={() => { setShowSug(false); setQuery(''); }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <SafeImage src={p.images[0] || ''} alt={p.name} className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">{formatPKR(p.price)}</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={submitSearch}
                  className="w-full bg-slate-50 px-4 py-2.5 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  See all results for "{query}"
                </button>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link to="/catalog" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">Shop</Link>
            <Link to="/catalog?deals=1" className="px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors">Deals</Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 transition-colors" aria-label="Wishlist">
              <Heart width={20} height={20} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 transition-colors" aria-label="Cart">
              <ShoppingCart width={20} height={20} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="grid h-10 w-10 place-items-center rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Account"
              >
                <User width={20} height={20} />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl ring-1 ring-slate-200">
                  {profile ? (
                    <>
                      <div className="border-b border-slate-100 px-4 py-3">
                        <p className="truncate text-sm font-bold">{profile.full_name || 'Account'}</p>
                        <p className="truncate text-xs text-slate-500 capitalize">{profile.role}</p>
                      </div>
                      <Link to="/orders" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                        <Package width={16} height={16} /> My Orders
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                          <LayoutDashboard width={16} height={16} /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserMenu(false); signOut(); navigate('/'); }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut width={16} height={16} /> Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">Sign in</Link>
                      <Link to="/signup" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm hover:bg-slate-50">Create account</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass border-b border-white/40 px-4 py-3 flex flex-col gap-1">
          <Link to="/catalog" onClick={() => setMenuOpen(false)} className="py-2 font-medium text-slate-800">Shop</Link>
          <Link to="/catalog?deals=1" onClick={() => setMenuOpen(false)} className="py-2 font-medium text-slate-800">Deals</Link>
          <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="py-2 font-medium text-slate-800">Wishlist</Link>
          <Link to="/orders" onClick={() => setMenuOpen(false)} className="py-2 font-medium text-slate-800">My Orders</Link>
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className="py-2 font-medium text-slate-800">Admin</Link>}
        </div>
      )}
    </header>
  );
}
