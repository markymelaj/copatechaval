'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function RegistroPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    comuna: '',
    phone: '',
    whatsapp: '',
    email: '',
    password: '',
    ownerName: '',
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let session = (await supabase.auth.getSession()).data.session;

      if (!session) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.ownerName },
          },
        });
        if (signUpError) throw signUpError;

        const signIn = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (signIn.error) throw signIn.error;
        session = signIn.data.session;
      }

      if (!session) throw new Error('No fue posible obtener una sesión válida.');

      const response = await fetch('/api/register-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          address: form.address,
          comuna: form.comuna,
          phone: form.phone,
          whatsapp: form.whatsapp,
          email: form.email,
        }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'No se pudo registrar la boti');

      router.push(`/registro/exito?slug=${encodeURIComponent(form.slug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="narrow" style={{ padding: '30px 0 40px' }}>
        <section className="panel big stack gap16">
          <span className="storeBadge">Alta self-service · pendiente de aprobación</span>
          <h1 className="panelTitle">Registra tu boti</h1>
          <p className="sectionSubtitle">
            Entras a prueba con una base profesional: slug propio, zonas, repartidores, pedidos y tracking.
          </p>

          <form className="grid gap16" onSubmit={handleSubmit}>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="stack gap6">
                <label className="label">Nombre del negocio</label>
                <input className="input" required value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">Slug</label>
                <input
                  className="input"
                  required
                  placeholder="ej: don-pepe"
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                />
              </div>
            </div>

            <div className="stack gap6">
              <label className="label">Descripción corta</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="stack gap6">
                <label className="label">Dirección base</label>
                <input className="input" required value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">Comuna</label>
                <input className="input" required value={form.comuna} onChange={(e) => update('comuna', e.target.value)} />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="stack gap6">
                <label className="label">Teléfono</label>
                <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">WhatsApp</label>
                <input className="input" value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">Correo negocio / login</label>
                <input className="input" required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="stack gap6">
                <label className="label">Nombre encargado</label>
                <input className="input" required value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
              </div>
              <div className="stack gap6">
                <label className="label">Contraseña</label>
                <input className="input" required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} />
              </div>
            </div>

            {error ? <div className="errorText">{error}</div> : null}

            <button className="btn" disabled={loading} type="submit">
              {loading ? 'Registrando...' : 'Crear boti'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
