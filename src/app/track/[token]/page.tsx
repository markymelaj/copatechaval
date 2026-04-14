'use client';

import { useEffect, useState } from 'react';
import { MapPreview } from '@/components/MapPreview';
import { safeDate, statusLabel } from '@/lib/format';
import type { PublicTrackingResponse } from '@/types/app';
export const dynamic = 'force-dynamic';

export default function TrackingPage({ params }: { params: { token: string } }) {
  const [tracking, setTracking] = useState<PublicTrackingResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: number | undefined;

    async function load() {
      try {
        const res = await fetch(`/api/tracking/${params.token}`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'No se pudo cargar tracking');
        setTracking(json.tracking || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar tracking');
      }
    }

    load();
    interval = window.setInterval(load, 10000);
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [params.token]);

  if (error) return <main className="page center">{error}</main>;
  if (!tracking) return <main className="page center">Buscando tu pedido...</main>;

  return (
    <main className="page">
      <div className="narrow" style={{ padding: '24px 0 40px' }}>
        <section className="panel big stack gap16">
          <span className="badge success">Seguimiento en vivo</span>
          <h1 className="panelTitle">Pedido {tracking.order_code}</h1>
          <div className="row gap12 wrap">
            <span className="badge gray">Estado: {statusLabel(tracking.status)}</span>
            <span className="badge gray">Boti: {tracking.store_name}</span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="stack gap10">
              <div className="card stack gap6">
                <strong>Entrega</strong>
                <span>{tracking.address_line}</span>
                {tracking.address_ref ? <span className="muted">{tracking.address_ref}</span> : null}
              </div>
              <div className="card stack gap6">
                <strong>Repartidor</strong>
                <span>{tracking.driver_name || 'Aún sin repartir asignado'}</span>
                {tracking.driver_phone ? <span className="muted">{tracking.driver_phone}</span> : null}
                <span className="muted small">Última ubicación: {safeDate(tracking.last_location_at)}</span>
              </div>
            </div>
            <MapPreview latitude={tracking.latitude} longitude={tracking.longitude} label="Repartidor" />
          </div>
        </section>
      </div>
    </main>
  );
}
