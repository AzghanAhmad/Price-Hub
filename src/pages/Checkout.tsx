import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle2, CreditCard, Truck, Wallet } from 'lucide-react';
import { useStore } from '../lib/store';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { fetchDiscountByCode, placeOrder } from '../lib/data';
import { formatPKR } from '../lib/format';
import type { Discount } from '../lib/types';
import SafeImage from '../components/SafeImage';

const PAYMENTS = [
  { key: 'cod', label: 'Cash on Delivery', icon: Truck, desc: 'Pay when you receive' },
  { key: 'jazzcash', label: 'JazzCash', icon: Wallet, desc: 'Mobile wallet transfer' },
  { key: 'easypaisa', label: 'EasyPaisa', icon: Wallet, desc: 'Mobile wallet transfer' },
  { key: 'hbl', label: 'HBL Card', icon: CreditCard, desc: 'Debit / Credit card' },
  { key: 'mcb', label: 'MCB Card', icon: CreditCard, desc: 'Debit / Credit card' },
];

export default function Checkout() {
  const { cart, cartSubtotal, refreshCart } = useStore();
  const { session, profile } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [city, setCity] = useState(profile?.city || '');
  const [payment, setPayment] = useState('cod');
  const [promo, setPromo] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [applying, setApplying] = useState(false);
  const [placing, setPlacing] = useState(false);

  if (!session?.user) return <Navigate to="/login" replace />;
  if (cart.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const shipping = cartSubtotal > 5000 ? 0 : 250;
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percent'
      ? Math.min(
          (cartSubtotal * Number(appliedDiscount.value)) / 100,
          appliedDiscount.cap ? Number(appliedDiscount.cap) : Infinity
        )
      : Number(appliedDiscount.value)
    : 0;
  const total = Math.max(0, cartSubtotal - discountAmount + shipping);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setApplying(true);
    try {
      const d = await fetchDiscountByCode(promo);
      if (!d) {
        push('Invalid or expired code', 'error');
        setAppliedDiscount(null);
      } else if (cartSubtotal < Number(d.min_order)) {
        push(`Minimum order ${formatPKR(d.min_order)} required`, 'error');
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(d);
        push(`Code ${d.code} applied`);
      }
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setApplying(false);
    }
  };

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!/^[0-9+\-\s]{10,15}$/.test(phone.trim())) return 'Enter a valid phone number';
    if (!address.trim()) return 'Address is required';
    if (!city.trim()) return 'City is required';
    return null;
  };

  const handlePlace = async () => {
    const err = validate();
    if (err) {
      push(err, 'error');
      return;
    }
    setPlacing(true);
    try {
      const items = cart
        .filter((c) => c.product)
        .map((c) => ({ product: c.product!, quantity: c.quantity }));
      const order = await placeOrder(session!.user.id, {
        items,
        shipping_name: name,
        shipping_phone: phone,
        shipping_address: address,
        shipping_city: city,
        payment_method: payment,
        discountCode: appliedDiscount?.code,
        discountAmount,
        shipping,
      });
      await refreshCart();
      push('Order placed successfully');
      navigate(`/order/${order.id}`);
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to place order', 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* shipping */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Shipping Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1.5" placeholder="John Doe" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field mt-1.5" placeholder="0300-1234567" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} className="input-field mt-1.5" placeholder="Karachi" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Address</label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="input-field mt-1.5 resize-none" placeholder="House #, Street, Area" />
              </div>
            </div>
          </div>

          {/* payment */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Payment Method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {PAYMENTS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPayment(p.key)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${payment === p.key ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className={`grid h-10 w-10 place-items-center rounded-lg ${payment === p.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <p.icon width={18} height={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.label}</p>
                    <p className="text-xs text-slate-500">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-700">
              This is a demo checkout. No real payment is processed.
            </p>
          </div>
        </div>

        {/* summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-bold text-slate-900">Your Order</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <SafeImage src={item.product?.images[0] || ''} alt={item.product?.name || ''} className="h-12 w-12 rounded-lg object-cover bg-slate-100" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-700">{item.product?.name}</p>
                    <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formatPKR(Number(item.product?.price || 0) * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* promo */}
            <div className="mt-4 border-t border-slate-200 pt-4">
              <label className="text-xs font-semibold text-slate-600">Promo Code</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  className="input-field !py-2"
                  placeholder="WELCOME10"
                />
                <button onClick={applyPromo} disabled={applying} className="btn-ghost !px-3 !py-2 text-xs">Apply</button>
              </div>
              {appliedDiscount && (
                <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 width={14} height={14} /> {appliedDiscount.code} applied
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{formatPKR(cartSubtotal)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatPKR(discountAmount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-semibold">{shipping === 0 ? 'Free' : formatPKR(shipping)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-bold text-slate-900">Total</span><span className="text-lg font-extrabold text-slate-900">{formatPKR(total)}</span></div>
            </div>

            <button onClick={handlePlace} disabled={placing} className="btn-accent mt-5 w-full !py-3">
              {placing ? 'Placing Order…' : 'Place Order'}
            </button>
            <Link to="/cart" className="btn-ghost mt-3 w-full">Back to Cart</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
