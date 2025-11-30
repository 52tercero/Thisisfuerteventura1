export function escapeHTML(str: any): string {
  try {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  } catch (_) {
    return '';
  }
}

export function sanitizeHTML(html: any): string {
  try {
    const H = String(html);
    if (typeof window !== 'undefined') {
      const w = window as any;
      if (w.DOMPurify && typeof w.DOMPurify.sanitize === 'function') {
        return w.DOMPurify.sanitize(H);
      }
    }
    return H
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on[a-z]+\s*=\s*"[^"]*"/gi, '')
      .replace(/on[a-z]+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:\s*/gi, '');
  } catch (_) {
    return '';
  }
}
