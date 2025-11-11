# Technical Design Document: CropSense

# CropSense — Technical Design Document (TDD)

**Version:** 1.0  
**Date:** 2025-11-11  
**Owner:** CropSense Team

---

## 1. One-sentence pitch
CropSense provides farmers concise, context-aware best-practice guidance by combining retrieval of trusted agricultural resources with generative explanations tailored to local conditions.

---

## 2. Goals & Scope (MVP)
**Primary goal (MVP):**
- Provide a lightweight, mobile-friendly web chat UI where authenticated users (farmers) can ask agriculture questions and receive grounded guidance with cited sources.

**MVP scope (keeps implementation simple for Cursor):**
- Frontend: React + Vite + Tailwind + shadcn/ui (components)
- Auth: Firebase Auth (email+password; social optional)
- Storage: Firestore for user profiles, conversations, and optional vector metadata
- Ingestion & RAG: Python ingestion package (local/Cloud Run) to extract, chunk, embed (Vertex Embeddings), and upsert to a vector store (Firestore for MVP; Vertex Index option documented)
- Query-time: Cloud Functions (Node) /lightweight tRPC handlers call Vertex for embeddings and Gemini for generation (or call via the Python microservice)
- Design tokens: Single canonical `design-tokens.json` used for Tailwind + component styling
- Tests: Vitest (frontend) + integration tests for ingestion (Python) + Playwright e2e (basic chat flow)

---

## 3. High-level Tech Stack (recommended)
- Frontend runtime: React + Vite (TypeScript)
- UI: Tailwind CSS + shadcn/ui (Radix primitives)
- State/data fetching: TanStack Query
- Forms & validation: React Hook Form + Zod
- Backend API: tRPC (Cloud Functions / Node)
- Authentication & hosting: Firebase (Auth, Hosting, Firestore, Storage, Functions)
- RAG/Ingestion service: Python package (packages/ingestion) using Vertex AI SDK (embeddings & generation)
- Vector store (MVP): Firestore `vectorChunks` collection; Prod: Vertex AI Vector Search / managed index
- CI/CD: GitHub Actions, Turborepo (optional) / PNPM workspaces
- Monitoring: Cloud Logging + optional Sentry
- Storybook + Vitest + Playwright for tests

---

## 4. Monorepo Layout (PNPM)

├── apps/
│ └── web/ ← React front-end (Vite, Tailwind, Storybook)
├── functions/ ← Node Cloud Functions (tRPC handlers)
├── packages/
│ ├── shared/ ← Zod schemas, TS types, utilities, design-tokens.json
│ ├── ingestion/ ← Python RAG ingestion & embedding scripts (simple CLI)
│ └── seeding/ ← data seeding helpers (JS/TS scripts)
├── docs/ ← TDD, guides, ADRs
└── .github/ ← CI workflows
```

**Planned Packages (Future Milestones):**

```
├── packages/
│   ├── ingestion/              ← (Milestone 3) RAG pipeline logic (chunking, embedding)
│   └── seeding/                ← (Milestone 5) Data-seeding helpers (Firestore emulator)
```

-----

Notes:
- `packages/ingestion` is a Python package (a simple CLI) — the rest of the monorepo is TypeScript.
- Keep Python tooling isolated (virtualenv / pyproject.toml) and call it from CI as a step.

---

## 5. RAG Design — Simplified Plan (MVP → Production)

### 5.1 Ingestion Flow (Python service; local/Cloud Run)
**Goal:** Turn trusted docs (PDF/manuals) into vector chunks.

1. Admin uploads document (PDF) to a designated Storage (Firebase Storage or Cloud Storage).
2. A simple Cloud Function (or manual trigger) notifies the ingestion service (or just place file into an `ingest/` folder for dev).
3. **Python ingestion** steps:
   - Extract text pages (pdfminer / PyMuPDF).
   - Clean & normalize text.
   - Chunk (e.g., chunk size 512 chars, 50 char overlap; configurable).
   - Create metadata per chunk: `documentId`, `source`, `page`, `chunkIndex`.
   - Request embeddings from Vertex AI Embeddings API (model: `text-embedding-005`) — batch where possible.
   - Upsert chunk docs to `vectorChunks` Firestore collection or to Vertex Index (for prod).
   - Optionally store original PDF in `gs://cropsense-corpus-prod`.

**Outputs:**
- `/vectorChunks/{chunkId}` documents containing `content`, `embedding`, `meta`.

### 5.2 Query-Time Flow (Cloud Functions / tRPC)
**Goal:** Answer user query with grounded text & citations.

