import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Search } from 'lucide-react';
import type { Brand, Category, Product } from '../lib/types';
import { fetchBrands, fetchCategories, fetchProducts } from '../lib/data';
import ProductCard from '../components/ProductCard';
import { classNames } from '../lib/format';

const SORTS = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Top Rated' },
  { key: 'discount', label: 'Biggest Discount' },
] as const;

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const q = params.get('q') || '';
  const categorySlug = params.get('category') || '';
  const dealsOnly = params.get('deals') === '1';
  const sort = (params.get('sort') as typeof SORTS[number]['key']) || 'newest';
  const selectedBrands = params.get('brand') ? params.get('brand')!.split(',') : [];
  const minP = params.get('min') ? Number(params.get('min')) : undefined;
  const maxP = params.get('max') ? Number(params.get('max')) : undefined;

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
    fetchBrands().then(setBrands).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const catId = categories.find((c) => c.slug === categorySlug)?.id;
    fetchProducts({
      category: catId,
      search: q,
      sort,
      minPrice: minP,
      maxPrice: maxP,
    })
      .then((data) => {
        let filtered = data;
        if (selectedBrands.length) {
          const brandIds = brands.filter((b) => selectedBrands.includes(b.slug)).map((b) => b.id);
          filtered = filtered.filter((p) => p.brand_id && brandIds.includes(p.brand_id));
        }
        if (dealsOnly) {
          filtered = filtered.filter(
            (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
          );
        }
        setProducts(filtered);
      })
      .finally(() => setLoading(false));
  }, [q, categorySlug, sort, dealsOnly, minP, maxP, selectedBrands.length, categories, brands]);

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null || value === '') next.delete(key);
    else next.set(key, value);
    setParams(next);
  }

  function toggleBrand(slug: string) {
    const set = new Set(selectedBrands);
    set.has(slug) ? set.delete(slug) : set.add(slug);
    update('brand', set.size ? [...set].join(',') : null);
  }

  function clearAll() {
    setParams(new URLSearchParams());
  }

  const activeCount = (categorySlug ? 1 : 0) + selectedBrands.length + (dealsOnly ? 1 : 0) + (minP ? 1 : 0) + (maxP ? 1 : 0);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Categories</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => update('category', null)}
            className={classNames(
              'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
              !categorySlug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => update('category', c.slug)}
              className={classNames(
                'block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                categorySlug === c.slug ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Brands</h3>
        <div className="flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleBrand(b.slug)}
              className={classNames(
                'chip border transition-colors',
                selectedBrands.includes(b.slug)
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Price Range (Rs.)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minP ?? ''}
            onChange={(e) => update('min', e.target.value || null)}
            className="input-field !py-2"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            placeholder="Max"
            value={maxP ?? ''}
            onChange={(e) => update('max', e.target.value || null)}
            className="input-field !py-2"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={dealsOnly}
            onChange={(e) => update('deals', e.target.checked ? '1' : null)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Deals only
        </label>
      </div>

      {activeCount > 0 && (
        <button onClick={clearAll} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <X width={14} height={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {selectedCategory ? selectedCategory.name : dealsOnly ? 'Today\u2019s Deals' : q ? `Results for "${q}"` : 'All Products'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading…' : `${products.length} products found`}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* desktop filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card sticky top-24 p-5">{FilterPanel}</div>
        </aside>

        <div className="flex-1">
          {/* toolbar */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="btn-ghost lg:hidden"
            >
              <SlidersHorizontal width={16} height={16} /> Filters {activeCount > 0 && `(${activeCount})`}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-slate-500 sm:block">Sort:</span>
              <select
                value={sort}
                onChange={(e) => update('sort', e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-slate-900"
              >
                {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="card flex flex-col items-center justify-center gap-3 py-20 text-center">
              <Search className="text-slate-300" width={48} height={48} />
              <p className="text-lg font-bold text-slate-700">No products found</p>
              <p className="text-sm text-slate-500">Try adjusting your filters or search term.</p>
              {activeCount > 0 && <button onClick={clearAll} className="btn-primary mt-2">Clear filters</button>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)}><X /></button>
            </div>
            {FilterPanel}
            <button onClick={() => setShowFilters(false)} className="btn-primary mt-6 w-full">Show {products.length} results</button>
          </div>
        </div>
      )}
    </div>
  );
}
