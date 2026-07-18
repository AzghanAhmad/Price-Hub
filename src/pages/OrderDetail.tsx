import { useEffect, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Printer, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchOrderById } from '../lib/data';
import type { Order } from '../lib/types';
import { formatPKR } from '../lib/format';
import SafeImage from '../components/SafeImage';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !session?.user) return;
    fetchOrderById(id, session.user.id)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id, session?.user]);

  if (!session?.user) return <Navigate to="/login" replace />;

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-20 text-center text-slate-500">Loading order…</div>;
  if (!order) return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-2xl font-bold text-slate-800">Order not found</p>
      <Link to="/orders" className="btn-primary mt-4">Back to Orders</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* success banner */}
      <div className="card mb-6 flex items-center gap-4 border-emerald-200 bg-emerald-50/50 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
          <CheckCircle2 width={24} height={24} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Order Confirmed!</h1>
          <p className="text-sm text-slate-600">Thank you. Your order {order.invoice_no} has been placed.</p>
        </div>
      </div>

      {/* invoice */}
      <div className="card overflow-hidden" id="invoice">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white font-extrabold">P</div>
              <span className="text-xl font-extrabold">PriceHub</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">pricehub.pk · support@pricehub.pk</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900">Invoice {order.invoice_no}</p>
            <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('en-PK')}</p>
            <span className={`chip mt-1 ${STATUS_COLORS[order.status]}`}>{order.status}</span>
          </div>
        </div>

        <div className="grid gap-6 border-b border-slate-200 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Billed To</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{order.shipping_name}</p>
            <p className="text-sm text-slate-600">{order.shipping_phone}</p>
            <p className="text-sm text-slate-600">{order.shipping_address}</p>
            <p className="text-sm text-slate-600">{order.shipping_city}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Payment</p>
            <p className="mt-1 text-sm font-semibold uppercase text-slate-800">{order.payment_method}</p>
            {order.discount_code && <p className="text-xs text-emerald-600">Discount: {order.discount_code}</p>}
          </div>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
                <th className="pb-2">Item</th>
                <th className="pb-2 text-center">Qty</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(order.order_items || []).map((it) => (
                <tr key={it.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      {it.image && <SafeImage src={it.image} alt={it.name} className="h-10 w-10 rounded-lg object-cover bg-slate-100" />}
                      <span className="font-medium text-slate-800">{it.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center text-slate-600">{it.quantity}</td>
                  <td className="py-3 text-right text-slate-600">{formatPKR(it.price)}</td>
                  <td className="py-3 text-right font-semibold text-slate-800">{formatPKR(Number(it.price) * it.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-semibold">{formatPKR(order.subtotal)}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatPKR(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-semibold">{order.shipping === 0 ? 'Free' : formatPKR(order.shipping)}</span></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base"><span className="font-bold">Total</span><span className="font-extrabold">{formatPKR(order.total)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => window.print()} className="btn-primary"><Printer width={18} height={18} /> Print Invoice</button>
        <Link to="/orders" className="btn-ghost"><ArrowLeft width={18} height={18} /> All Orders</Link>
        <Link to="/catalog" className="btn-ghost">Continue Shopping</Link>
      </div>
    </div>
  );
}
