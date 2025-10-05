import { NextRequest, NextResponse } from 'next/server';
import { matchJob, getJob, getResume } from '../../../../../lib/store';
import { z } from 'zod';
import { verifyIdToken, ensureUserProfile } from '../../../../../lib/firebaseAdmin';
import { redactText } from '../../../../../lib/pii';

async function getUser(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.split('Bearer ')[1];
  if (!token) return null;
  try { return await verifyIdToken(token); } catch { return null; }
}
const recruiterEmails = (process.env.RECRUITER_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await ensureUserProfile(user.uid, user.email);
  const job = getJob(params.id);
  if (!job || job.ownerUid !== user.uid) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const schema = z.object({ top_n: z.number().int().min(1).max(50).optional() });
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'invalid_body', details: parsed.error.flatten() }, { status: 400 });
  const { top_n = 5 } = parsed.data;
  const ranked = matchJob(job.id, top_n);
  const isRecruiter = recruiterEmails.includes((user.email || '').toLowerCase());
  const withEvidence = ranked.map(r => {
    const resume = getResume(r.id)!;
    const missing = job.requirements.filter(req => !resume.text.toLowerCase().includes(req.toLowerCase()));
    return {
      resume_id: r.id,
      score: r.score,
      missing_requirements: missing,
      snippet: isRecruiter ? resume.text.slice(0, 400) : redactText(resume.text.slice(0,400), resume.pii)
    };
  });
  return NextResponse.json({ job_id: job.id, matches: withEvidence });
}
