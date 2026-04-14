'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/admin');
    });
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage('Cuenta creada. Si tu proyecto usa confirmación por correo, revisa tu mail.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/admin');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo continuar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container authGrid">
        <section className="authShowcase stack gap20">
          <span className="storeBadge">Acceso operadores · admins · superadmins</span>
          <h1 style={{ fontSize: '54px', margin: 0, lineHeight: 0.95 }}>Entra y deja operando tu boti hoy.</h1>
          <p className="sectionSubtitle">
            Desde aquí entras al panel de tu tienda y también al panel global si ya eres superadmin.
          </p>
        </section>

        <section className="panel authCard stack gap16">
          <div className="row gap8">
            <button className={mode === 'login' ? 'btn' : 'btn secondary'} onClick={() => setMode('login')}>
              Ingresar
            </button>
            <button className={mode === 'register' ? 'btn' : 'btn secondary'} onClick={() => setMode('register')}>
              Crear cuenta
            </button>
          </div>

          <form className="stack gap12" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <div className="stack gap6">
                <label className="label">Nombre completo</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
            ) : null}

            <div className="stack gap6">
              <label className="label">Correo</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="stack gap6">
              <label className="label">Contraseña</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button className="btn" disabled={loading} type="submit">
              {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          {message ? <div className="muted">{message}</div> : null}
        </section>
      </div>
    </main>
  );
}
