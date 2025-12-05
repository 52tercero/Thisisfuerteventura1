// Netlify Function: Proxy de feed social de Zapier
// Requiere la variable de entorno ZAPIER_FEED_URL apuntando a un webhook o Storage de Zapier
// El endpoint de Zapier debe devolver JSON en alguno de estos formatos:
// 1) { items: [...] } o { posts: [...] }
// 2) Un arreglo plano [...]
// Cada elemento idealmente contiene: id, message (texto), permalink (URL a Facebook), image (URL), created_time (ISO8601)
// Se normaliza a { id, message, permalink, image, created_time }

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
  if (event.httpMethod === 'OPTIONS') {return response(200, '');}
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
    const data = await r.json();

    // Determinar el arreglo de items
    let arr;
    if (Array.isArray(data)) {arr = data;} else if (Array.isArray(data.items)) {arr = data.items;} else if (Array.isArray(data.posts)) {arr = data.posts;} else if (Array.isArray(data.data)) {arr = data.data;} // fallback común
    else {arr = [];}

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
