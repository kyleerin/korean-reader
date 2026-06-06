# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

Korean Reader is a React SPA with an optional translation API. Reading/analysis is offline in the browser (`localStorage`); AI full-text translation calls `POST /api/translate` on a small Node server.

### Services

| Service | Command | URL |
|---|---|---|
| Vite dev server | `npm run dev` | http://localhost:5173 |
| Translation API | `npm run dev:api` | http://localhost:3001 |
| Both (recommended) | `npm run dev:full` | web + API |

Set `DEEPL_API_KEY` in `.env` (copy from `.env.example`) before starting the translation API. Vite proxies `/api` → port 3001 in dev.

`public/dictionary.ndjson` is pre-committed (~17 MB); `npm run build:dict` is only needed if rebuilding the dictionary from Hugging Face.

### Standard commands

See `README.md` and `package.json` for full details:

- **Install deps:** `npm install` (Node ≥ 20)
- **Dev server:** `npm run dev` or `npm run dev:full` (with AI translation)
- **Translation API only:** `npm run dev:api` (requires `DEEPL_API_KEY`)
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
