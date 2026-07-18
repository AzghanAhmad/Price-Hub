import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { fetchUserOrders } from '../lib/data';
import type { Order } from '../lib/types';
import { formatPKR } from '../lib/format';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  paid: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

export default function OrderHistory() {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    fetchUserOrders(session.user.id)
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [session?.user]);

  if (!session?.user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-extrabold text-slate-900 sm:text-3xl">My Orders</h1>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Package className="text-slate-300" width={48} height={48} />
          <p className="text-lg font-bold text-slate-700">No orders yet</p>
          <p className="text-sm text-slate-500">Your placed orders will appear here.</p>
          <Link to="/catalog" className="btn-primary mt-2">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/order/${o.id}`}
              className="card flex items-center gap-4 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <Package width={22} height={22} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">{o.invoice_no}</p>
                  <span className={`chip ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {new Date(o.created_at).toLocaleDateString('en-PK', { dateStyle: 'medium' })} · {o.order_items?.length || 0} item(s)
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{formatPKR(o.total)}</p>
                <ChevronRight className="ml-auto text-slate-400" width={18} height={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
