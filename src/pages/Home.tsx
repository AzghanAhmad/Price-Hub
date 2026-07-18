import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, TrendingUp, Sparkles } from 'lucide-react';
import type { Category, Product } from '../lib/types';
import { fetchCategories, fetchProducts } from '../lib/data';
import ProductCard from '../components/ProductCard';
import { formatPKR, discountPercent } from '../lib/format';
import SafeImage from '../components/SafeImage';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchProducts({ featured: true, limit: 8 }),
      fetchProducts({ sort: 'discount', limit: 8 }),
    ])
      .then(([c, f, d]) => {
        setCategories(c);
        setFeatured(f);
        setDeals(d);
      })
      .finally(() => setLoading(false));
  }, []);

  const heroCategories = categories.slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="text-white animate-fade-up">
              <span className="chip glass text-white">
                <Sparkles width={12} height={12} /> Pakistan's #1 Electronics Store
              </span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
                Premium tech at <span className="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">honest prices</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-slate-300 sm:text-lg">
                Smartphones, laptops, audio, and more — genuine products, fast delivery, and prices you can trust.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/catalog" className="btn-accent !px-6 !py-3 text-base">
                  Shop Now <ArrowRight width={18} height={18} />
                </Link>
                <Link to="/catalog?deals=1" className="btn-ghost !bg-white/10 !text-white !border-white/20 !px-6 !py-3 text-base hover:!bg-white/20">
                  <Zap width={18} height={18} /> Hot Deals
                </Link>
              </div>
            </div>

            <div className="hidden md:block animate-fade-up" style={{ animationDelay: '150ms' }}>
              <div className="grid grid-cols-2 gap-4">
                {featured.slice(0, 4).map((p, i) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    className={`glass rounded-2xl p-3 transition-transform hover:-translate-y-1 ${i % 2 === 1 ? 'translate-y-6' : ''}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-xl bg-white">
                      <SafeImage src={p.images[0] || ''} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs font-semibold text-white">{p.name}</p>
                    <p className="text-sm font-bold text-emerald-300">{formatPKR(p.price)}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Shop by Category</h2>
          <Link to="/catalog" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {heroCategories.map((c, i) => (
            <Link
              key={c.id}
              to={`/catalog?category=${c.slug}`}
              className="card group flex flex-col items-center gap-2 p-4 hover:shadow-lg hover:-translate-y-0.5 animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 group-hover:from-emerald-100 group-hover:to-sky-100 group-hover:text-emerald-700 transition-all">
                <span className="text-2xl font-extrabold">{c.name[0]}</span>
              </div>
              <span className="text-center text-xs font-semibold text-slate-700">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-600" />
            <h2 className="text-2xl font-extrabold text-slate-900">Featured Products</h2>
          </div>
          <Link to="/catalog?sort=rating" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">See more →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>

      {/* Deals banner */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 to-orange-500 p-8 text-white md:p-12">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <span className="chip bg-white/20 text-white"><Zap width={12} height={12} /> Limited Time</span>
            <h2 className="mt-3 text-3xl font-extrabold md:text-4xl">Mega Deals Week</h2>
            <p className="mt-2 max-w-md text-white/90">Up to 30% off on top brands. Use code <span className="font-bold underline">MONSOON15</span> for extra 15% off.</p>
            <Link to="/catalog?deals=1" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-rose-600 hover:bg-rose-50 transition-colors">
              Grab Deals <ArrowRight width={18} height={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Deals grid */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">Today's Best Deals</h2>
          <Link to="/catalog?deals=1" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">All deals →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {deals
              .filter((p) => discountPercent(Number(p.price), p.compare_at_price ? Number(p.compare_at_price) : null) > 0)
              .slice(0, 4)
              .map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>
    </div>
  );
}
