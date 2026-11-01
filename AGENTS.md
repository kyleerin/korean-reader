# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Korean Reader is a React SPA with an optional translation API proxy. Reading/analysis is offline in the browser (`localStorage`). Full-text translation uses a DeepL API key saved in the browser (**Add DeepL key** in the header); the Node server forwards requests to DeepL (CORS proxy).

### Services

| Service | Command | URL |
|---|---|---|
| Vite dev server | `npm run dev` | http://localhost:5173 |
| Translation API | `npm run dev:api` | http://localhost:3001 |
| Both (recommended) | `npm run dev:full` | web + API |

Users enter their own DeepL API key in the UI (**Add DeepL key**); it is stored in `localStorage` only. Translation requests go to `POST /api/translate`:
- **Local dev:** Vite middleware (`npm run dev` / `npm run preview`)
- **Vercel:** `api/translate.ts` serverless function (`vercel.json` configures the Vite SPA build)
- **Optional:** standalone Node proxy via `npm run dev:api`

Proxy guards: 64 KB body cap, 30 req/min/client rate limit, optional `TRANSLATE_ALLOWED_ORIGINS` allowlist (comma-separated). Leave unset for local; set on deployed hosts. Do not log request bodies (they contain API keys).

`public/dictionary.ndjson` is pre-committed (~17 MB); `npm run build:dict` is only needed if rebuilding the dictionary from Hugging Face. SQLite/OPFS under `src/db/` is experimental and unused by `App`.

### Standard commands

See `README.md` and `package.json` for full details:

- **Install deps:** `npm install` (Node ≥ 20)
- **Dev server:** `npm run dev` (includes translation API)
- **Translation API only:** `npm run dev:api` (CORS proxy; no server env key needed)
- **Tests:** `npm test` (Vitest, no browser required)
- **Typecheck + production build:** `npm run build` (`tsc && vite build`)
- **Preview production build:** `npm run preview` → http://localhost:4173

There is no ESLint script; `tsc` during `npm run build` is the type-check gate.

### Dev server notes

- Start the dev server in a **tmux** session if it must stay running across commands (e.g. `vite-dev-server`).
- WASM assets (garu-ko analyzer) load from the dev server; morphological analysis requires a real browser with WASM support.
- First load may take a moment while the ~336 KB WASM module initializes.

### Hello-world smoke test

1. Open http://localhost:5173
2. Paste Korean text (e.g. `안녕하세요. 저는 한국어를 공부합니다.`)
3. Click **Read →**
4. Confirm color-coded words and tap a word for definitions

### Tests

All Vitest tests use in-memory fakes under `tests/fakes/` and do not require the dev server or browser (except `localStorage` in translation storage tests).
