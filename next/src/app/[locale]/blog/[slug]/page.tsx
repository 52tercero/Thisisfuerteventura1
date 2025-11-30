import { getPostBySlug } from '@/data/blog';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string; locale: string } }

export default function BlogPostPage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) return notFound();
  return (
    <main className="container mx-auto px-4 py-10">
      <Link href={`/${params.locale}/blog`} className="text-sm mb-4 inline-block">← Volver</Link>
      <article className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-sm text-gray-600 mb-6">{new Date(post.date).toLocaleDateString(params.locale)} · {post.category}</p>
        <img src={`/${post.image}`} alt={post.title} className="w-full h-72 object-cover rounded mb-6" />
        <div className="prose max-w-none">
          <p>{post.content}</p>
        </div>
      </article>
    </main>
  );
}import { BLOG_POSTS } from '../../../../data/blog';
import { getMessages } from '../../../../lib/i18n';

export const dynamic = 'force-dynamic';
interface PageProps { params: Promise<{ locale: string; slug: string }> }

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const messages = getMessages(locale);
  const tArticle = messages.article;

  const post = BLOG_POSTS.find(p => p.slug === slug);
  if (!post) {
    return <main className="container mx-auto px-4 py-10"><p>{tArticle.notFound}</p></main>;
  }
  return (
    <main className="container mx-auto px-4 py-10">
      <a href={`/${locale}/blog`} className="btn-back text-sm underline">← {messages.blog.latest}</a>
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-xs text-light mb-4">{new Date(post.date).toLocaleDateString(locale)}</p>
      {post.image && <img src={post.image} alt={post.title} className="w-full max-h-[380px] object-cover rounded mb-6" />}
      <article className="prose max-w-none">
        <p>{post.content}</p>
      </article>
    </main>
  );
}
