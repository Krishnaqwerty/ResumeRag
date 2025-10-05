// Gemini embedding API
async function embedGemini(text: string, dim = 768): Promise<Embedding> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');
  // Gemini API endpoint for text embedding (update if Google changes)
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedText?key=' + apiKey;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  const data = await res.json();
  if (!data.embedding || !Array.isArray(data.embedding.values)) throw new Error('Invalid Gemini response');
  return data.embedding.values as Embedding;
}

export async function embed(text: string, dim?: number): Promise<Embedding> {
  const provider = process.env.EMBEDDING_PROVIDER || 'deterministic';
  if (provider === 'gemini') return await embedGemini(text, dim);
  return embedDeterministic(text, dim);
}
import crypto from 'crypto';

export type Embedding = number[];

// Deterministic fake embedding (for offline dev) based on SHA256 hash -> floats
export function embedDeterministic(text: string, dim = 384): Embedding {
  const hash = crypto.createHash('sha256').update(text).digest();
  const out: number[] = [];
  for (let i = 0; i < dim; i++) {
    const byte = hash[i % hash.length];
    // map byte 0..255 -> -1..1
    out.push((byte / 255) * 2 - 1);
  }
  return out;
}

export function cosine(a: Embedding, b: Embedding): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}
