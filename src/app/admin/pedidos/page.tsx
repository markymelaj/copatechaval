'use client';

import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserContext } from '@/lib/client-session';
import { clp, safeDate, statusLabel } from '@/lib/format';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function AdminPedidosPage() {
  const [storeId, setStoreId] = useState<string>('');
  const [sessionUserId, setSessionUserId] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      const context = await getCurrentUserContext();
      if (!context.primaryStore) throw new Error('No tienes una tienda asignada.');
      setStoreId(context.primaryStore.id);
      setSessionUserId(context.session.user.id);
      const supabase = getSupabaseBrowser();
      const [ordersRes, driversRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_code, status, customer_name, customer_phone, total, payment_method, payment_status, created_at, address_line, comuna, driver_id, zone_name_snapshot')
          .eq('store_id', context.primaryStore.id)
          .order('created_at', { ascending: false })
          .limit(100),
        supabase.from('drivers').select('*').eq('store_id', context.primaryStore.id).eq('is_active', true),
      ]);
      if (ordersRes.error) throw ordersRes.error;
      if (driversRes.error) throw driversRes.error;
      setOrders(ordersRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar pedidos');
    }
  }

  useEffect(() => { load(); }, []);

  async function confirmOrder(orderId: string) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from('orders')
      .update({ status: 'confirmado', confirmed_by: sessionUserId })
      .eq('id', orderId)
      .eq('store_id', storeId);
    if (error) return setError(error.message);
    load();
  }

  async function cancelOrder(orderId: string) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelado', cancelled_by: sessionUserId })
      .eq('id', orderId)
      .eq('store_id', storeId);
    if (error) return setError(error.message);
    load();
  }

  async function assignDriver(orderId: string, driverId: string) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId, assigned_by: sessionUserId, status: 'confirmado' })
      .eq('id', orderId)
      .eq('store_id', storeId);
    if (error) return setError(error.message);
    load();
  }

  async function confirmTransfer(orderId: string) {
    const supabase = getSupabaseBrowser();
    const { error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'confirmado', confirmed_by: sessionUserId, confirmed_at: new Date().toISOString() })
      .eq('order_id', orderId)
      .eq('method', 'transferencia');
    if (paymentError) return setError(paymentError.message);

    const { error: orderError } = await supabase
      .from('orders')
      .update({ payment_status: 'confirmado' })
      .eq('id', orderId)
      .eq('store_id', storeId);
    if (orderError) return setError(orderError.message);

    load();
  }

  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pendiente'), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => ['confirmado', 'en_ruta'].includes(order.status)), [orders]);

  return (
    <div className="stack gap20">
      <section>
        <h1 className="sectionTitle">Pedidos</h1>
        <p className="sectionSubtitle">Acepta, asigna repartidor y deja el flujo operativo de noche lo más corto posible.</p>
      </section>

      {error ? <div className="errorText">{error}</div> : null}

      <section className="panel big stack gap12">
        <h2 className="panelTitle">Pendientes</h2>
        {!pendingOrders.length ? <div className="muted">No hay pedidos pendientes.</div> : null}
        {pendingOrders.map((order) => (
          <article key={order.id} className="orderCard">
            <div className="row justifyBetween alignCenter wrap gap12">
              <div>
                <strong>{order.order_code}</strong>
                <div className="muted small">{order.customer_name} · {order.customer_phone}</div>
              </div>
              <span className="badge gray">{statusLabel(order.status)}</span>
            </div>
            <div className="muted">{order.address_line} · {order.comuna}</div>
            <div className="row justifyBetween alignCenter wrap gap12">
              <span>{clp(order.total)} · {order.payment_method}</span>
              <span className="muted small">{safeDate(order.created_at)}</span>
            </div>
            <div className="row gap8 wrap">
              <button className="btn" onClick={() => confirmOrder(order.id)}>Confirmar</button>
              <select className="select" defaultValue="" onChange={(e) => assignDriver(order.id, e.target.value)} style={{ maxWidth: 240 }}>
                <option value="">Asignar repartidor</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>{driver.name}</option>
                ))}
              </select>
              <button className="btn danger" onClick={() => cancelOrder(order.id)}>Cancelar</button>
            </div>
          </article>
        ))}
      </section>

      <section className="panel big stack gap12">
        <h2 className="panelTitle">Activos</h2>
        {!activeOrders.length ? <div className="muted">No hay pedidos confirmados o en ruta.</div> : null}
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Zona</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Asignación</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_code}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.zone_name_snapshot || '-'}</td>
                  <td>{clp(order.total)}</td>
                  <td>{statusLabel(order.status)}</td>
                  <td>
                    <div className="stack gap6">
                      <span>{order.payment_method}</span>
                      <span className="small muted">{order.payment_status}</span>
                      {order.payment_method === 'transferencia' && order.payment_status !== 'confirmado' ? (
                        <button className="btn secondary" onClick={() => confirmTransfer(order.id)}>
                          Confirmar transferencia
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <select className="select" value={order.driver_id || ''} onChange={(e) => assignDriver(order.id, e.target.value)}>
                      <option value="">Sin repartir</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>{driver.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
