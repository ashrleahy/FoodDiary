import { NextRequest, NextResponse } from 'next/server';
import { put, head, getDownloadUrl } from '@vercel/blob';

const PASSPHRASE = process.env.DATA_PASSPHRASE!;
const BLOB_KEY = 'fooddiary/data.json';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-passphrase');
  if (auth !== PASSPHRASE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blob = await head(BLOB_KEY);
    if (!blob) return NextResponse.json(null);
    const res = await fetch(blob.url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-passphrase');
  if (auth !== PASSPHRASE) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await put(BLOB_KEY, JSON.stringify(body), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Blob write error:', e);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
