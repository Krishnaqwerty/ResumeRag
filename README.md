# ResumeRAG

ResumeRAG is a small reference implementation of a resum\u00e9 ingestion + retrieval augmented matching system. It supports:

- Multi-file & ZIP bulk resum\u00e9 upload
- Parsing (PDF/DOCX/TXT) -> normalized plain text
- Chunking + embedding (deterministic ordering with seeded RNG)
- Semantic search + QA with snippet evidence
- Job creation + candidate matching with evidence & gaps
- PII redaction for non-recruiter users
- Firebase Authentication + isolated per-user data history

## Pages

- `/upload` : Upload single/multiple or ZIP
- `/search` : Query across your accessible resum\u00e9 index
- `/jobs` : Create + list jobs
- `/candidates/:id` : Candidate detail (redacted conditionally)

## API Endpoints (Initial Spec)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/resumes | Multipart upload (pdf, docx, txt, zip) |
| GET | /api/resumes?limit=&offset=&q= | List + optional basic filter/search |
| GET | /api/resumes/:id | Resume detail (with conditional PII) |
| POST | /api/ask | Body: { query, k } -> answer + evidence snippets |
| POST | /api/jobs | Create a job with structured requirements |
| GET | /api/jobs/:id | Fetch job detail |
| POST | /api/jobs/:id/match | Body: { top_n } deterministic ranking |

## Data Model (Logical)

- resumes: { id, ownerUid, originalFilename, mime, text, chunks:[{id, embedding, start, end}], pii: {emails:[], phones:[], names:[]}, createdAt }
- jobs: { id, ownerUid, title, description, requirements:[string], embedding(optional aggregate), createdAt }
- matches (derived, not stored long-term unless cached)
- userProfiles: { uid, email, role, createdAt, lastActiveAt }
- searchHistory: { id, uid, query, createdAt }
- askHistory: { id, uid, query, answer, usedResumeIds:[id], createdAt }

## Deterministic Ranking

We seed: chunk ordering -> embedding insertion order -> tie-break by stable hash (id). Provide `DETERMINISTIC_SEED` to force stable pseudo-randomness when sorting near-ties.

## Redaction

If request user not recruiter: redact email, phone, address, full name tokens replaced with `[REDACTED]` except first name initial.

## Firebase Auth

Client uses Firebase Auth (Email/Password or OAuth provider you enable). Server routes verify ID token via `Authorization: Bearer <token>` or session cookie.

## Local Development

1. Copy `.env.example` to `.env.local` and fill values.
2. Install deps

```bash
pnpm install # or npm install
npm run dev
```

## Deploying on Netlify

1. Push repository to GitHub.
2. In Netlify: New Site from Git, select your repo.
3. Build command: `npm run build` (or `pnpm build`), Publish directory: `.next`
4. Add environment variables from `.env.example` (do NOT include quotes around multi-line private key; escape newlines as `\n` or paste actual new lines in UI).
5. Enable the Next.js plugin automatically (present via `@netlify/plugin-nextjs`).

### Required Environment Variables (minimum)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
RECRUITER_EMAILS
DETERMINISTIC_SEED
```

## Production Hardening TODO

- Replace in-memory store with Firestore or a Vector DB (e.g., Pinecone, pgvector) for persistence.
- Add auth middleware instead of duplicating token verification.
- Add logging + structured metrics (e.g., pino + OpenTelemetry).
- Add unit/integration tests & CI pipeline.
- Add rate limiting & input sanitation for large uploads.
- Improve PII detection using an NLP library.


## Embeddings

Swappable provider abstraction in `lib/embeddings.ts`. For now implement a simple deterministic fake embedding (hash -> vector) so system works without external API; can later swap to OpenAI or local.

## Next Steps

- Implement storage (SQLite via better-sqlite3 for prototype) + optional Firestore sync.
- Implement parsing pipeline.
- Implement endpoints.
- Add page components.
- Add basic tests.

---
License: MIT
