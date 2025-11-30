import { getMessages } from '../../../lib/i18n';
export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string }> }
export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const t = messages.contact || { title:'Contacto', intro:'', name:'Nombre', email:'Correo', message:'Mensaje', send:'Enviar' };
  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{t.title}</h1>
      {t.intro && <p className="text-light mb-6">{t.intro}</p>}
      <form className="space-y-4 max-w-lg" onSubmit={(e)=>{e.preventDefault();}}>
        <input type="text" name="name" placeholder={t.name} className="w-full border rounded p-2" />
        <input type="email" name="email" placeholder={t.email} className="w-full border rounded p-2" />
        <textarea name="message" placeholder={t.message} className="w-full border rounded p-2 h-40" />
        <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded">{t.send}</button>
      </form>
    </main>
  );
}
