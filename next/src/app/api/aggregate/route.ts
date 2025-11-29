import { NextResponse } from 'next/server';

export const revalidate = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sources = searchParams.get('sources') || '';
  const upstream = process.env.NEXT_PUBLIC_AGGREGATE_URL || 'http://localhost:3000/api/aggregate';
  const url = `${upstream}?sources=${encodeURIComponent(sources)}`;
  try {
    const r = await fetch(url, { headers: { 'accept': 'application/json' } });
    if (!r.ok) return NextResponse.json({ items: [], error: `Upstream ${r.status}` }, { status: 200 });
    const json = await r.json();
    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ items: [], error: String(e?.message || e) }, { status: 200 });
  }
}
