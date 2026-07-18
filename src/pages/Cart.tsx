import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../lib/store';
import { useToast } from '../components/Toast';
import { formatPKR } from '../lib/format';
import SafeImage from '../components/SafeImage';

export default function Cart() {
  const { cart, updateCartQty, removeFromCart, cartSubtotal, loadingStore } = useStore();
  const { push } = useToast();
  const navigate = useNavigate();

  const shipping = cartSubtotal > 5000 || cartSubtotal === 0 ? 0 : 250;
  const total = cartSubtotal + shipping;

  const handleQty = async (id: string, qty: number) => {
    try {
      await updateCartQty(id, qty);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFromCart(id);
      push('Item removed from cart');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  if (loadingStore) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-slate-500">Loading cart…</div>;
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <ShoppingBag width={36} height={36} />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Browse our catalog and add items you love.</p>
        <Link to="/catalog" className="btn-primary mt-6">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">Shopping Cart</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {cart.map((item) => {
            const p = item.product;
            if (!p) return null;
            return (
              <div key={item.id} className="card flex gap-4 p-4">
                <Link to={`/product/${p.slug}`} className="shrink-0">
                  <SafeImage src={p.images[0] || ''} alt={p.name} className="h-24 w-24 rounded-xl object-cover bg-slate-100" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/product/${p.slug}`} className="text-sm font-bold text-slate-800 hover:text-slate-900">
                      {p.name}
                    </Link>
                    <button onClick={() => handleRemove(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors" aria-label="Remove">
                      <Trash2 width={18} height={18} />
                    </button>
                  </div>
                  {p.brand && <p className="text-xs text-slate-400">{p.brand.name}</p>}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-lg border border-slate-200">
                      <button onClick={() => handleQty(item.id, item.quantity - 1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:text-slate-900" aria-label="Decrease">
                        <Minus width={14} height={14} />
                      </button>
                      <span className="w-9 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => handleQty(item.id, item.quantity + 1)} className="grid h-9 w-9 place-items-center text-slate-600 hover:text-slate-900" aria-label="Increase">
                        <Plus width={14} height={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatPKR(Number(p.price) * item.quantity)}</p>
                      <p className="text-xs text-slate-400">{formatPKR(p.price)} each</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-bold text-slate-900">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-900">{formatPKR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Shipping</span>
                <span className="font-semibold text-slate-900">{shipping === 0 ? 'Free' : formatPKR(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-emerald-600">Add {formatPKR(5000 - cartSubtotal)} more for free shipping</p>
              )}
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="text-base font-bold text-slate-900">Total</span>
                <span className="text-base font-extrabold text-slate-900">{formatPKR(total)}</span>
              </div>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-accent mt-5 w-full !py-3">
              Proceed to Checkout <ArrowRight width={18} height={18} />
            </button>
            <Link to="/catalog" className="btn-ghost mt-3 w-full">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
