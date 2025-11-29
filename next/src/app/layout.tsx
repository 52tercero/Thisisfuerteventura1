import './globals.css';
import './legacy.css';
import './legacy-full.css';
import '../styles/theme.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'This is Fuerteventura',
  description: 'Guía y noticias de Fuerteventura',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
