"use client";
import React from 'react';
import ImageWithFallback from './ImageWithFallback';

export interface GridItem {
  id: string;
  title: string;
  summary: string;
  image?: string;
  meta?: string;
  features?: string[];
  href?: string;
  actionLabel?: string;
  external?: boolean;
}

interface ListGridProps<T extends GridItem> {
  items: T[];
  className?: string;
}

// Generic grid renderer to unify legacy card look across datasets
export function ListGrid<T extends GridItem>({ items, className }: ListGridProps<T>) {
  return (
    <div className={['legacy-grid', className].filter(Boolean).join(' ')}>
      {items.map(item => (
        <article key={item.id} className="legacy-card">
          {item.image && <ImageWithFallback src={item.image} alt={item.title} />}
          <h3>{item.title}</h3>
          <p className="text-light text-sm">{item.summary}</p>
          {item.meta && <p className="text-xs text-gray-500">{item.meta}</p>}
          {item.features && (
            <ul className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-600">
              {item.features.map(f => <li key={f} className="px-2 py-1 bg-gray-100 rounded">{f}</li>)}
            </ul>
          )}
          {item.href && (
            <div className="mt-2">
              <a
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-sm text-blue-600 font-medium"
              >
                {item.actionLabel || 'Ver →'}
              </a>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default ListGrid;