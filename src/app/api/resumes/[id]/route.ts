import { NextRequest, NextResponse } from 'next/server';
import { getResume } from '../../../../lib/store';
import { verifyIdToken, ensureUserProfile } from '../../../../lib/firebaseAdmin';
import { redactText } from '../../../../lib/pii';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.split('Bearer ')[1];
  if (!token) return null;
  try { return await verifyIdToken(token); } catch { return null; }
}

const recruiterEmails = (process.env.RECRUITER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await ensureUserProfile(user.uid, user.email);
  const rec = getResume(params.id);
  if (!rec || rec.ownerUid !== user.uid) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const isRecruiter = recruiterEmails.includes((user.email || '').toLowerCase());
  return NextResponse.json({
    id: rec.id,
    filename: rec.filename,
    text: isRecruiter ? rec.text : redactText(rec.text, rec.pii),
    createdAt: rec.createdAt,
  });
}
