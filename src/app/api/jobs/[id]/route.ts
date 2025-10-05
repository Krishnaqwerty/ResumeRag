import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '../../../../lib/store';
import { verifyIdToken, ensureUserProfile } from '../../../../lib/firebaseAdmin';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.split('Bearer ')[1];
  if (!token) return null;
  try { return await verifyIdToken(token); } catch { return null; }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await ensureUserProfile(user.uid, user.email);
  const job = getJob(params.id);
  if (!job || job.ownerUid !== user.uid) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ id: job.id, title: job.title, description: job.description, requirements: job.requirements, createdAt: job.createdAt });
}
