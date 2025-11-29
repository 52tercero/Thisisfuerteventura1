export function slugify(title: string): string {
  if (!title) return 'sin-titulo';
  const base = title
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return base || 'sin-titulo';
}

export interface NewsItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  image?: string;
  source?: string;
  raw?: any;
}
