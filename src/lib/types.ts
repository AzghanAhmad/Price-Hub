export type Role = 'admin' | 'customer';

export interface Profile {
  user_id: string;
  full_name: string;
  role: Role;
  phone: string;
  address: string;
  city: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string | null;
  brand_id: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  images: string[];
  specs: Record<string, string>;
  featured: boolean;
  active: boolean;
  campaign: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  // joined
  category?: Category;
  brand?: Brand;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  // joined
  profile?: Profile;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Discount {
  id: string;
  code: string;
  description: string;
  type: 'percent' | 'amount';
  value: number;
  cap: number | null;
  min_order: number;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  invoice_no: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment_method: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  discount_code: string;
  created_at: string;
  // joined
  order_items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
}
