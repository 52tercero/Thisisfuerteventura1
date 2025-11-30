"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useT, useLocale } from './LocaleProvider';

const LOCALES = ['es','en','de'];

export default function LocaleNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = LOCALES.includes(segments[0]) ? segments[0] : locale;
  const rest = LOCALES.includes(segments[0]) ? '/' + segments.slice(1).join('/') : pathname;

  return (
    <header className="w-full bg-white/90 backdrop-blur border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <nav className="flex gap-4 text-sm font-medium">
          <Link href={`/${currentLocale}`} className="hover:text-blue-600">{t('nav','home')}</Link>
          <Link href={`/${currentLocale}/noticias`} className="hover:text-blue-600">{t('nav','news')}</Link>
          <Link href={`/${currentLocale}/turismo`} className="hover:text-blue-600">{t('nav','tourism')}</Link>
          <Link href={`/${currentLocale}/senderos`} className="hover:text-blue-600">{t('nav','senderos')}</Link>
          <Link href={`/${currentLocale}/playas`} className="hover:text-blue-600">{t('nav','beaches')}</Link>
          <Link href={`/${currentLocale}/alojamiento`} className="hover:text-blue-600">{t('nav','accommodation')}</Link>
        </nav>
        <div className="flex gap-2 text-xs">
          {LOCALES.map(loc => {
            const target = `/${loc}${rest === '/' ? '' : rest}`.replace(/\/$/, '');
            return (
              <Link key={loc} href={target} className={`px-2 py-1 rounded ${loc===currentLocale ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{loc.toUpperCase()}</Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
