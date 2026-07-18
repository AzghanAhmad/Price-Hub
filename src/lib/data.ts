import { supabase } from './supabase';
import type { Product, Category, Brand, Review, Discount, Order } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data as Category[];
}

export async function fetchBrands(): Promise<Brand[]> {
  const { data, error } = await supabase.from('brands').select('*').order('name');
  if (error) throw error;
  return data as Brand[];
}

export async function fetchProducts(opts?: {
  category?: string;
  brand?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  campaign?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'discount';
  limit?: number;
}): Promise<Product[]> {
  let q = supabase.from('products').select('*, category:categories(*), brand:brands(*)').eq('active', true);
  if (opts?.category) q = q.eq('category_id', opts.category);
  if (opts?.brand) q = q.eq('brand_id', opts.brand);
  if (opts?.featured) q = q.eq('featured', true);
  if (opts?.campaign) q = q.eq('campaign', opts.campaign);
  if (typeof opts?.minPrice === 'number') q = q.gte('price', opts.minPrice);
  if (typeof opts?.maxPrice === 'number') q = q.lte('price', opts.maxPrice);
  if (opts?.search) q = q.ilike('name', `%${opts.search}%`);
  switch (opts?.sort) {
    case 'price_asc':
      q = q.order('price', { ascending: true });
      break;
    case 'price_desc':
      q = q.order('price', { ascending: false });
      break;
    case 'rating':
      q = q.order('rating_avg', { ascending: false });
      break;
    case 'discount':
      q = q.order('compare_at_price', { ascending: false, nullsFirst: false });
      break;
    default:
      q = q.order('created_at', { ascending: false });
  }
  if (opts?.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return data as Product[];
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(*), brand:brands(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profile:profiles!reviews_user_id_fkey(*)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Review[];
}

export async function addReview(
  productId: string,
  userId: string,
  rating: number,
  title: string,
  body: string
): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .insert({ product_id: productId, user_id: userId, rating, title, body });
  if (error) throw error;
}

export async function fetchDiscountByCode(code: string): Promise<Discount | null> {
  const { data, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data as Discount | null;
}

export async function fetchAllDiscounts(): Promise<Discount[]> {
  const { data, error } = await supabase.from('discounts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Discount[];
}

export async function fetchUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function fetchOrderById(orderId: string, userId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export async function placeOrder(
  userId: string,
  payload: {
    items: { product: Product; quantity: number }[];
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    payment_method: string;
    discountCode?: string;
    discountAmount: number;
    shipping: number;
  }
): Promise<Order> {
  const subtotal = payload.items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
  const total = Math.max(0, subtotal - payload.discountAmount + payload.shipping);
  const invoice_no = 'INV-' + Date.now().toString(36).toUpperCase().slice(-8);

  const { data: order, error: oe } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      invoice_no,
      status: payload.payment_method === 'cod' ? 'pending' : 'paid',
      subtotal,
      discount: payload.discountAmount,
      shipping: payload.shipping,
      total,
      payment_method: payload.payment_method,
      shipping_name: payload.shipping_name,
      shipping_phone: payload.shipping_phone,
      shipping_address: payload.shipping_address,
      shipping_city: payload.shipping_city,
      discount_code: payload.discountCode || '',
    })
    .select()
    .single();
  if (oe) throw oe;

  const orderItems = payload.items.map((i) => ({
    order_id: (order as Order).id,
    product_id: i.product.id,
    name: i.product.name,
    slug: i.product.slug,
    image: i.product.images[0] || '',
    price: Number(i.product.price),
    quantity: i.quantity,
  }));
  const { error: ie } = await supabase.from('order_items').insert(orderItems);
  if (ie) throw ie;

  // clear cart
  await supabase.from('cart_items').delete().eq('user_id', userId);

  return order as Order;
}

export async function searchSuggestions(query: string): Promise<Product[]> {
  if (!query.trim()) return [];
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, images')
    .eq('active', true)
    .ilike('name', `%${query.trim()}%`)
    .limit(6);
  if (error) throw error;
  return data as Product[];
}

// ---------- Admin ----------
export async function adminFetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), profile:profiles(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function adminUpdateOrderStatus(orderId: string, status: string): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
}

export async function adminUpsertProduct(p: Partial<Product>): Promise<Product | null> {
  if (p.id) {
    const { data, error } = await supabase.from('products').update(p).eq('id', p.id).select().maybeSingle();
    if (error) throw error;
    return data as Product | null;
  }
  const { data, error } = await supabase.from('products').insert(p).select().maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function adminDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function adminUpsertDiscount(d: Partial<Discount>): Promise<Discount | null> {
  if (d.id) {
    const { data, error } = await supabase.from('discounts').update(d).eq('id', d.id).select().maybeSingle();
    if (error) throw error;
    return data as Discount | null;
  }
  const { data, error } = await supabase.from('discounts').insert(d).select().maybeSingle();
  if (error) throw error;
  return data as Discount | null;
}

export async function adminDeleteDiscount(id: string): Promise<void> {
  const { error } = await supabase.from('discounts').delete().eq('id', id);
  if (error) throw error;
}
