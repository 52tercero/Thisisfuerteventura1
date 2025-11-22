// Netlify Function: Facebook Graph API proxy
// Reads env vars: FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN

const fetch = globalThis.fetch;

function cors(status, body, contentType = 'application/json') {
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

function pickImageFromAttachments(att) {
  if (!att) return '';
  const attachments = att.data || [];
  // Prefer subattachments first (albums), then direct media url
  for (const a of attachments) {
    if (a.subattachments && a.subattachments.data && a.subattachments.data.length) {
      const img = a.subattachments.data.find(x => x.media && x.media.image && x.media.image.src);
      if (img) return img.media.image.src;
    }
    if (a.media && a.media.image && a.media.image.src) return a.media.image.src;
    if (a.url) return a.url;
  }
  return '';
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return cors(200, '');
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const token = process.env.FACEBOOK_ACCESS_TOKEN;
  if (!pageId || !token) {
    return cors(500, { error: 'FACEBOOK_PAGE_ID or FACEBOOK_ACCESS_TOKEN not configured' });
  }
  const url = new URL(event.rawUrl || `https://dummy.local/`);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '5', 10), 1), 20);

  const fields = 'message,permalink_url,created_time,full_picture,attachments{media_type,media,url,subattachments}';
  const graphUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  try {
    const res = await fetch(graphUrl, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      return cors(res.status, { error: 'Graph error', detail: text });
    }
    const json = await res.json();
    const items = (json.data || []).map(p => {
      const image = p.full_picture || pickImageFromAttachments(p.attachments) || '';
      return {
        id: p.id,
        message: p.message || '',
        permalink: p.permalink_url || '',
        image,
        created_time: p.created_time || ''
      };
    });
    return cors(200, { items });
  } catch (e) {
    return cors(500, { error: 'Fetch failed', detail: String(e && e.message || e) });
  }
};
