const { fetchFeed, normalize, buildAllowed } = require('./utils');

exports.handler = async (event) => {
  // CORS headers for browser requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    // Short CDN cache + SWR window (30s fresh, up to 60s stale while revalidating)
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const url = (event.queryStringParameters && event.queryStringParameters.url) || '';
    if (!url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing url' }) };
    }

    const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';
    let allowed = true;
    if (!ALLOW_ALL) {
      const list = buildAllowed();
      allowed = list.some((s) => url.startsWith(s));
    }
    if (!allowed) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'source not allowed' }) };
    }

  const items = await fetchFeed(url);
  // Limit extreme feeds to first 60 items (ordered as received)
  const limited = items.slice(0, 60);
  return { statusCode: 200, headers, body: JSON.stringify({ items: normalize(limited) }) };
  } catch (e) {
    console.error('[RSS] Error:', e.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'rss_failed', details: e && e.message }) };
  }
};
