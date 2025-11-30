exports.handler = async () => {
  try {
    const site = process.env.SITE_URL || '';
    if (site) {
      const url = site.replace(/\/$/, '') + '/.netlify/functions/aggregate?dedupe=1';
      await fetch(url, { headers: { 'User-Agent': 'WarmFunction/1.0' } }).catch(() => {});
    }
    return { statusCode: 204, body: '' };
  } catch (e) {
    return { statusCode: 200, body: '' };
  }
};