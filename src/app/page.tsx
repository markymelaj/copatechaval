'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { clp } from '@/lib/format';
export const dynamic = 'force-dynamic';

type StoreCard = {
  id: string;
  name: string;
  slug: string;
  comuna: string;
  logo_url: string | null;
  description: string | null;
  is_open: boolean;
  delivery_fee_min: number;
  zones_count: number;
};

const comunasBase = [
  'Concepción',
  'San Pedro de la Paz',
  'Talcahuano',
  'Chiguayante',
  'Hualpén',
  'Providencia',
  'Ñuñoa',
  'Santiago',
  'La Florida',
  'Maipú',
];

export default function HomePage() {
  const [comuna, setComuna] = useState('');
  const [stores, setStores] = useState<StoreCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function search() {
    if (!comuna.trim()) {
      setMessage('Selecciona o escribe una comuna para ver botis disponibles.');
      setStores([]);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/marketplace?comuna=${encodeURIComponent(comuna)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el marketplace');
      setStores(json.stores || []);
      if (!json.stores?.length) {
        setMessage('No hay botis activas para esa comuna todavía.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  const featured = useMemo(() => stores.slice(0, 6), [stores]);

  return (
    <main className="page">
      <section className="hero container stack gap20">
        <span className="storeBadge">Marketplace + link propio + logística simple</span>
        <h1>Pide en botis cercanas y opera con orden real.</h1>
        <p>
          copete.app junta lo que hoy está partido entre WhatsApp, llamadas y desorden. Cada boti tiene su link,
          sus zonas, sus repartidores y su operación. El cliente pide rápido. La boti respira mejor.
        </p>
      </section>

      <section className="container stack gap16">
        <div className="panel big stack gap16">
          <div>
            <h2 className="panelTitle">Marketplace por comuna</h2>
            <p className="sectionSubtitle">Busca botis abiertas o próximas a abrir según tu zona.</p>
          </div>
          <div className="marketControls">
            <input
              className="input"
              placeholder="Ej: Concepción, San Pedro de la Paz, Ñuñoa"
              list="comunas"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
            />
            <button className="btn" onClick={search} disabled={loading}>
              {loading ? 'Buscando...' : 'Ver botis'}
            </button>
          </div>
          <datalist id="comunas">
            {comunasBase.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          {message ? <div className="muted">{message}</div> : null}
        </div>

        <div className="storeGrid">
          {featured.map((store) => (
            <Link key={store.id} href={`/b/${store.slug}`} className="card stack gap12 storeCard">
              <img src={store.logo_url || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80'} alt={store.name} />
              <div className="row justifyBetween alignCenter gap12 wrap">
                <strong>{store.name}</strong>
                <span className={store.is_open ? 'badge success' : 'badge gray'}>
                  {store.is_open ? 'Abierta' : 'Fuera de horario'}
                </span>
              </div>
              <div className="muted small">{store.comuna}</div>
              <div className="muted">{store.description || 'Link propio, catálogo ordenado y despacho.'}</div>
              <div className="row justifyBetween alignCenter">
                <span className="small muted">Desde {clp(store.delivery_fee_min)}</span>
                <span className="small muted">{store.zones_count} zonas</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="footerSpace" />
      </section>
    </main>
  );
}
