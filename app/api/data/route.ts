import { NextRequest, NextResponse } from 'next/server';
import { put, head } from '@vercel/blob';

const BLOB_KEY = 'fooddiary/data.json';

export async function GET() {
  try {
    const { downloadUrl } = await head(BLOB_KEY);
    const res = await fetch(downloadUrl);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await put(BLOB_KEY, JSON.stringify(body), {
  access: 'private',
  contentType: 'application/json',
  addRandomSuffix: false,
});
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Blob write error:', e);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
