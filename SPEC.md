# Korean Reading-Immersion App — Specification & Architecture

*Living spec — aligned with the current React + garu-ko + localStorage implementation.
Deferred / experimental items are marked explicitly.*

---

## 1. Vision

A reading-immersion app for learners of **Korean**. The user brings their own text (pasted today; file/EPUB later), reads it inside the app, and taps any unfamiliar word to get an instant definition plus a breakdown of its grammar. Every word the user has seen is tracked by knowledge state, so all text is colored to show what's new, what's being learned, and what's already known. Saved words flow into a spaced-repetition review deck. The app is **offline-first and device-local** — no account required to use it.

---

## 2. Locked decisions (current)

| Decision | Choice | Rationale |
|---|---|---|
| Target language | Korean only | Eliminates pluggable tokenizers and multi-dictionary management. |
| Platform | Web SPA (Vite + React 19); PWA deferred | Single codebase; installability via Service Worker is on the roadmap. |
| Morphological analysis | **On-device garu-ko WASM** | Fast taps, full offline reading; ships as an npm package with WASM assets. |
| Content source | User paste (file/EPUB deferred) | No licensing burden, no content pipeline. |
| Data location | **localStorage** for knowledge + review; in-memory ndjson dictionary | Simple, reliable v1. OPFS SQLite scaffolding exists under `src/db/` but is **experimental / unused**. |
| Optional network | DeepL translation via `/api/translate` CORS proxy | User-supplied API key in the browser; server never stores a shared DeepL secret. |

---

## 3. Core user loop

1. User pastes a text.
2. App analyzes it and renders it word-by-word, colored by knowledge state.
3. User taps an unknown word → dictionary form, definition, morphology breakdown.
4. User marks the word (*learning* / *known* / *ignore*); the text recolors live.
5. LEARNING words become FSRS review cards.
6. Optional: long-press / select text for grammar; Done marks remaining NEW as KNOWN; download known/unknown vocabulary as `.txt`.

---

## 4. The reading pipeline

```
raw text
  → paragraph / sentence segmentation
  → eojeol split (whitespace)
  → morphological analysis per sentence  [garu-ko WASM]
      → morphemes + Sejong-ish POS + surface
  → for each content morpheme:
      → reconstruct dictionary lemma (stem + 다, compound surface recovery)
      → look up lemma in bundled KO→EN dictionary (ndjson)
      → check user knowledge state (keyed by lemma + POS)
      → assign color + tappable span
  → particles (조사) & endings (어미): grey styling + grammar explainer — not tracked as vocab
  → render
```

**Knowledge is tracked at the lemma level**, not the surface level.

**Performance (today):** the whole pasted document is analyzed up front. Lazy per-page analysis and `token_cache` are deferred with the OPFS work.

**Analyzer quirks:** garu-ko sometimes mis-splits compounds (`들이민다`, `못한다기보단`, …). Recovery rules live in `src/pipeline/analyzer-quirks.ts` and are shared by lemma reconstruction, vocabulary filtering, and grammar breakdown.

> **Open decision — homographs.** `배` = pear / boat / stomach. Keying by `lemma + POS` is MVP; sense-level tracking later.

---

## 5. Data model (production vs experimental)

### Production (localStorage)

- **knowledge** (`korean-reader:knowledge`) — `lemma` + `pos` → `NEW | LEARNING | KNOWN | IGNORED`
- **review cards** (`korean-reader:review-cards`) — lemma, pos, definitions, FSRS fields via `ts-fsrs`
- **DeepL API key** (`korean-reader:deepl-api-key`) — browser-only
- **dictionary** — `public/dictionary.ndjson` loaded into in-memory Maps at startup (~17 MB)

### Experimental (unused by App) — `src/db/schema.ts`

SQLite tables for `dictionary_entry`, `user_word_state` (with `times_seen`), `text_doc`, `token_cache`, `review_card`, `review_log`. Kept for a future OPFS migration; do not treat as the live persistence layer.

---

## 6. Architecture

```
┌─────────────────────────────────────────────┐
│                 UI Layer                    │
│  React 19 — Import · Reader · Review · Tap  │
├─────────────────────────────────────────────┤
│              Application Layer              │
│  ReadingPipeline · FSRS (ts-fsrs)           │
│  selection / grammar breakdown              │
├─────────────────────────────────────────────┤
│              Data Layer                     │
│  NdjsonDictionary · LocalStorageKnowledge   │
│  LocalStorageReview                         │
│  (experimental SQLite repos unused by App)  │
├──────────────┬──────────────────────────────┤
│  WASM Module │  Optional network            │
│  garu-ko     │  POST /api/translate → DeepL │
└──────────────┴──────────────────────────────┘
```

**Translation proxy hardening:** body size cap, per-client rate limit, optional `TRANSLATE_ALLOWED_ORIGINS` allowlist. The proxy forwards the caller’s DeepL key and must not log request bodies.

---

## 7. Tooling choices

- **Analyzer:** garu-ko WASM (npm).
- **Dictionary (KO→EN):** NIKL Korean-English dictionary (MIT), shipped as ndjson.
- **SRS:** FSRS via `ts-fsrs`.
- **Persistence:** localStorage (v1). OPFS SQLite experimental.
- **Build:** Vite 6 + TypeScript. **Tests:** Vitest.
- **UI:** React 19.

---

## 8. Content import

- **Paste text** — current MVP entry point.
- **File / EPUB / URL import** — deferred (see README roadmap).

---

## 9. MVP status

**Shipped:**
- Korean paste → analyze → color-coded reader
- Tap-to-define + grammar selection / long-press
- Mark word status; live recoloring; Done action
- FSRS review of LEARNING words
- Vocabulary `.txt` downloads
- Optional DeepL full-text translation (user key)
- Offline reading/analysis after first load (no Service Worker yet — dictionary/WASM cached by the browser HTTP cache)

**Deferred:**
- Plain-text file + EPUB import
- OPFS SQLite (text history, token cache, times_seen)
- PWA manifest + Service Worker
- TTS (`ko-KR`)
- Account + cloud sync
- KO→KO dictionary

---

## 10. Risks

1. **garu-ko mis-parses** — mitigated by shared quirk rules; expect ongoing special cases.
2. **Dictionary cold start** — full ndjson into JS heap; surface a visible warning if load fails.
3. **Translation proxy abuse** — set `TRANSLATE_ALLOWED_ORIGINS` in production; rate limits are best-effort per instance.
4. **localStorage durability / size** — fine for vocabulary-scale data; not ideal for full text history (OPFS later).
5. **Homograph / sense disambiguation** — lemma+POS only.

---

## 11. Suggested next build sequence

1. Origin allowlist + monitoring for deployed `/api/translate`.
2. Plain-text file import.
3. OPFS SQLite for text history + token_cache (replace or wrap localStorage).
4. PWA + Service Worker for true offline install.
5. TTS and EPUB.
