'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CartButton } from '@/components/CartButton';
import { categoryLabel, clp } from '@/lib/format';
import { useCart } from '@/stores/cart';
import type { Product, Store } from '@/types/app';
export const dynamic = 'force-dynamic';

export default function StorefrontPage({ params }: { params: { slug: string } }) {
  const [store, setStore] = useState<Store | null>(null);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    fetch(`/api/store/${params.slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) setStore(json.store);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [params.slug]);

  const categories = useMemo(() => {
    const set = new Set((store?.products || []).map((item) => item.category));
    return ['all', ...Array.from(set)];
  }, [store?.products]);

  const products = useMemo(() => {
    const base = store?.products || [];
    return base.filter((product) => {
      const hitCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const q = query.trim().toLowerCase();
      const hitQuery = !q || product.name.toLowerCase().includes(q) || (product.description || '').toLowerCase().includes(q);
      return hitCategory && hitQuery;
    });
  }, [store?.products, selectedCategory, query]);

  if (loading) return <main className="page center">Cargando tienda...</main>;
  if (!store) return <main className="page center">No encontramos esta boti.</main>;

  return (
    <main className="page">
      <div className="container" style={{ padding: '24px 0 110px' }}>
        <section className="storeHero">
          <div className="coverFrame">
            <img
              className="coverImage"
              src={store.cover_url || store.logo_url || 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=1200&q=80'}
              alt={store.name}
            />
          </div>
          <div className="panel big stack gap16">
            <span className="badge success">{store.is_approved ? 'Lista para vender' : 'Pendiente de activación'}</span>
            <h1 className="panelTitle">{store.name}</h1>
            <p className="sectionSubtitle">{store.description || 'Despacho rápido, link propio y operación ordenada.'}</p>
            <div className="stack gap8 muted">
              <div>{store.address}</div>
              <div>{store.comuna}</div>
              <div>{store.phone || store.whatsapp || 'Sin teléfono cargado todavía'}</div>
            </div>
            <div className="row gap8 wrap">
              {(store.store_zones || []).map((zone) => (
                <span key={zone.id} className="badge gray">
                  {zone.name}: {clp(zone.delivery_fee)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="stack gap16" style={{ marginTop: 22 }}>
          <div className="inputIconWrap">
            <Search size={18} />
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca productos, promos o marcas"
            />
          </div>
          <div className="categoryTabs">
            {categories.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'chip active' : 'chip'}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Todo' : categoryLabel(category)}
              </button>
            ))}
          </div>

          <div className="productGrid">
            {products.map((product: Product) => {
              const shownPrice = product.promo_price ?? product.price;
              return (
                <article key={product.id} className="card stack gap12 productCard">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1609951651556-5334e2706168?w=1200&q=80'}
                    alt={product.name}
                  />
                  <div className="stack gap6">
                    <strong>{product.name}</strong>
                    <span className="muted small">{categoryLabel(product.category)}</span>
                    <span className="muted">{product.description || 'Disponible para despacho.'}</span>
                  </div>
                  <div className="row justifyBetween alignCenter wrap gap8">
                    <div className="stack gap6">
                      {product.promo_price ? <span className="muted small"><s>{clp(product.price)}</s></span> : null}
                      <strong>{clp(shownPrice)}</strong>
                    </div>
                    <button className="btn" onClick={() => addItem(store.slug, product)}>
                      Agregar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
      <CartButton slug={store.slug} />
    </main>
  );
}
