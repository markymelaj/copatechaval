'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/stores/cart';
import { clp } from '@/lib/format';

export function CartButton({ slug }: { slug: string }) {
  const totalItems = useCart((s) => s.totalItems());
  const subtotal = useCart((s) => s.subtotal());

  if (!totalItems) return null;

  return (
    <Link className="cartButton" href={`/b/${slug}/checkout`}>
      <span className="cartButtonLeft">
        <ShoppingCart size={18} />
        {totalItems} producto{totalItems !== 1 ? 's' : ''}
      </span>
      <strong>{clp(subtotal)}</strong>
    </Link>
  );
}
