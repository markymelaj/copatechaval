'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExternalLink, MapPinned } from 'lucide-react';
import { MapPreview } from '@/components/MapPreview';
import { clp, statusLabel } from '@/lib/format';
export const dynamic = 'force-dynamic';

type DriverOrder = {
  order_id: string;
  order_code: string;
  tracking_token: string;
  status: string;
  store_id: string;
  store_name: string;
  customer_name: string;
  customer_phone: string;
  address_line: string;
  address_ref: string | null;
  comuna: string;
  formatted_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  payment_method: string;
  total: number;
  notes: string | null;
};

export default function DriverPage() {
  const params = useSearchParams();
  const accessToken = params.get('t') || params.get('accessToken') || '';
  const [orders, setOrders] = useState<DriverOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  async function loadOrders() {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/driver/orders?accessToken=${encodeURIComponent(accessToken)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudieron cargar tus pedidos');
      setOrders(json.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    const interval = window.setInterval(loadOrders, 12000);
    return () => window.clearInterval(interval);
  }, [accessToken]);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  async function startRoute(orderId: string) {
    try {
      setError('');
      const res = await fetch('/api/driver/en-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo marcar en ruta');

      setCurrentOrderId(orderId);
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            await fetch('/api/driver/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken,
                orderId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                heading: position.coords.heading,
                speed: position.coords.speed,
              }),
            });
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        );
      }
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar ruta');
    }
  }

  async function markDelivered(orderId: string, paymentMethod: string, total: number) {
    try {
      let cashAmount: number | null = null;
      if (paymentMethod === 'efectivo') {
        const entered = window.prompt('Monto cobrado en efectivo', String(total));
        if (!entered) return;
        cashAmount = Number(entered);
      }

      const res = await fetch('/api/driver/delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, orderId, cashAmount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo marcar entregado');

      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      setCurrentOrderId(null);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la entrega');
    }
  }

  const activeOrder = useMemo(() => orders.find((order) => order.status === 'en_ruta') || orders[0], [orders]);

  function openNavigation(order: DriverOrder) {
    const target = order.delivery_latitude != null && order.delivery_longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_latitude},${order.delivery_longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.formatted_address || order.address_line)}`;
    window.open(target, '_blank');
  }

  if (!accessToken) return <main className="page center">Falta el token del repartidor en la URL.</main>;

  return (
    <main className="page">
      <div className="narrow" style={{ padding: '24px 0 40px' }}>
        <section className="panel big stack gap16">
          <div className="row justifyBetween alignCenter wrap gap12">
            <div>
              <h1 className="panelTitle">Panel del repartidor</h1>
              <p className="sectionSubtitle">Aquí ves tu pedido activo, el mapa, la navegación y el cierre de entrega.</p>
            </div>
            <button className="btn secondary" onClick={loadOrders} disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>

          {error ? <div className="errorText">{error}</div> : null}

          {!orders.length ? <div className="muted">No tienes pedidos activos ahora mismo.</div> : null}

          {activeOrder ? (
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="stack gap12">
                <div className="card stack gap8">
                  <strong>Pedido {activeOrder.order_code}</strong>
                  <span className="muted">{activeOrder.store_name}</span>
                  <span className="badge gray">Estado: {statusLabel(activeOrder.status)}</span>
                  <span>{activeOrder.customer_name}</span>
                  <span className="muted">{activeOrder.customer_phone}</span>
                  <span>{activeOrder.formatted_address || activeOrder.address_line}</span>
                  {activeOrder.address_ref ? <span className="muted">{activeOrder.address_ref}</span> : null}
                  {activeOrder.notes ? <span className="muted">{activeOrder.notes}</span> : null}
                  <div className="row justifyBetween alignCenter">
                    <span>{activeOrder.payment_method}</span>
                    <strong>{clp(activeOrder.total)}</strong>
                  </div>
                </div>

                <div className="row gap8 wrap">
                  <button className="btn" onClick={() => startRoute(activeOrder.order_id)}>
                    <MapPinned size={16} />
                    Marcar en ruta
                  </button>
                  <button className="btn secondary" onClick={() => openNavigation(activeOrder)}>
                    <ExternalLink size={16} />
                    Abrir navegación
                  </button>
                  <button className="btn secondary" onClick={() => markDelivered(activeOrder.order_id, activeOrder.payment_method, activeOrder.total)}>
                    Marcar entregado
                  </button>
                </div>

                {currentOrderId === activeOrder.order_id ? (
                  <div className="badge success">Compartiendo ubicación en vivo.</div>
                ) : null}
              </div>

              <MapPreview
                latitude={activeOrder.delivery_latitude}
                longitude={activeOrder.delivery_longitude}
                label={activeOrder.customer_name}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
