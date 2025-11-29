import { BLOG_POSTS } from '../../../data/blog';
import { getMessages } from '../../../lib/i18n';
import ScrollObserver from '../../../components/ScrollObserver';

export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string }> }

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const messages = getMessages(locale);
  const tBlog = messages.blog || { latest: 'Blog', published:'Publicado', readMore:'Leer más' };

  return (
    <main className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{tBlog.latest}</h1>
      <ScrollObserver>
        <div className="legacy-grid">
        {BLOG_POSTS.map(post => (
          <article key={post.slug} className="legacy-card">
            {post.image && <img src={post.image} alt={post.title} />}
            <h3>{post.title}</h3>
            <p className="text-light text-sm">{post.excerpt}</p>
            <p className="text-xs">{tBlog.published}: {new Date(post.date).toLocaleDateString(locale)}</p>
            <a href={`/${locale}/blog/${post.slug}`} className="text-primary underline text-sm">{tBlog.readMore}</a>
          </article>
        ))}
        </div>
      </ScrollObserver>
    </main>
  );
}
