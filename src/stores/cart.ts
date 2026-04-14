'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '@/types/app';

interface CartState {
  storeSlug: string | null;
  zoneId: string | null;
  items: CartItem[];
  setStoreSlug: (slug: string) => void;
  setZoneId: (zoneId: string | null) => void;
  addItem: (storeSlug: string, product: Product) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      storeSlug: null,
      zoneId: null,
      items: [],
      setStoreSlug: (slug) => set({ storeSlug: slug }),
      setZoneId: (zoneId) => set({ zoneId }),
      addItem: (storeSlug, product) => {
        const currentSlug = get().storeSlug;
        if (currentSlug && currentSlug !== storeSlug) {
          set({ items: [], zoneId: null, storeSlug });
        } else if (!currentSlug) {
          set({ storeSlug });
        }

        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },
      decrementItem: (productId) => {
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) }));
      },
      clearCart: () => set({ items: [], zoneId: null }),
      subtotal: () =>
        get().items.reduce((sum, item) => {
          const price = item.product.promo_price ?? item.product.price;
          return sum + price * item.quantity;
        }, 0),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'copete-cart-v1',
    },
  ),
);
