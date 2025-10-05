import { embedDeterministic, cosine } from './embeddings';
import { extractPII } from './pii';

export interface ResumeChunk { id: string; start: number; end: number; embedding: number[]; text: string; }
export interface ResumeRecord {
  id: string;
  ownerUid: string;
  filename: string;
  mime: string;
  text: string;
  chunks: ResumeChunk[];
  pii: { emails: string[]; phones: string[]; names: string[] };
  createdAt: number;
}

export interface JobRecord {
  id: string;
  ownerUid: string;
  title: string;
  description: string;
  requirements: string[];
  createdAt: number;
}

const resumes: ResumeRecord[] = [];
const jobs: JobRecord[] = [];

// Deterministic incremental IDs (stable ordering for tie-breaks)
let resumeCounter = 0;
let jobCounter = 0;
function stableId(prefix: string) {
  if (prefix === 'res') return `${prefix}_${resumeCounter++}`;
  if (prefix === 'job') return `${prefix}_${jobCounter++}`;
  return `${prefix}_${Date.now()}`; // fallback
}

export function addResume(ownerUid: string, filename: string, mime: string, text: string): ResumeRecord {
  const id = stableId('res');
  const pii = extractPII(text);
  const chunks = chunkText(text).map(c => ({ ...c, embedding: embedDeterministic(c.text) }));
  const rec: ResumeRecord = { id, ownerUid, filename, mime, text, chunks, pii, createdAt: Date.now() };
  resumes.push(rec);
  return rec;
}

export function listResumes(ownerUid: string, q: string | undefined, limit: number, offset: number) {
  let filtered = resumes.filter(r => r.ownerUid === ownerUid);
  if (q) filtered = filtered.filter(r => r.text.toLowerCase().includes(q.toLowerCase()));
  const total = filtered.length;
  return { total, items: filtered.slice(offset, offset + limit) };
}

export function getResume(id: string) { return resumes.find(r => r.id === id); }

export function addJob(ownerUid: string, title: string, description: string, requirements: string[]): JobRecord {
  const job: JobRecord = { id: stableId('job'), ownerUid, title, description, requirements, createdAt: Date.now() };
  jobs.push(job);
  return job;
}
export function getJob(id: string) { return jobs.find(j => j.id === id); }

export function matchJob(jobId: string, topN: number) {
  const job = getJob(jobId);
  if (!job) return [];
  const reqEmbeddings = job.requirements.map(r => embedDeterministic(r));
  const scored = resumes.map(r => {
    const score = r.chunks.reduce((acc, c) => {
      const maxReq = Math.max(...reqEmbeddings.map(e => cosine(c.embedding, e)));
      return Math.max(acc, maxReq);
    }, 0);
    return { resume: r, score };
  }).sort((a,b) => b.score - a.score || a.resume.id.localeCompare(b.resume.id));
  return scored.slice(0, topN).map(s => ({ id: s.resume.id, score: s.score }));
}

export function ask(query: string, k: number) {
  const qEmbed = embedDeterministic(query);
  const allChunks = resumes.flatMap(r => r.chunks.map(c => ({ resumeId: r.id, chunk: c })));
  const ranked = allChunks.map(c => ({ ...c, sim: cosine(qEmbed, c.chunk.embedding) }))
    .sort((a,b) => b.sim - a.sim || a.chunk.id.localeCompare(b.chunk.id))
    .slice(0, k);
  return ranked.map(r => ({ resume_id: r.resumeId, text: r.chunk.text, score: r.sim }));
}

function chunkText(text: string, maxLen = 800) {
  const parts: { id: string; start: number; end: number; text: string }[] = [];
  let idx = 0; let counter = 0;
  while (idx < text.length) {
    const slice = text.slice(idx, idx + maxLen);
    parts.push({ id: 'c' + counter++, start: idx, end: idx + slice.length, text: slice });
    idx += maxLen;
  }
  return parts;
}
