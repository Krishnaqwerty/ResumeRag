import { NextRequest, NextResponse } from 'next/server';
import { addResume, listResumes } from '../../../lib/store';
import { parseMaybeZip } from '../../../lib/parseResume';
import { verifyIdToken, ensureUserProfile } from '../../../lib/firebaseAdmin';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.split('Bearer ')[1];
  if (!token) return null;
  try { return await verifyIdToken(token); } catch { return null; }
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await ensureUserProfile(user.uid, user.email);
  const form = await req.formData();
  const files = form.getAll('files');
  const created: any[] = [];
  for (const f of files) {
    if (!(f instanceof File)) continue;
    const buf = Buffer.from(await f.arrayBuffer());
    const parsed = await parseMaybeZip(f.name, buf);
    for (const p of parsed) {
      const rec = addResume(user.uid, p.filename, p.mime, p.text);
      created.push({ id: rec.id, filename: rec.filename });
    }
  }
  return NextResponse.json({ created });
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await ensureUserProfile(user.uid, user.email);
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const q = searchParams.get('q') || undefined;
  const data = listResumes(user.uid, q, limit, offset);
  return NextResponse.json({ total: data.total, items: data.items.map(r => ({ id: r.id, filename: r.filename, createdAt: r.createdAt })) });
}
