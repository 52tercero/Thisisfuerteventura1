// Netlify Function: Image proxy to mitigate hotlinking/CORB issues
// Usage: /.netlify/functions/image?url=https%3A%2F%2Fexample.com%2Fimage.jpg

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    // Cache images for a day, allow quick reloads
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
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

    // Only allow HTTPS to avoid mixed-content issues
    if (target.protocol !== 'https:') {
      return { statusCode: 400, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'only https allowed' }) };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(target.toString(), {
      signal: controller.signal,
      // Help some CDNs/hosts serve the image without hotlink blocking
      headers: {
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        // Send a referer matching the origin which often bypasses basic anti-hotlink checks
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
      // Avoid passing through non-image content (which could trigger CORB)
      return { statusCode: 415, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'unsupported content-type', contentType: ctype }) };
    }

    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': ctype },
      body: buf.toString('base64'),
      isBase64Encoded: true
    };
  } catch (e) {
    return { statusCode: 500, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'proxy_failed', message: e && e.message }) };
  }
};
