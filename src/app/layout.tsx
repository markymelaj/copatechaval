import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'copete.app',
  description: 'Marketplace y SaaS para botillerías en Chile',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header className="siteHeader">
          <div className="container siteHeaderInner">
            <Link href="/" className="brand">
              copete<span>.app</span>
            </Link>
            <div className="row gap8 wrap">
              <Link href="/registro" className="btn secondary">
                Registra tu boti
              </Link>
              <Link href="/login" className="btn">
                Ingresar
              </Link>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
