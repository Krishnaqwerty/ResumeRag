import { NextRequest, NextResponse } from 'next/server';
import { ask } from '../../../lib/store';
import { z } from 'zod';
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
  const schema = z.object({ query: z.string().min(2), k: z.number().int().min(1).max(20).optional() });
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });
  const { query, k = 5 } = parsed.data;
  const results = ask(query, k);
  return NextResponse.json({ query, k, answers: results.map(r => ({ resume_id: r.resume_id, snippet: r.text, score: r.score })) });
}
