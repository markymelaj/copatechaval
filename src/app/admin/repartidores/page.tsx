'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getCurrentUserContext } from '@/lib/client-session';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

const vehicles = ['moto', 'auto', 'bicicleta', 'a_pie'];

export default function AdminRepartidoresPage() {
  const [storeId, setStoreId] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', vehicle: 'moto' });

  async function load() {
    try {
      const context = await getCurrentUserContext();
      if (!context.primaryStore) throw new Error('No tienes tienda asignada.');
      setStoreId(context.primaryStore.id);
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.from('drivers').select('*').eq('store_id', context.primaryStore.id).order('created_at', { ascending: false });
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar repartidores');
    }
  }

  useEffect(() => { load(); }, []);

  async function saveDriver(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('drivers').insert({
      store_id: storeId,
      name: form.name,
      phone: form.phone,
      vehicle: form.vehicle,
      is_active: true,
    });
    if (error) return setError(error.message);
    setForm({ name: '', phone: '', vehicle: 'moto' });
    load();
  }

  async function toggleDriver(driver: any) {
    const supabase = getSupabaseBrowser();
    const { error } = await supabase.from('drivers').update({ is_active: !driver.is_active }).eq('id', driver.id);
    if (error) return setError(error.message);
    load();
  }

  return (
    <div className="stack gap20">
      <section>
        <h1 className="sectionTitle">Repartidores</h1>
        <p className="sectionSubtitle">Cada repartidor trabaja con link propio, navegador y navegación directa al destino.</p>
      </section>
      {error ? <div className="errorText">{error}</div> : null}
      <section className="panel big stack gap16">
        <h2 className="panelTitle">Nuevo repartidor</h2>
        <form className="grid gap12" onSubmit={saveDriver}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <input className="input" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <input className="input" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
            <select className="select" value={form.vehicle} onChange={(e) => setForm((p) => ({ ...p, vehicle: e.target.value }))}>
              {vehicles.map((vehicle) => <option key={vehicle} value={vehicle}>{vehicle}</option>)}
            </select>
          </div>
          <button className="btn" type="submit">Guardar repartidor</button>
        </form>
      </section>
      <section className="panel big stack gap12">
        <h2 className="panelTitle">Equipo activo</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Link</th>
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/r?t=${driver.access_token}` : `/r?t=${driver.access_token}`;
                return (
                  <tr key={driver.id}>
                    <td>{driver.name}</td>
                    <td>{driver.phone}</td>
                    <td>{driver.vehicle}</td>
                    <td>{driver.current_status}</td>
                    <td><a className="muted small" href={url} target="_blank">Abrir link</a></td>
                    <td>
                      <button className={driver.is_active ? 'btn secondary' : 'btn'} onClick={() => toggleDriver(driver)}>
                        {driver.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
