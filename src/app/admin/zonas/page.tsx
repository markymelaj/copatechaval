'use client';

import { FormEvent, useEffect, useState } from 'react';
import { clp } from '@/lib/format';
import { getCurrentUserContext } from '@/lib/client-session';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function AdminZonasPage() {
  const [storeId, setStoreId] = useState('');
  const [zones, setZones] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', comuna: '', delivery_fee: 0, min_order: 0, estimated_time: '20-30 min' });

  async function load() {
    try {
      const context = await getCurrentUserContext();
      if (!context.primaryStore) throw new Error('No tienes tienda asignada.');
      setStoreId(context.primaryStore.id);
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.from('store_zones').select('*').eq('store_id', context.primaryStore.id).order('sort_order', { ascending: true });
      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar zonas');
    }
  }

  useEffect(() => { load(); }, []);

  async function saveZone(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('store_zones').insert({
      store_id: storeId,
      name: form.name,
      comuna: form.comuna,
      delivery_fee: Number(form.delivery_fee),
      min_order: Number(form.min_order),
      estimated_time: form.estimated_time,
      sort_order: zones.length + 1,
    });
    if (error) return setError(error.message);
    setForm({ name: '', comuna: '', delivery_fee: 0, min_order: 0, estimated_time: '20-30 min' });
    load();
  }

  async function toggleZone(zone: any) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('store_zones').update({ is_active: !zone.is_active }).eq('id', zone.id);
    if (error) return setError(error.message);
    load();
  }

  return (
    <div className="stack gap20">
      <section>
        <h1 className="sectionTitle">Zonas de reparto</h1>
        <p className="sectionSubtitle">Aquí se define el área de reparto y el valor fijo del despacho. Este módulo sí debe quedar fino.</p>
      </section>
      {error ? <div className="errorText">{error}</div> : null}
      <section className="panel big stack gap16">
        <h2 className="panelTitle">Nueva zona</h2>
        <form className="grid gap12" onSubmit={saveZone}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input className="input" placeholder="Nombre zona" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Comuna" value={form.comuna} onChange={(e) => setForm((p) => ({ ...p, comuna: e.target.value }))} required />
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <input className="input" type="number" min="0" placeholder="Valor reparto" value={form.delivery_fee || ''} onChange={(e) => setForm((p) => ({ ...p, delivery_fee: Number(e.target.value) }))} required />
            <input className="input" type="number" min="0" placeholder="Pedido mínimo" value={form.min_order || ''} onChange={(e) => setForm((p) => ({ ...p, min_order: Number(e.target.value) }))} />
            <input className="input" placeholder="Tiempo estimado" value={form.estimated_time} onChange={(e) => setForm((p) => ({ ...p, estimated_time: e.target.value }))} />
          </div>
          <button className="btn" type="submit">Guardar zona</button>
        </form>
      </section>
      <section className="panel big stack gap12">
        <h2 className="panelTitle">Zonas activas</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Zona</th>
                <th>Comuna</th>
                <th>Reparto</th>
                <th>Mínimo</th>
                <th>Tiempo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => (
                <tr key={zone.id}>
                  <td>{zone.name}</td>
                  <td>{zone.comuna}</td>
                  <td>{clp(zone.delivery_fee)}</td>
                  <td>{clp(zone.min_order)}</td>
                  <td>{zone.estimated_time}</td>
                  <td>
                    <button className={zone.is_active ? 'btn secondary' : 'btn'} onClick={() => toggleZone(zone)}>
                      {zone.is_active ? 'Desactivar' : 'Activar'}
                    </button>
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
