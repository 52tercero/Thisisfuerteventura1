const { fetchFeed, normalize, buildAllowed } = require('./utils');

exports.handler = async (event) => {
  try {
    const url = (event.queryStringParameters && event.queryStringParameters.url) || '';
    if (!url) return { statusCode: 400, body: JSON.stringify({ error: 'missing url' }) };

    const ALLOW_ALL = process.env.ALLOW_ALL === '1' || process.env.ALLOW_ALL === 'true';
    let allowed = true;
    if (!ALLOW_ALL) {
      const list = buildAllowed();
      allowed = list.some((s) => url.startsWith(s));
    }
    if (!allowed) {
      return { statusCode: 403, body: JSON.stringify({ error: 'source not allowed' }) };
    }

    const items = await fetchFeed(url);
    return { statusCode: 200, body: JSON.stringify({ items: normalize(items) }), headers: { 'Content-Type': 'application/json' } };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'rss_failed', details: e && e.message }) };
  }
};
