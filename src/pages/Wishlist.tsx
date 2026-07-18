import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../components/Toast';
import SafeImage from '../components/SafeImage';
import { formatPKR } from '../lib/format';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, loadingStore } = useStore();
  const { push } = useToast();

  if (loadingStore) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Loading wishlist…</div>;
  }

  if (wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-rose-50 text-rose-400">
          <Heart width={36} height={36} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Your wishlist is empty</h1>
        <p className="mt-2 text-slate-500">Tap the heart on any product to save it for later.</p>
        <Link to="/catalog" className="btn-primary mt-6">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">My Wishlist</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {wishlist.map((w) => {
          const p = w.product;
          if (!p) return null;
          return (
            <div key={w.id} className="card flex gap-4 p-4">
              <Link to={`/product/${p.slug}`} className="shrink-0">
                <SafeImage src={p.images[0] || ''} alt={p.name} className="h-24 w-24 rounded-xl object-cover bg-slate-100" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to={`/product/${p.slug}`} className="text-sm font-bold text-slate-800 hover:text-slate-900 line-clamp-2">{p.name}</Link>
                {p.brand && <p className="text-xs text-slate-400">{p.brand.name}</p>}
                <p className="mt-1 font-bold text-slate-900">{formatPKR(p.price)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      try { await addToCart(p, 1); push(`${p.name} added to cart`); } catch (e) { push(e instanceof Error ? e.message : 'Failed', 'error'); }
                    }}
                    className="btn-primary !px-3 !py-2 flex-1 text-xs"
                  >
                    <ShoppingCart width={14} height={14} /> Add
                  </button>
                  <button
                    onClick={async () => {
                      try { await toggleWishlist(p); push('Removed from wishlist'); } catch (e) { push(e instanceof Error ? e.message : 'Failed', 'error'); }
                    }}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-rose-500 hover:bg-rose-50"
                    aria-label="Remove"
                  >
                    <Heart className="fill-rose-500" width={16} height={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