1. User asks question in web UI.
2. Frontend calls `chat.sendMessage` tRPC procedure (Cloud Function).
3. The server:
   - Obtains the query text; optionally calls Vertex embedding to embed the query (or call Python microservice).
   - Performs nearest-neighbor search among `vectorChunks`:
     - MVP: load candidate embeddings and compute cosine similarity server-side (Firestore store) — small corpus only.
     - Prod: call Vertex AI Vector Search index for k-NN (preferred).
   - Build grounding context: top-k chunk texts + sources.
   - Call Vertex generative model (Gemini 2.5 Pro or equivalent) with a prompt that includes grounding context and instructions (concise, cite sources).
   - Return generated answer + list of cited sources to the client.
4. Client displays answer; each answer shows inline citations and a "Show Sources" panel with links to the source file and page excerpt.

**Latency targets (MVP)**
- Retrieval latency ≤ 2s (small corpus)
- Generation latency ≤ 3s (depends on model)

---

## 6. Data Model (Firestore)
**Collections:**
- `users/{uid}` → profile, roles
- `conversations/{conversationId}` → `userId`, `title`, `createdAt`
- `conversations/{conversationId}/messages/{messageId}` → `role`, `content`, `sources`, `createdAt`
- `vectorChunks/{chunkId}` → `documentId`, `source`, `pageNumber`, `chunkIndex`, `content`, `embedding`, `embeddingDim`

**Security**
- `vectorChunks` NOT readable from client (server-only).
- Users can read/write their `conversations` & `messages` only.
- Admin-only paths for ingestion.

---

## 7. API Design (tRPC — key procedures)
- `chat.sendMessage` — input: `{ query: string, conversationId?: string }` → output: `{ message, sources }`
- `chat.getHistory` — input: `{ conversationId }` → output: `messages[]`
- `conversation.list` — input: `void` → output: `Conversation[]`
- `conversation.create` — input: `title?` → output: `Conversation`
- `admin.triggerIngest` — input: `{ storagePath }` — protected

Implementation note: tRPC handlers run inside Firebase Functions; embedding/generated model calls can be proxied to Vertex via service account or call an internal ingestion microservice.

---

## 8. Minimal Implementation Plan (steps for Cursor)
1. Scaffold monorepo skeleton (PNPM + apps/web + functions + packages/shared + packages/ingestion)
2. Create `packages/shared/design-tokens.json` (provided below) and wire a minimal Tailwind config in `apps/web`
3. Implement frontend key components:
   - Navbar (Home / How it works / Login / Sign up CTA)
   - Hero (CTA to sign up / or start chat)
   - ChatPage with message list + input (uses placeholder chat API)
   - Footer (links)
4. Implement AuthContext (Firebase Auth)
5. Implement tRPC stub `chat.sendMessage` that returns a mocked "RAG style" response for dev
6. Add `packages/ingestion` Python CLI skeleton (extract → chunk → embed → upsert stub)
7. Add simple integration tests (Vitest) and Storybook stories for 3 key components
8. Add a basic GitHub Actions CI workflow (lint → test → build)

---

## 9. Testing & Validation
- Unit tests (Vitest) for React components and hooks
- Integration tests for tRPC stubs (node)
- Python unit tests for ingestion logic (pytest)
- Playwright: 1-2 E2E tests: sign up → ask question → see reply
- Accessibility checks in Storybook (a11y addon) and axe

---

## 10. CI/CD (minimum)
- `ci.yml` (on PR): pnpm install → lint → typecheck → test → build
- `deploy.yml` (on merge to main or on release): build apps/web → firebase deploy using service account or CLI token stored as GitHub secret

---

## 11. Security & Privacy
- Firestore rules: least privilege (examples in docs)
- Secrets via GitHub secrets and environment variables (T3 Env)
- Audit logging for ingestion operations
- Privacy note: answers are advisory; include disclaimers in footer

---

## 12. Observability & Ops
- Cloud Logging for functions
- Error reporting (Sentry or Crashlytics)
- Usage analytics (GA4 / PostHog)

---

## 13. Next steps / Prioritized tasks
**Phase A (1–3 days)** — Scaffold & MVP UI:
- create monorepo scaffold, design tokens, Tailwind config
- implement Navbar / Hero / Footer / ChatPage with stubbed chat endpoint
- wire Firebase Auth (dev env)
- Storybook + basic tests

**Phase B (3–7 days)** — RAG ingestion & query:
- implement Python ingestion skeleton
- wire Vertex embedding calls (dev key) in ingestion (optional: stub)
- implement `chat.sendMessage` calling ingestion/vertex or using mock for dev

**Phase C (7–14 days)** — Harden & deploy:
- implement Firestore security rules
- CI/CD workflows
- increase test coverage, E2E tests, performance optimizations

---

## 14. Appendix: Useful CLI commands
- `pnpm install`
- `cd apps/web && pnpm dev`
- `cd packages/ingestion && python -m venv .venv && pip install -r requirements.txt`
- `firebase emulators:start` (for local testing)

---

End of TDD
