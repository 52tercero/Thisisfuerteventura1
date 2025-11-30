import { getMessages } from '../../../lib/i18n';
export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string }> }
export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params; const messages = getMessages(locale);
  const t = messages.cookies || { title:'Cookies', accept:'Accept', reject:'Reject', manage:'Manage preferences' };
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      <p className="text-light mb-6">Utilizamos cookies para mejorar tu experiencia. Puedes cambiar tus preferencias en cualquier momento.</p>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-green-600 text-white rounded">{t.accept}</button>
        <button className="px-4 py-2 bg-gray-200 rounded">{t.reject}</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">{t.manage}</button>
      </div>
    </main>
  );
}
