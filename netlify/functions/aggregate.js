const { fetchFeed, normalize, buildAllowed } = require('./utils');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=900'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    console.log('[AGGREGATE FUNCTION] Query params:', event.queryStringParameters);
    const qs = event.queryStringParameters || {};
    const srcParam = (qs.sources || '').trim();
    let sources = srcParam ? srcParam.split(',').map(s => s.trim()).filter(Boolean) : buildAllowed();
    console.log('[AGGREGATE FUNCTION] Initial sources count:', sources.length);

    const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';
    if (!ALLOW_ALL) {
      const list = buildAllowed();
      sources = sources.filter(s => list.some(a => s.startsWith(a)));
      console.log('[AGGREGATE FUNCTION] After allowlist filter:', sources.length);
    }
    
    if (sources.length === 0) {
      console.log('[AGGREGATE FUNCTION] No valid sources');
      return { statusCode: 200, headers, body: JSON.stringify({ items: [] }) };
    }

    const results = await Promise.allSettled(sources.map(src => fetchFeed(src)));
    let items = results.filter(r => r.status === 'fulfilled').map(r => r.value).flat();
    console.log('[AGGREGATE FUNCTION] Total items fetched:', items.length);

    const dedupe = qs.dedupe === '1' || qs.dedupe === 'true';
    if (dedupe) {
      const seen = new Set();
      items = items.filter(it => {
        const key = (it.link || it.title || '').trim();
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      console.log('[AGGREGATE FUNCTION] After deduplication:', items.length);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ items: normalize(items) }) };
  } catch (e) {
    console.error('[AGGREGATE FUNCTION] Error:', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'aggregate_failed', details: e && e.message }) };
  }
};
