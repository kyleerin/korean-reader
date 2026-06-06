# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Korean Reader is a React SPA with an optional Node API server. Reading/analysis is offline in the browser (`localStorage`). The API server provides email + password sign-in (SQLite) and optional DeepL full-text translation.

### Services

| Service | Command | URL |
|---|---|---|
| Vite dev server | `npm run dev` | http://localhost:5173 |
| API server | `npm run dev:api` | http://localhost:3001 |
| Web + API | `npm run dev:full` | Vite + API together |

Copy `.env.example` → `.env`. For sign-in set `SESSION_SECRET` (users are stored in SQLite at `DATABASE_PATH`, default `./data/korean-reader.db`). For translation, set `DEEPL_API_KEY`. Vite proxies `/api` → port 3001 in dev. API requests use cookies (`credentials: 'include'`).

`public/dictionary.ndjson` is pre-committed (~17 MB); `npm run build:dict` is only needed if rebuilding the dictionary from Hugging Face.

### Standard commands

See `README.md` and `package.json` for full details:

- **Install deps:** `npm install` (Node ≥ 20)
- **Dev server:** `npm run dev` or `npm run dev:full` (with AI translation)
- **API server only:** `npm run dev:api`
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

All 72 Vitest tests use in-memory fakes under `tests/fakes/` and do not require the dev server or browser.
