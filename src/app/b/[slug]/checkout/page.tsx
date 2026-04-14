'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AddressField } from '@/components/AddressField';
import { clp } from '@/lib/format';
import { useCart } from '@/stores/cart';
import type { AddressSelection, PaymentMethod, Store, StoreZone } from '@/types/app';
export const dynamic = 'force-dynamic';

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const cart = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [notes, setNotes] = useState('');
  const [address, setAddress] = useState<AddressSelection>({
    addressLine: '',
    comuna: '',
    addressRef: '',
    formattedAddress: '',
    placeId: '',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    fetch(`/api/store/${params.slug}`)
      .then((res) => res.json())
      .then((json) => setStore(json.store || null));
  }, [params.slug]);

  useEffect(() => {
    if (cart.storeSlug && cart.storeSlug !== params.slug) {
      cart.clearCart();
    }
  }, [cart, params.slug]);

  const activeZone = useMemo<StoreZone | null>(() => {
    return (store?.store_zones || []).find((zone) => zone.id === cart.zoneId) || null;
  }, [store?.store_zones, cart.zoneId]);

  const subtotal = cart.subtotal();
  const total = subtotal + (activeZone?.delivery_fee || 0);

  async function submitOrder() {
    if (!store) return;
    if (!cart.items.length) return setError('Tu carrito está vacío.');
    if (!cart.zoneId) return setError('Selecciona una zona de reparto.');
    if (!customerName || !customerPhone || !address.addressLine || !address.comuna) {
      return setError('Completa nombre, teléfono y dirección.');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_slug: params.slug,
          zone_id: cart.zoneId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || null,
          address_line: address.addressLine,
          address_ref: address.addressRef || null,
          comuna: address.comuna,
          formatted_address: address.formattedAddress || null,
          place_id: address.placeId || null,
          latitude: address.latitude,
          longitude: address.longitude,
          payment_method: paymentMethod,
          notes,
          items: cart.items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'No se pudo crear el pedido');
      cart.clearCart();
      setSuccess(`Pedido ${json.order.order_code} creado.`);
      router.push(`/track/${json.order.tracking_token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido');
    } finally {
      setLoading(false);
    }
  }

  if (!store) return <main className="page center">Cargando checkout...</main>;

  return (
    <main className="page">
      <div className="container" style={{ padding: '24px 0 40px' }}>
        <div className="checkoutGrid">
          <section className="panel big stack gap16">
            <div className="row justifyBetween alignCenter wrap gap12">
              <div>
                <h1 className="panelTitle">Checkout · {store.name}</h1>
                <p className="sectionSubtitle">Dirección precisa, zona definida y reparto claro desde el primer pedido.</p>
              </div>
              <Link href={`/b/${store.slug}`} className="btn secondary">
                Volver a la tienda
              </Link>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="stack gap6">
                <label className="label">Nombre</label>
                <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">Teléfono</label>
                <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>
            </div>

            <div className="stack gap6">
              <label className="label">Correo (opcional)</label>
              <input className="input" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
            </div>

            <AddressField value={address} onChange={setAddress} />

            <div className="stack gap6">
              <label className="label">Zona de reparto</label>
              <select
                className="select"
                value={cart.zoneId || ''}
                onChange={(e) => cart.setZoneId(e.target.value || null)}
              >
                <option value="">Selecciona zona</option>
                {(store.store_zones || []).map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name} · {zone.comuna} · {clp(zone.delivery_fee)} · mínimo {clp(zone.min_order)}
                  </option>
                ))}
              </select>
            </div>

            <div className="stack gap6">
              <label className="label">Método de pago</label>
              <select className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
                {store.allow_cash ? <option value="efectivo">Efectivo</option> : null}
                {store.allow_transfer ? <option value="transferencia">Transferencia</option> : null}
              </select>
              {paymentMethod === 'transferencia' && store.bank_details ? (
                <div className="card muted small">
                  El cliente puede transferir y luego el operador confirma el pago desde el panel.
                </div>
              ) : null}
            </div>

            <div className="stack gap6">
              <label className="label">Notas del pedido</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: tocar timbre, llamar al llegar, entregar por portón, etc." />
            </div>

            {error ? <div className="errorText">{error}</div> : null}
            {success ? <div className="successText">{success}</div> : null}

            <button className="btn" disabled={loading} onClick={submitOrder}>
              {loading ? 'Creando pedido...' : 'Confirmar pedido'}
            </button>
          </section>

          <aside className="panel big stack gap16">
            <h2 className="panelTitle">Resumen</h2>
            <div className="stack gap10">
              {cart.items.map((item) => {
                const price = item.product.promo_price ?? item.product.price;
                return (
                  <div key={item.product.id} className="summaryLine">
                    <div>
                      <strong>{item.product.name}</strong>
                      <div className="muted small">{item.quantity} × {clp(price)}</div>
                    </div>
                    <strong>{clp(price * item.quantity)}</strong>
                  </div>
                );
              })}
              <div className="summaryLine">
                <span>Subtotal</span>
                <strong>{clp(subtotal)}</strong>
              </div>
              <div className="summaryLine">
                <span>Despacho</span>
                <strong>{clp(activeZone?.delivery_fee || 0)}</strong>
              </div>
              <div className="summaryLine">
                <span>Total</span>
                <strong>{clp(total)}</strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
