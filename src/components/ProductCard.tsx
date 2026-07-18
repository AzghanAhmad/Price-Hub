import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '../lib/types';
import { formatPKR, discountPercent } from '../lib/format';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { useToast } from './Toast';
import SafeImage from './SafeImage';
import StarRating from './StarRating';

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { session } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const pct = discountPercent(Number(product.price), product.compare_at_price ? Number(product.compare_at_price) : null);
  const wished = isWishlisted(product.id);

  const requireAuth = (next: () => Promise<void>) => {
    if (!session?.user) {
      push('Please sign in to continue', 'info');
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    next();
  };

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      try {
        await addToCart(product, 1);
        push(`${product.name} added to cart`);
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed to add', 'error');
      }
    });
  };

  const handleWish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth(async () => {
      try {
        await toggleWishlist(product);
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed', 'error');
      }
    });
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      className="card group flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-1 animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 300)}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <SafeImage
          src={product.images[0] || ''}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.campaign && (
            <span className="chip bg-rose-600 text-white shadow max-w-[9rem] truncate">{product.campaign}</span>
          )}
          {pct > 0 && <span className="chip bg-rose-500 text-white shadow">-{pct}%</span>}
          {product.featured && !product.campaign && <span className="chip bg-slate-900 text-white shadow">Featured</span>}
        </div>
        <button
          onClick={handleWish}
          aria-label="Toggle wishlist"
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur shadow transition-all hover:bg-white active:scale-90"
        >
          <Heart className={wished ? 'fill-rose-500 text-rose-500' : 'text-slate-600'} width={16} height={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.brand && <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{product.brand.name}</span>}
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{product.name}</h3>
        <div className="mt-1.5">
          <StarRating rating={product.rating_avg} count={product.rating_count} />
        </div>
        <div className="mt-auto pt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-base font-bold text-slate-900">{formatPKR(product.price)}</p>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <p className="text-xs text-slate-400 line-through">{formatPKR(product.compare_at_price)}</p>
            )}
          </div>
          <button
            onClick={handleAdd}
            aria-label="Add to cart"
            className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-white transition-all hover:bg-emerald-500 active:scale-90"
          >
            <ShoppingCart width={16} height={16} />
          </button>
        </div>
      </div>
    </Link>
  );
}
