import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { CartItem, WishlistItem, Product } from './types';

interface StoreState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  cartCount: number;
  cartSubtotal: number;
  loadingStore: boolean;
  addToCart: (product: Product, qty?: number) => Promise<void>;
  updateCartQty: (itemId: string, qty: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  refreshCart: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const Ctx = createContext<StoreState | null>(null);

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingStore, setLoadingStore] = useState(true);

  const loadCart = useCallback(async () => {
    if (!session?.user) {
      setCart([]);
      return;
    }
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('user_id', session.user.id);
    setCart((data as CartItem[]) ?? []);
  }, [session?.user]);

  const loadWishlist = useCallback(async () => {
    if (!session?.user) {
      setWishlist([]);
      return;
    }
    const { data } = await supabase
      .from('wishlist_items')
      .select('*, product:products(*)')
      .eq('user_id', session.user.id);
    setWishlist((data as WishlistItem[]) ?? []);
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) {
      setCart([]);
      setWishlist([]);
      setLoadingStore(false);
      return;
    }
    setLoadingStore(true);
    Promise.all([loadCart(), loadWishlist()]).finally(() => setLoadingStore(false));
  }, [session?.user, loadCart, loadWishlist]);

  const addToCart = async (product: Product, qty = 1) => {
    if (!session?.user) throw new Error('Please sign in to add items to cart');
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      await updateCartQty(existing.id, existing.quantity + qty);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ user_id: session.user.id, product_id: product.id, quantity: qty });
      if (error) throw error;
      await loadCart();
    }
  };

  const updateCartQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    const { error } = await supabase.from('cart_items').update({ quantity: qty }).eq('id', itemId);
    if (error) throw error;
    await loadCart();
  };

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
    await loadCart();
  };

  const toggleWishlist = async (product: Product) => {
    if (!session?.user) throw new Error('Please sign in to use wishlist');
    const existing = wishlist.find((w) => w.product_id === product.id);
    if (existing) {
      const { error } = await supabase.from('wishlist_items').delete().eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('wishlist_items')
        .insert({ user_id: session.user.id, product_id: product.id });
      if (error) throw error;
    }
    await loadWishlist();
  };

  const isWishlisted = (productId: string) => wishlist.some((w) => w.product_id === productId);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce(
    (s, i) => s + (i.product ? Number(i.product.price) * i.quantity : 0),
    0
  );

  return (
    <Ctx.Provider
      value={{
        cart,
        wishlist,
        cartCount,
        cartSubtotal,
        loadingStore,
        addToCart,
        updateCartQty,
        removeFromCart,
        toggleWishlist,
        isWishlisted,
        refreshCart: loadCart,
        refreshWishlist: loadWishlist,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
