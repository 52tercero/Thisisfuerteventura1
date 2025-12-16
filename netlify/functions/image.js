// Netlify Function: Proxy de imágenes para mitigar hotlinking/CORB
// Uso: /.netlify/functions/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    // Cachear imágenes agresivamente (30 días) y permitir SWR de 7 días
    // Safe porque la URL incluye el parámetro completo del recurso remoto
    'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=604800, immutable'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const url = (event.queryStringParameters && event.queryStringParameters.url) || '';
    if (!url) {
      return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'missing url' }) };
    }

    let target;
    try {
      target = new URL(url);
    } catch (_) {
      return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'invalid url' }) };
    }

    // Permitir solo HTTPS para evitar problemas de contenido mixto
    if (target.protocol !== 'https:') {
      return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'only https allowed' }) };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(target.toString(), {
      signal: controller.signal,
      // Ayuda a algunos CDNs/hosts a servir la imagen sin bloqueo de hotlink
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        // Enviar un referer igual al origin para saltar comprobaciones anti-hotlink básicas
        'Referer': target.origin + '/',
        'User-Agent': 'Mozilla/5.0 (compatible; ThisIsFuerteventuraBot/1.0)'
      }
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { statusCode: res.status, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'upstream_error', status: res.status }) };
    }

    const ctype = res.headers.get('content-type') || 'application/octet-stream';
    if (!ctype.startsWith('image/')) {
      // Evitar pasar contenido que no sea imagen (podría disparar CORB)
      return { statusCode: 415, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'unsupported content-type', contentType: ctype }) };
    }

    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);

    // ETag para validación condicional en clientes/CDN
    const crypto = require('crypto');
    const hash = crypto.createHash('sha1').update(buf).digest('hex');
    const etag = `W/"${hash}"`;

    // 304 si el cliente ya tiene esta versión
    const reqETag = (event.headers && (event.headers['if-none-match'] || event.headers['If-None-Match'])) || '';
    if (reqETag && reqETag === etag) {
      return { statusCode: 304, headers: { ...headers, ETag: etag } };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': ctype, 'ETag': etag },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'proxy_failed', message: e && e.message }) };
  }
};
