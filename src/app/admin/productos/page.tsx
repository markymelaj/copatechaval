'use client';

import { FormEvent, useEffect, useState } from 'react';
import { categoryLabel, clp } from '@/lib/format';
import { getCurrentUserContext } from '@/lib/client-session';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
import type { ProductCategory } from '@/types/app';
export const dynamic = 'force-dynamic';

const categories: ProductCategory[] = ['promos', 'cervezas', 'destilados', 'vinos', 'mixers', 'snacks', 'cigarros', 'otros'];

export default function AdminProductosPage() {
  const [storeId, setStoreId] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', price: 0, promo_price: '', category: 'otros' as ProductCategory, image_url: '', stock_status: 'disponible',
  });

  async function load() {
    try {
      const context = await getCurrentUserContext();
      if (!context.primaryStore) throw new Error('No tienes tienda asignada.');
      setStoreId(context.primaryStore.id);
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.from('products').select('*').eq('store_id', context.primaryStore.id).order('sort_order', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar productos');
    }
  }

  useEffect(() => { load(); }, []);

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('products').insert({
      store_id: storeId,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      promo_price: form.promo_price ? Number(form.promo_price) : null,
      category: form.category,
      image_url: form.image_url || null,
      stock_status: form.stock_status,
      is_available: true,
      sort_order: products.length + 1,
    });
    if (error) return setError(error.message);
    setForm({ name: '', description: '', price: 0, promo_price: '', category: 'otros', image_url: '', stock_status: 'disponible' });
    load();
  }

  async function toggleAvailability(product: any) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    if (error) return setError(error.message);
    load();
  }

  return (
    <div className="stack gap20">
      <section>
        <h1 className="sectionTitle">Productos</h1>
        <p className="sectionSubtitle">Catálogo simple, rápido y listo para operar. Sin inventario complejo en esta primera fase.</p>
      </section>
      {error ? <div className="errorText">{error}</div> : null}
      <section className="panel big stack gap16">
        <h2 className="panelTitle">Nuevo producto</h2>
        <form className="grid gap12" onSubmit={saveProduct}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input className="input" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <select className="select" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as ProductCategory }))}>
              {categories.map((item) => <option key={item} value={item}>{categoryLabel(item)}</option>)}
            </select>
          </div>
          <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <input className="input" type="number" min="0" placeholder="Precio" value={form.price || ''} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
            <input className="input" type="number" min="0" placeholder="Promo (opcional)" value={form.promo_price} onChange={(e) => setForm((p) => ({ ...p, promo_price: e.target.value }))} />
            <select className="select" value={form.stock_status} onChange={(e) => setForm((p) => ({ ...p, stock_status: e.target.value }))}>
              <option value="disponible">Disponible</option>
              <option value="poco_stock">Poco stock</option>
              <option value="agotado">Agotado</option>
            </select>
            <input className="input" placeholder="URL imagen" value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} />
          </div>
          <button className="btn" type="submit">Guardar producto</button>
        </form>
      </section>
      <section className="panel big stack gap12">
        <h2 className="panelTitle">Catálogo actual</h2>
        <div className="productGrid">
          {products.map((product) => (
            <article key={product.id} className="card stack gap12">
              <img src={product.image_url || 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=1200&q=80'} alt={product.name} />
              <strong>{product.name}</strong>
              <div className="muted small">{categoryLabel(product.category)}</div>
              <div>{clp(product.promo_price || product.price)}</div>
              <div className="row gap8 wrap">
                <span className={product.is_available ? 'badge success' : 'badge gray'}>
                  {product.is_available ? 'Visible' : 'Oculto'}
                </span>
                <span className="badge gray">{product.stock_status}</span>
              </div>
              <button className="btn secondary" onClick={() => toggleAvailability(product)}>
                {product.is_available ? 'Ocultar' : 'Mostrar'}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
