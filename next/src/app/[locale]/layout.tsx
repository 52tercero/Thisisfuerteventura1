import { notFound } from 'next/navigation';
import '../globals.css';
import SiteHeader from '../../components/SiteHeader';
import AmbientSounds from '../../components/AmbientSounds';
import Analytics from '../../components/Analytics';
import { LocaleProvider } from '../../components/LocaleProvider';
    import '../../styles/theme.css';

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }, { locale: 'de' }];
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await import(`../../messages/${locale}.json`).then(m=>m.default).catch(() => {
    notFound();
  });
  return (
    <LocaleProvider locale={locale} messages={messages}>
      <SiteHeader />
      {children}
      <AmbientSounds />
      <Analytics />
    </LocaleProvider>
  );
}
