'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
export const dynamic = 'force-dynamic';

export default function RegistroExitoPage() {
  const params = useSearchParams();
  const slug = params.get('slug');

  return (
    <main className="page center">
      <section className="panel big narrow stack gap16" style={{ maxWidth: 640 }}>
        <span className="badge success">Registro completado</span>
        <h1 className="panelTitle">Tu boti quedó creada y pendiente de aprobación.</h1>
        <p className="sectionSubtitle">
          Apenas se active, podrás cargar zonas, productos, repartidores y empezar el trial. Tu link quedará en:
        </p>
        <div className="card">{slug ? `copete.app/b/${slug}` : 'copete.app/b/tu-slug'}</div>
        <div className="row gap12 wrap">
          <Link href="/admin" className="btn">
            Ir al panel
          </Link>
          <Link href="/" className="btn secondary">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
