import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }
  const proxyBase = process.env.NEXT_PUBLIC_PROXY_URL || 'http://localhost:3000';
  const forward = `${proxyBase}/api/image?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(forward, { headers: { 'accept': '*/*' } });
    if (!res.ok) {
      return NextResponse.json({ error: `Proxy error ${res.status}` }, { status: res.status });
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=300'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 502 });
  }
}
