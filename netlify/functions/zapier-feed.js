// Netlify Function: Zapier social feed proxy
// Expects env var ZAPIER_FEED_URL pointing to a Zapier webhook or Storage endpoint
// The Zapier endpoint should return JSON either:
// 1) { items: [...] } or { posts: [...] } or
// 2) A raw array [...]
// Each item ideally has: id, message (texto), permalink (URL a Facebook), image (URL), created_time (ISO8601)
// We normalize into { id, message, permalink, image, created_time }

const fetch = globalThis.fetch;

function response(status, body, contentType = 'application/json') {
  return {
    statusCode: status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': contentType
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return response(200, '');
  const feedUrl = process.env.ZAPIER_FEED_URL;
  if (!feedUrl) {
    return response(500, { error: 'ZAPIER_FEED_URL no configurada en variables de entorno' });
  }

  // Limitar cantidad opcional (?limit=)
  const url = new URL(event.rawUrl || 'https://dummy.local/');
  const limitParam = parseInt(url.searchParams.get('limit') || '5', 10);
  const limit = Math.min(Math.max(limitParam, 1), 20);

  try {
    const r = await fetch(feedUrl, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) {
      const txt = await r.text();
      return response(r.status, { error: 'Zapier feed error', detail: txt });
    }
    let data = await r.json();

    // Determinar array de items
    let arr;
    if (Array.isArray(data)) arr = data;
    else if (Array.isArray(data.items)) arr = data.items;
    else if (Array.isArray(data.posts)) arr = data.posts;
    else if (Array.isArray(data.data)) arr = data.data; // fallback común
    else arr = [];

    // Normalizar
    const norm = arr.slice(0, limit).map((item, idx) => {
      const id = item.id || item.post_id || String(idx);
      const message = item.message || item.text || item.content || '';
      const permalink = item.permalink || item.url || item.link || '';
      const image = item.image || item.full_picture || item.picture || '';
      const created = item.created_time || item.created || item.date || item.published_at || '';
      return { id, message, permalink, image, created_time: created };
    });

    return response(200, { items: norm });
  } catch (e) {
    return response(500, { error: 'Fetch failed', detail: String(e && e.message || e) });
  }
};
