// Netlify Function: Proxy y optimizador de imágenes (mitiga hotlinking/CORB)
// Uso:
//  /.netlify/functions/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg&w=640&q=65&f=auto
//  Parámetros:
//   - url (obligatorio): URL HTTPS de la imagen de origen
//   - w (opcional): ancho máximo en píxeles (clamped 64..1600)
//   - q (opcional): calidad (1..95), por defecto 70
//   - f (opcional): formato de salida: auto|avif|webp|orig

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
    const wParam = (event.queryStringParameters && event.queryStringParameters.w) || '';
    const qParam = (event.queryStringParameters && event.queryStringParameters.q) || '';
    const fParam = (event.queryStringParameters && event.queryStringParameters.f) || '';
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

    let ctype = res.headers.get('content-type') || 'application/octet-stream';
    if (!ctype.startsWith('image/')) {
      // Evitar pasar contenido que no sea imagen (podría disparar CORB)
      return { statusCode: 415, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'unsupported content-type', contentType: ctype }) };
    }

    const ab = await res.arrayBuffer();
    let buf = Buffer.from(ab);

    // Opcional: transformar tamaño/formato si se solicitan parámetros
    const width = Math.max(0, Math.min(1600, parseInt(wParam || '0', 10) || 0));
    const quality = Math.max(1, Math.min(95, parseInt(qParam || '70', 10) || 70));
    const accept = (event.headers && (event.headers['accept'] || event.headers['Accept'])) || '';
    const wantsAvif = /image\/avif/.test(accept);
    const wantsWebp = /image\/webp/.test(accept);
    const format = (fParam || 'auto').toLowerCase();
    let outFormat = null; // null mantiene formato original

    if (format === 'avif' || (format === 'auto' && wantsAvif)) { outFormat = 'avif'; }
    else if (format === 'webp' || (format === 'auto' && wantsWebp)) { outFormat = 'webp'; }
    else if (format === 'orig') { outFormat = null; }

    if (width > 0 || outFormat) {
      try {
        const sharp = require('sharp');
        let img = sharp(buf, { failOn: 'none' });
        if (width > 0) {
          img = img.resize({ width, withoutEnlargement: true });
        }
        if (outFormat === 'avif') {
          img = img.toFormat('avif', { quality, effort: 4 });
          ctype = 'image/avif';
        } else if (outFormat === 'webp') {
          img = img.toFormat('webp', { quality });
          ctype = 'image/webp';
        }
        buf = await img.toBuffer();
      } catch (procErr) {
        // Si falla sharp por cualquier motivo, continuar con el buffer original
        console.warn('Image transform failed:', procErr && procErr.message);
      }
    }

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
