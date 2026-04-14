'use client';

import { useEffect, useState } from 'react';
import { getCurrentUserContext } from '@/lib/client-session';
import { safeDate } from '@/lib/format';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function BackofficePage() {
  const [stores, setStores] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  async function load() {
    try {
      const context = await getCurrentUserContext();
      if (context.profile.platform_role !== 'superadmin') throw new Error('Este panel es solo para superadmins.');
      setIsSuperadmin(true);
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, comuna, is_approved, created_at, subscriptions(status, trial_days, trial_started_at, trial_ends_at)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar backoffice');
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(storeId: string) {
    const supabase = getSupabaseBrowser();
    const days = Number(window.prompt('Días de trial', '7') || '7');
    const { error } = await supabase.rpc('approve_store', { p_store_id: storeId, p_trial_days: days });
    if (error) return setError(error.message);
    load();
  }

  async function setTrial(storeId: string) {
    const supabase = getSupabaseBrowser();
    const days = Number(window.prompt('Nuevo trial en días', '7') || '7');
    const { error } = await supabase.rpc('set_store_trial', { p_store_id: storeId, p_trial_days: days, p_reset_from_now: true });
    if (error) return setError(error.message);
    load();
  }

  if (error && !isSuperadmin) return <div className="errorText">{error}</div>;

  return (
    <div className="stack gap20">
      <section>
        <h1 className="sectionTitle">Backoffice · copete.app</h1>
        <p className="sectionSubtitle">Aprobación de botis, trial configurable y control de la plataforma.</p>
      </section>
      {error ? <div className="errorText">{error}</div> : null}
      <section className="panel big stack gap12">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Boti</th>
                <th>Comuna</th>
                <th>Estado</th>
                <th>Trial</th>
                <th>Creada</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const sub = Array.isArray(store.subscriptions) ? store.subscriptions[0] : store.subscriptions;
                return (
                  <tr key={store.id}>
                    <td>{store.name}<div className="muted small">/{store.slug}</div></td>
                    <td>{store.comuna}</td>
                    <td>{store.is_approved ? 'Aprobada' : 'Pendiente'}</td>
                    <td>
                      {sub?.status || '-'}
                      {sub?.trial_ends_at ? <div className="muted small">hasta {safeDate(sub.trial_ends_at)}</div> : null}
                    </td>
                    <td>{safeDate(store.created_at)}</td>
                    <td>
                      <div className="row gap8 wrap">
                        {!store.is_approved ? <button className="btn" onClick={() => approve(store.id)}>Aprobar + trial</button> : null}
                        <button className="btn secondary" onClick={() => setTrial(store.id)}>Ajustar trial</button>
                      </div>
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
