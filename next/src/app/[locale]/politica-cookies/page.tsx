export const dynamic = 'force-dynamic';

export default function CookiesPage() {
  return (
    <main className="cookies-page container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Política de Cookies</h1>
      <p className="mb-6"><strong>Última actualización:</strong> 10 de noviembre de 2025</p>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">¿Qué son las cookies?</h2>
        <p>Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo cuando los visitas. Se utilizan para mejorar la eficiencia del sitio y ofrecer información a sus propietarios.</p>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">¿Cómo utilizamos las cookies?</h2>
        <p>Mejoran tu experiencia de navegación, recuerdan preferencias y permiten analizar interacción para optimizar servicios y contenido.</p>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">Tipos de cookies que utilizamos</h2>
        <h3 className="font-semibold mt-4">1. Cookies Necesarias</h3>
        <p>Esenciales para funciones básicas y navegación segura.</p>
        <ul className="list-disc pl-5 mb-2"><li>Consentimiento</li><li>Sesión</li></ul>
        <h3 className="font-semibold mt-4">2. Cookies Analíticas</h3>
        <p>Ayudan a medir visitas y uso de páginas.</p>
        <h3 className="font-semibold mt-4">3. Cookies de Marketing</h3>
        <p>Orientadas a mostrar anuncios relevantes.</p>
        <h3 className="font-semibold mt-4">4. Cookies Funcionales</h3>
        <p>Recuerdan preferencias como idioma o región.</p>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">¿Cómo puedo controlar las cookies?</h2>
        <p>Puedes ajustar tu navegador para aceptar o rechazar cookies. Rechazarlas puede limitar funciones del sitio.</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Chrome</li><li>Firefox</li><li>Safari</li><li>Edge</li>
        </ul>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cookies de terceros</h2>
        <p>Podemos usar servicios externos para análisis, CDN y redes sociales.</p>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">Cambios en esta política</h2>
        <p>Actualizaciones periódicas por cambios operativos o regulatorios.</p>
      </section>
      <section className="cookies-section mb-6">
        <h2 className="text-2xl font-semibold mb-2">Más información</h2>
        <p>Escríbenos mediante la página de contacto.</p>
      </section>
      <div className="cookies-callout mt-8 p-4 rounded bg-slate-100 dark:bg-slate-800">
        <p><strong>This is Fuerteventura</strong> se compromete a proteger tu privacidad y ser transparente sobre las tecnologías que utilizamos.</p>
      </div>
    </main>
  );
}import { getMessages } from '../../../lib/i18n';
export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string }> }
export default async function CookiesPage({ params }: PageProps) {
  const { locale } = await params; const messages = getMessages(locale); const t = messages.cookies;
  return <main className="container mx-auto px-4 py-10"><h1 className="text-3xl font-bold mb-4">{t.title}</h1><p className="text-light mb-6">{t.intro}</p><section className="space-y-4 text-sm"><p>1. Uso de cookies técnicas para navegación básica.</p><p>2. No se emplean cookies de terceros para publicidad personalizada.</p><p>3. Puedes limpiar o bloquear cookies desde la configuración de tu navegador.</p></section></main>;
}
