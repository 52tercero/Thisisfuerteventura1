const { fetchFeed, normalize, buildAllowed } = require('./utils');

exports.handler = async (event) => {
  // CORS headers for browser requests
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    console.log('[RSS FUNCTION] Query params:', event.queryStringParameters);
    const url = (event.queryStringParameters && event.queryStringParameters.url) || '';
    if (!url) {
      console.log('[RSS FUNCTION] Missing url parameter');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing url' }) };
    }

    const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';
    let allowed = true;
    if (!ALLOW_ALL) {
      const list = buildAllowed();
      allowed = list.some((s) => url.startsWith(s));
      console.log('[RSS FUNCTION] Allowlist check for', url, ':', allowed);
    }
    if (!allowed) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'source not allowed' }) };
    }

    const items = await fetchFeed(url);
    console.log('[RSS FUNCTION] Fetched', items.length, 'items from', url);
    return { statusCode: 200, headers, body: JSON.stringify({ items: normalize(items) }) };
  } catch (e) {
    console.error('[RSS FUNCTION] Error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'rss_failed', details: e && e.message }) };
  }
};
