import { NextRequest, NextResponse } from 'next/server';
import { addJob } from '../../../lib/store';
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
  const schema = z.object({
    title: z.string().min(2),
    description: z.string().max(8000).optional(),
    requirements: z.array(z.string().min(2)).max(100).optional()
  });
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });
  const { title, description, requirements = [] } = parsed.data;
  const job = addJob(user.uid, title, description || '', requirements.slice(0, 50));
  return NextResponse.json({ id: job.id });
}
