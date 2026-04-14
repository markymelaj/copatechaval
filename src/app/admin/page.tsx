'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUserContext } from '@/lib/client-session';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const context = await getCurrentUserContext();
        if (!context.primaryStore) throw new Error('No tienes una tienda asignada todavía.');
        const supabase = getSupabaseBrowser();
        const storeId = context.primaryStore.id;

        const [ordersResult, productsResult, driversResult, zonesResult, subscriptionResult] = await Promise.all([
          supabase.from('orders').select('id, status', { count: 'exact', head: false }).eq('store_id', storeId),
          supabase.from('products').select('id', { count: 'exact', head: false }).eq('store_id', storeId),
          supabase.from('drivers').select('id, current_status', { count: 'exact', head: false }).eq('store_id', storeId),
          supabase.from('store_zones').select('id', { count: 'exact', head: false }).eq('store_id', storeId),
          supabase.from('subscriptions').select('*').eq('store_id', storeId).maybeSingle(),
        ]);

        setSummary({
          store: context.primaryStore,
          profile: context.profile,
          primaryRole: context.primaryRole,
          orders: ordersResult.data || [],
          productsCount: productsResult.count || 0,
          drivers: driversResult.data || [],
          driversCount: driversResult.count || 0,
          zonesCount: zonesResult.count || 0,
          subscription: subscriptionResult.data || null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el panel');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Cargando panel...</div>;
  if (error) return <div className="errorText">{error}</div>;

  const pending = summary.orders.filter((item: any) => item.status === 'pendiente').length;
  const confirmed = summary.orders.filter((item: any) => item.status === 'confirmado').length;
  const enRuta = summary.orders.filter((item: any) => item.status === 'en_ruta').length;
  const driversOn = summary.drivers.filter((item: any) => item.current_status === 'en_ruta').length;

  return (
    <div className="stack gap20">
      <section className="stack gap8">
        <span className="badge success">{summary.store.is_approved ? 'Boti aprobada' : 'Pendiente de aprobación'}</span>
        <h1 className="sectionTitle">{summary.store.name}</h1>
        <p className="sectionSubtitle">
          Rol actual: {summary.primaryRole}. Trial: {summary.subscription?.status || 'aún no iniciado'}
        </p>
      </section>

      <section className="kpiGrid">
        <article className="kpi"><span className="muted">Pedidos pendientes</span><strong>{pending}</strong></article>
        <article className="kpi"><span className="muted">Pedidos confirmados</span><strong>{confirmed}</strong></article>
        <article className="kpi"><span className="muted">Pedidos en ruta</span><strong>{enRuta}</strong></article>
        <article className="kpi"><span className="muted">Repartidores en ruta</span><strong>{driversOn}</strong></article>
        <article className="kpi"><span className="muted">Productos</span><strong>{summary.productsCount}</strong></article>
        <article className="kpi"><span className="muted">Zonas</span><strong>{summary.zonesCount}</strong></article>
      </section>

      <section className="panel big stack gap12">
        <h2 className="panelTitle">Accesos rápidos</h2>
        <div className="row gap12 wrap">
          <Link href="/admin/pedidos" className="btn">Pedidos</Link>
          <Link href="/admin/productos" className="btn secondary">Productos</Link>
          <Link href="/admin/zonas" className="btn secondary">Zonas</Link>
          <Link href="/admin/repartidores" className="btn secondary">Repartidores</Link>
          <Link href={`/b/${summary.store.slug}`} className="btn secondary">Ver tienda</Link>
        </div>
      </section>
    </div>
  );
}
