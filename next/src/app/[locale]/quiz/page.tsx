import { getMessages } from '../../../lib/i18n';
export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string }> }
export default async function QuizPage({ params }: PageProps) {
  const { locale } = await params; const messages = getMessages(locale); const t = messages.quiz || { title:'Quiz', intro:'' };
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      {t.intro && <p className="text-light mb-6">{t.intro}</p>}
      <p className="text-sm">(Interactividad del quiz pendiente de migración)</p>
    </main>
  );
}
