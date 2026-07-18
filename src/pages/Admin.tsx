import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Package, ShoppingBag, Tag, LayoutDashboard, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import {
  adminFetchOrders,
  adminUpdateOrderStatus,
  adminUpsertProduct,
  adminDeleteProduct,
  adminUpsertDiscount,
  adminDeleteDiscount,
  fetchProducts,
  fetchAllDiscounts,
  fetchCategories,
  fetchBrands,
} from '../lib/data';
import { supabase } from '../lib/supabase';
import type { Order, Product, Discount, Category, Brand, Profile } from '../lib/types';
import { formatPKR, slugify } from '../lib/format';
import SafeImage from '../components/SafeImage';

type Tab = 'overview' | 'products' | 'orders' | 'discounts';

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // product editor
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);

  // discount editor
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount> | null>(null);
  const [savingDiscount, setSavingDiscount] = useState(false);

  const loadAll = async () => {
    setDataLoading(true);
    const [p, o, d, c, b] = await Promise.all([
      fetchProducts({ limit: 100 }),
      adminFetchOrders(),
      fetchAllDiscounts(),
      fetchCategories(),
      fetchBrands(),
    ]);
    setProducts(p);
    setOrders(o);
    setDiscounts(d);
    setCategories(c);
    setBrands(b);
    // users: select profiles (admin can read all)
    const { data: u } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((u as Profile[]) || []);
    setDataLoading(false);
  };

  useEffect(() => {
    if (isAdmin) loadAll();
  }, [isAdmin]);

  if (loading) return <div className="px-4 py-20 text-center text-slate-500">Loading…</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'paid').length;

  const handleSaveProduct = async () => {
    if (!editing) return;
    if (!editing.name || !editing.slug) {
      push('Name and slug are required', 'error');
      return;
    }
    setSavingProduct(true);
    try {
      const payload: Partial<Product> = {
        ...editing,
        slug: editing.slug || slugify(editing.name || ''),
        images: Array.isArray(editing.images) ? editing.images : (editing.images ? String(editing.images).split(',').map((s) => s.trim()).filter(Boolean) : []),
        price: Number(editing.price) || 0,
        compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
        stock: Number(editing.stock) || 0,
        category_id: editing.category_id || null,
        brand_id: editing.brand_id || null,
        featured: !!editing.featured,
        active: editing.active !== false,
      };
      await adminUpsertProduct(payload);
      push(editing.id ? 'Product updated' : 'Product created');
      setEditing(null);
      loadAll();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await adminDeleteProduct(id);
      push('Product deleted');
      loadAll();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await adminUpdateOrderStatus(orderId, status);
      push('Order status updated');
      loadAll();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const handleSaveDiscount = async () => {
    if (!editingDiscount) return;
    if (!editingDiscount.code) {
      push('Code is required', 'error');
      return;
    }
    setSavingDiscount(true);
    try {
      await adminUpsertDiscount({
        ...editingDiscount,
        code: String(editingDiscount.code).toUpperCase(),
        type: editingDiscount.type || 'percent',
        value: Number(editingDiscount.value) || 0,
        cap: editingDiscount.cap ? Number(editingDiscount.cap) : null,
        min_order: Number(editingDiscount.min_order) || 0,
        active: editingDiscount.active !== false,
        valid_until: editingDiscount.valid_until || null,
      });
      push(editingDiscount.id ? 'Discount updated' : 'Discount created');
      setEditingDiscount(null);
      loadAll();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setSavingDiscount(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Delete this discount?')) return;
    try {
      await adminDeleteDiscount(id);
      push('Discount deleted');
      loadAll();
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed', 'error');
    }
  };

  const TABS: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'orders', label: 'Orders', icon: ShoppingBag },
    { key: 'discounts', label: 'Discounts', icon: Tag },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Manage products, orders, users, and discounts</p>
      </div>

      {/* tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors ${tab === t.key ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <t.icon width={16} height={16} /> {t.label}
          </button>
        ))}
      </div>

      {dataLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Revenue', value: formatPKR(totalRevenue), color: 'from-emerald-500 to-teal-500' },
                  { label: 'Orders', value: orders.length, color: 'from-sky-500 to-indigo-500' },
                  { label: 'Pending', value: pendingCount, color: 'from-amber-500 to-orange-500' },
                  { label: 'Products', value: products.length, color: 'from-slate-700 to-slate-900' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white shadow-lg`}>
                    <p className="text-sm font-medium text-white/80">{s.label}</p>
                    <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card p-5">
                  <h3 className="mb-4 font-bold text-slate-900">Recent Orders</h3>
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{o.invoice_no}</p>
                          <p className="text-xs text-slate-400">{new Date(o.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{formatPKR(o.total)}</span>
                      </div>
                    ))}
                    {orders.length === 0 && <p className="text-sm text-slate-400">No orders yet</p>}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="mb-4 font-bold text-slate-900">Recent Users</h3>
                  <div className="space-y-2">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.user_id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-500 text-sm font-bold text-white">
                          {(u.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{u.full_name || 'User'}</p>
                          <p className="text-xs text-slate-400 capitalize">{u.role}</p>
                        </div>
                      </div>
                    ))}
                    {users.length === 0 && <p className="text-sm text-slate-400">No users yet</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setEditing({ active: true, stock: 0, price: 0, images: [], specs: {} })} className="btn-primary">
                  <Plus width={16} height={16} /> Add Product
                </button>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <SafeImage src={p.images[0] || ''} alt={p.name} className="h-10 w-10 rounded-lg object-cover bg-slate-100" />
                            <span className="font-medium text-slate-800 line-clamp-1">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{p.category?.name || '—'}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{formatPKR(p.price)}</td>
                        <td className="px-4 py-3">
                          <span className={`chip ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {p.stock > 0 ? `${p.stock} in stock` : 'Out'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditing(p)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Edit">
                              <Pencil width={15} height={15} />
                            </button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Delete">
                              <Trash2 width={15} height={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-semibold text-slate-800">{o.invoice_no}</td>
                      <td className="px-4 py-3 text-slate-600">{o.shipping_name}<br /><span className="text-xs text-slate-400">{o.shipping_city}</span></td>
                      <td className="px-4 py-3 font-bold text-slate-900">{formatPKR(o.total)}</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold capitalize outline-none focus:border-slate-900"
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'discounts' && (
            <div>
              <div className="mb-4 flex justify-end">
                <button onClick={() => setEditingDiscount({ type: 'percent', value: 10, active: true, min_order: 0 })} className="btn-primary">
                  <Plus width={16} height={16} /> Add Discount
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {discounts.map((d) => (
                  <div key={d.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{d.code}</p>
                        <p className="text-xs text-slate-500">{d.description}</p>
                      </div>
                      <span className={`chip ${d.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{d.active ? 'Active' : 'Off'}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">
                      {d.type === 'percent' ? `${d.value}% off` : `${formatPKR(d.value)} off`}
                      {d.min_order > 0 && ` · min ${formatPKR(d.min_order)}`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditingDiscount(d)} className="btn-ghost !px-3 !py-1.5 text-xs flex-1"><Pencil width={13} height={13} /> Edit</button>
                      <button onClick={() => handleDeleteDiscount(d.id)} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50"><Trash2 width={14} height={14} /></button>
                    </div>
                  </div>
                ))}
                {discounts.length === 0 && <p className="text-sm text-slate-400">No discounts yet</p>}
              </div>
            </div>
          )}
        </>
      )}

      {/* product editor modal */}
      {editing && (
        <Modal title={editing.id ? 'Edit Product' : 'New Product'} onClose={() => setEditing(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Name</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.slug || slugify(e.target.value) })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Slug</label>
              <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Brand</label>
              <select value={editing.brand_id || ''} onChange={(e) => setEditing({ ...editing, brand_id: e.target.value || null })} className="input-field mt-1.5">
                <option value="">—</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Category</label>
              <select value={editing.category_id || ''} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })} className="input-field mt-1.5">
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Price (Rs.)</label>
              <input type="number" value={editing.price ?? ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Compare-at Price</label>
              <input type="number" value={editing.compare_at_price ?? ''} onChange={(e) => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Stock</label>
              <input type="number" value={editing.stock ?? ''} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} className="input-field mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Image URLs (comma separated)</label>
              <input value={Array.isArray(editing.images) ? editing.images.join(', ') : ''} onChange={(e) => setEditing({ ...editing, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} className="input-field mt-1.5" placeholder="https://images.pexels.com/…" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Description</label>
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="input-field mt-1.5 resize-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Specs (JSON)</label>
              <textarea
                value={JSON.stringify(editing.specs || {}, null, 0)}
                onChange={(e) => { try { setEditing({ ...editing, specs: JSON.parse(e.target.value) }); } catch { /* keep as-is while typing */ } }}
                rows={3}
                className="input-field mt-1.5 resize-none font-mono text-xs"
                placeholder='{"Display":"6.7 inch"}'
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
              Active
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSaveProduct} disabled={savingProduct} className="btn-accent flex-1">{savingProduct ? 'Saving…' : 'Save Product'}</button>
            <button onClick={() => setEditing(null)} className="btn-ghost">Cancel</button>
          </div>
        </Modal>
      )}

      {/* discount editor modal */}
      {editingDiscount && (
        <Modal title={editingDiscount.id ? 'Edit Discount' : 'New Discount'} onClose={() => setEditingDiscount(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Code</label>
              <input value={editingDiscount.code || ''} onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })} className="input-field mt-1.5 uppercase" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Description</label>
              <input value={editingDiscount.description || ''} onChange={(e) => setEditingDiscount({ ...editingDiscount, description: e.target.value })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Type</label>
              <select value={editingDiscount.type} onChange={(e) => setEditingDiscount({ ...editingDiscount, type: e.target.value as 'percent' | 'amount' })} className="input-field mt-1.5">
                <option value="percent">Percent</option>
                <option value="amount">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Value</label>
              <input type="number" value={editingDiscount.value ?? ''} onChange={(e) => setEditingDiscount({ ...editingDiscount, value: Number(e.target.value) })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Cap (max discount, optional)</label>
              <input type="number" value={editingDiscount.cap ?? ''} onChange={(e) => setEditingDiscount({ ...editingDiscount, cap: e.target.value ? Number(e.target.value) : null })} className="input-field mt-1.5" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Min Order (Rs.)</label>
              <input type="number" value={editingDiscount.min_order ?? ''} onChange={(e) => setEditingDiscount({ ...editingDiscount, min_order: Number(e.target.value) })} className="input-field mt-1.5" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={editingDiscount.active !== false} onChange={(e) => setEditingDiscount({ ...editingDiscount, active: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
              Active
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleSaveDiscount} disabled={savingDiscount} className="btn-accent flex-1">{savingDiscount ? 'Saving…' : 'Save Discount'}</button>
            <button onClick={() => setEditingDiscount(null)} className="btn-ghost">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
