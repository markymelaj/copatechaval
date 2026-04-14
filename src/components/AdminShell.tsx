'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabase/browser';

const items = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/productos', label: 'Productos' },
  { href: '/admin/zonas', label: 'Zonas' },
  { href: '/admin/repartidores', label: 'Repartidores' },
  { href: '/backoffice', label: 'Superadmin' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="adminLayout">
      <aside className="sidebar">
        <Link href="/" className="brand smallBrand">
          copete<span>.app</span>
        </Link>
        <nav className="stack gap8">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? 'navItem active' : 'navItem'}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className="btn secondary mtAuto" onClick={signOut}>
          Cerrar sesión
        </button>
      </aside>
      <main className="adminMain">{children}</main>
    </div>
  );
}
