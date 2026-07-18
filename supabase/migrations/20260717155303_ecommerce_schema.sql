/*
# E-commerce Platform Schema (PriceOye-style)

1. Overview
   Multi-user e-commerce site. Auth via Supabase (email/password). Two roles:
   `admin` and `customer`, stored in `profiles.role`. RLS enforces ownership for
   customers and grants admins broad access via a SECURITY DEFINER helper.

2. New Tables
   - profiles            — extends auth.users with full_name, role, phone, address
   - categories          — product categories with slug + parent (self-ref)
   - brands              — product brands
   - products            — catalog items with price, discount, stock, specs (jsonb), images (text[])
   - product_specs       — normalized key/value specs (optional, for filtering)
   - reviews             — product reviews + star rating (1-5) per user
   - cart_items          — per-user shopping cart rows
   - wishlist_items      — per-user wishlist rows
   - orders              — header: total, status, shipping address, payment method, invoice no
   - order_items         — per-order line items snapshotting product + price
   - discounts           — promo codes with percent/amount, cap, validity window

3. Security (RLS)
   - profiles: owner read/update; admin read all; self-insert via trigger.
   - categories, brands, products, product_specs: public read (anon+auth);
     write admin-only (checked via is_admin() helper).
   - reviews: public read; insert/update/delete own; admin delete any.
   - cart_items, wishlist_items: owner-only CRUD.
   - orders, order_items: owner read; insert own; admin read/update.
   - discounts: public read; admin write.

4. Important notes
   - Ordering: profiles table is created first (no policies), then the is_admin()
     helper (whose body reads profiles), then profiles policies. This breaks the
     circular dependency between is_admin() and the profiles RLS policies.
   - profiles.user_id defaults to auth.uid(); a trigger auto-creates a profile on signup.
   - All tables enable RLS. Policies are dropped-then-created for idempotency.
*/

-- Step 1: profiles table (no policies yet)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'customer' check (role in ('admin','customer')),
  phone text default '',
  address text default '',
  city text default '',
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Step 2: is_admin() helper (body reads profiles, which now exists)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where profiles.user_id = auth.uid() and profiles.role = 'admin'
  );
$$;

-- Step 3: profiles policies (can now reference is_admin)
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (auth.uid() = user_id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  icon text default '',
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

drop policy if exists "categories_read" on public.categories;
create policy "categories_read" on public.categories
  for select to anon, authenticated using (true);
drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- brands ----------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;

drop policy if exists "brands_read" on public.brands;
create policy "brands_read" on public.brands
  for select to anon, authenticated using (true);
drop policy if exists "brands_admin_write" on public.brands;
create policy "brands_admin_write" on public.brands
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- products ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  specs jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  active boolean not null default true,
  rating_avg numeric(3,2) default 0,
  rating_count integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_active_idx on public.products(active);
create index if not exists products_featured_idx on public.products(featured);
alter table public.products enable row level security;

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select to anon, authenticated using (true);
drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- product_specs ----------
create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  key text not null,
  value text not null
);
create index if not exists product_specs_product_idx on public.product_specs(product_id);
alter table public.product_specs enable row level security;

drop policy if exists "product_specs_read" on public.product_specs;
create policy "product_specs_read" on public.product_specs
  for select to anon, authenticated using (true);
drop policy if exists "product_specs_admin_write" on public.product_specs;
create policy "product_specs_admin_write" on public.product_specs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- reviews ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text default '',
  body text default '',
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);
create index if not exists reviews_product_idx on public.reviews(product_id);
alter table public.reviews enable row level security;

drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read" on public.reviews
  for select to anon, authenticated using (true);
drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete to authenticated using (auth.uid() = user_id or public.is_admin());

-- trigger: maintain product rating_avg / rating_count
create or replace function public.update_product_rating()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.products p
  set rating_avg = sub.avg, rating_count = sub.cnt
  from (
    select product_id, coalesce(avg(rating),0)::numeric(3,2) as avg, count(*)::integer as cnt
    from public.reviews
    where product_id = coalesce(new.product_id, old.product_id)
    group by product_id
  ) sub
  where p.id = sub.product_id;
  return null;
end;
$$;

drop trigger if exists reviews_rating_trigger on public.reviews;
create trigger reviews_rating_trigger
  after insert or update or delete on public.reviews
  for each row execute function public.update_product_rating();

-- ---------- cart_items ----------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists cart_items_user_idx on public.cart_items(user_id);
alter table public.cart_items enable row level security;

drop policy if exists "cart_select_own" on public.cart_items;
create policy "cart_select_own" on public.cart_items
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "cart_insert_own" on public.cart_items;
create policy "cart_insert_own" on public.cart_items
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "cart_update_own" on public.cart_items;
create policy "cart_update_own" on public.cart_items
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "cart_delete_own" on public.cart_items;
create policy "cart_delete_own" on public.cart_items
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- wishlist_items ----------
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
create index if not exists wishlist_items_user_idx on public.wishlist_items(user_id);
alter table public.wishlist_items enable row level security;

drop policy if exists "wishlist_select_own" on public.wishlist_items;
create policy "wishlist_select_own" on public.wishlist_items
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "wishlist_insert_own" on public.wishlist_items;
create policy "wishlist_insert_own" on public.wishlist_items
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "wishlist_delete_own" on public.wishlist_items;
create policy "wishlist_delete_own" on public.wishlist_items
  for delete to authenticated using (auth.uid() = user_id);

-- ---------- discounts ----------
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text default '',
  type text not null check (type in ('percent','amount')),
  value numeric(12,2) not null check (value >= 0),
  cap numeric(12,2),
  min_order numeric(12,2) default 0,
  active boolean not null default true,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now()
);
alter table public.discounts enable row level security;

drop policy if exists "discounts_read" on public.discounts;
create policy "discounts_read" on public.discounts
  for select to anon, authenticated using (true);
drop policy if exists "discounts_admin_write" on public.discounts;
create policy "discounts_admin_write" on public.discounts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  invoice_no text not null unique,
  status text not null default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  shipping numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'cod',
  shipping_name text default '',
  shipping_phone text default '',
  shipping_address text default '',
  shipping_city text default '',
  discount_code text default '',
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);
alter table public.orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select to authenticated using (auth.uid() = user_id or public.is_admin());
drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own" on public.orders
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  slug text default '',
  image text default '',
  price numeric(12,2) not null,
  quantity integer not null check (quantity > 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.order_items enable row level security;

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));
drop policy if exists "order_items_insert_own" on public.order_items;
create policy "order_items_insert_own" on public.order_items
  for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();
