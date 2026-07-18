import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, ChevronRight, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import type { Product, Review } from '../lib/types';
import { fetchProductBySlug, fetchReviews, addReview } from '../lib/data';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { formatPKR, discountPercent, sanitizeText } from '../lib/format';
import SafeImage from '../components/SafeImage';
import StarRating from '../components/StarRating';
import ProductCard from '../components/ProductCard';
import { fetchProducts } from '../lib/data';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { profile, session } = useAuth();
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { push } = useToast();

  const requireAuth = (next: () => Promise<void>) => {
    if (!session?.user) {
      push('Please sign in to continue', 'info');
      navigate(`/login?redirect=${encodeURIComponent(`/product/${product!.slug}`)}`);
      return;
    }
    next();
  };

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'specs' | 'reviews'>('specs');

  // review form
  const [rRating, setRRating] = useState(5);
  const [rTitle, setRTitle] = useState('');
  const [rBody, setRBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setActiveImg(0);
    setQty(1);
    setTab('specs');
    fetchProductBySlug(slug)
      .then(async (p) => {
        setProduct(p);
        if (p) {
          const [rv, rel] = await Promise.all([
            fetchReviews(p.id),
            p.category_id ? fetchProducts({ category: p.category_id, limit: 5 }) : Promise.resolve([]),
          ]);
          setReviews(rv);
          setRelated(rel.filter((x) => x.id !== p.id).slice(0, 4));
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4 rounded-lg" />
            <div className="skeleton h-6 w-1/2 rounded-lg" />
            <div className="skeleton h-24 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-2xl font-bold text-slate-800">Product not found</p>
        <Link to="/catalog" className="btn-primary mt-4">Browse catalog</Link>
      </div>
    );
  }

  const pct = discountPercent(Number(product.price), product.compare_at_price ? Number(product.compare_at_price) : null);
  const wished = isWishlisted(product.id);
  const inStock = product.stock > 0;
  const specs = product.specs || {};

  const handleAdd = () => {
    requireAuth(async () => {
      try {
        await addToCart(product, qty);
        push(`${qty} × ${product.name} added to cart`);
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed', 'error');
      }
    });
  };

  const handleBuyNow = () => {
    requireAuth(async () => {
      try {
        await addToCart(product, qty);
        navigate('/cart');
      } catch (err) {
        push(err instanceof Error ? err.message : 'Failed', 'error');
      }
    });
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      push('Please sign in to leave a review', 'error');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await addReview(product.id, profile.user_id, rRating, sanitizeText(rTitle), sanitizeText(rBody));
      const rv = await fetchReviews(product.id);
      setReviews(rv);
      setRTitle('');
      setRBody('');
      setRRating(5);
      push('Review submitted');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-700">Home</Link>
        <ChevronRight width={14} height={14} />
        <Link to="/catalog" className="hover:text-slate-700">Catalog</Link>
        {product.category && (
          <>
            <ChevronRight width={14} height={14} />
            <Link to={`/catalog?category=${product.category.slug}`} className="hover:text-slate-700">{product.category.name}</Link>
          </>
        )}
        <ChevronRight width={14} height={14} />
        <span className="truncate text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="card overflow-hidden">
            <div className="aspect-square bg-slate-50">
              <SafeImage src={product.images[activeImg] || product.images[0] || ''} alt={product.name} className="h-full w-full object-cover" />
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${activeImg === i ? 'border-slate-900' : 'border-transparent hover:border-slate-300'}`}
                >
                  <SafeImage src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div>
          {product.brand && <span className="text-sm font-bold uppercase tracking-wide text-slate-400">{product.brand.name}</span>}
          {product.campaign && (
            <span className="ml-2 chip bg-rose-100 text-rose-700">{product.campaign}</span>
          )}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating_avg} size={16} showValue />
            <span className="text-sm text-slate-500">{product.rating_count} reviews</span>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-extrabold text-slate-900">{formatPKR(product.price)}</span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPKR(product.compare_at_price)}</span>
                <span className="chip bg-rose-100 text-rose-700">Save {pct}%</span>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-sm">
            {inStock ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600"><Check width={16} height={16} /> In stock ({product.stock} available)</span>
            ) : (
              <span className="font-semibold text-rose-600">Out of stock</span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-slate-600">{product.description}</p>

          {/* quantity + actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-slate-600 hover:text-slate-900" aria-label="Decrease">
                <Minus width={16} height={16} />
              </button>
              <span className="w-10 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="grid h-11 w-11 place-items-center text-slate-600 hover:text-slate-900" aria-label="Increase">
                <Plus width={16} height={16} />
              </button>
            </div>

            <button onClick={handleAdd} disabled={!inStock} className="btn-primary !px-6">
              <ShoppingCart width={18} height={18} /> Add to Cart
            </button>
            <button onClick={handleBuyNow} disabled={!inStock} className="btn-accent !px-6">
              Buy Now
            </button>
            <button
              onClick={() =>
                requireAuth(async () => {
                  try {
                    await toggleWishlist(product);
                  } catch (e) {
                    push(e instanceof Error ? e.message : 'Failed', 'error');
                  }
                })
              }
              className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-500 transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={wished ? 'fill-rose-500 text-rose-500' : ''} width={18} height={18} />
            </button>
          </div>

          {/* perks */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'Free Delivery' },
              { icon: ShieldCheck, label: '1 Year Warranty' },
              { icon: RotateCcw, label: '7-Day Returns' },
            ].map((p) => (
              <div key={p.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-slate-50 p-3 text-center">
                <p.icon className="text-emerald-600" width={20} height={20} />
                <span className="text-xs font-medium text-slate-600">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-12">
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setTab('specs')}
            className={`px-4 py-3 text-sm font-bold transition-colors ${tab === 'specs' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Specifications
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`px-4 py-3 text-sm font-bold transition-colors ${tab === 'reviews' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Reviews ({reviews.length})
          </button>
        </div>

        {tab === 'specs' ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <tbody>
                {Object.entries(specs).map(([k, v], i) => (
                  <tr key={k} className={i % 2 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="w-1/3 px-4 py-3 font-semibold text-slate-700">{k}</td>
                    <td className="px-4 py-3 text-slate-600">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            {/* review form */}
            <div className="lg:col-span-1">
              <div className="card p-5">
                <h3 className="text-lg font-bold text-slate-900">Write a Review</h3>
                <form onSubmit={submitReview} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Rating</label>
                    <div className="mt-1.5 flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRRating(i)}
                          className="text-2xl transition-transform hover:scale-110"
                        >
                          <StarRating rating={i <= rRating ? i : i - 0.5} size={24} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Title</label>
                    <input value={rTitle} onChange={(e) => setRTitle(e.target.value)} className="input-field mt-1.5" placeholder="Great product!" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Review</label>
                    <textarea value={rBody} onChange={(e) => setRBody(e.target.value)} rows={3} className="input-field mt-1.5 resize-none" placeholder="Share your experience…" />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary w-full">Submit Review</button>
                </form>
              </div>
            </div>

            {/* reviews list */}
            <div className="space-y-4 lg:col-span-2">
              {reviews.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-slate-500">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className="card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 font-bold text-white">
                          {(r.profile?.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{r.profile?.full_name || 'Anonymous'}</p>
                          <StarRating rating={r.rating} size={12} />
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {r.title && <p className="mt-3 text-sm font-bold text-slate-800">{r.title}</p>}
                    {r.body && <p className="mt-1 text-sm text-slate-600">{r.body}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* related */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-6 text-2xl font-extrabold text-slate-900">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
