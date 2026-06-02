# Korean Reading-Immersion App — Specification & Architecture

*Draft v0.2 — solo-developer build. Locked decisions and open questions are marked inline.*
*v0.2 change: platform target changed from iOS + Android (KMP) to Web (PWA, TypeScript).*

---

## 1. Vision

A reading-immersion app for learners of **Korean**. The user brings their own text (pasted, or imported from a file), reads it inside the app, and taps any unfamiliar word to get an instant definition plus a breakdown of its grammar. Every word the user has seen is tracked by knowledge state, so all text is colored to show what's new, what's being learned, and what's already known. Saved words flow into a spaced-repetition review deck. The app is **offline-first and device-local** — no account required to use it.

## 2. Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Target language | Korean only | Eliminates pluggable tokenizers, multi-dictionary management, language-switcher UI. |
| Platform | **Web (PWA)** — TypeScript | Single codebase, runs in any modern browser, installable on iOS and Android without App Store friction. Lower technical bar than native KMP. |
| Morphological analysis | **On-device** (mecab-ko compiled to **WebAssembly**) | Fast taps, full offline reading, no per-tap network round-trip. Emscripten build is more tractable than iOS/Android native interop. |
| Content source | **User import** (paste / file) | No licensing burden, no content pipeline, no backend needed for v1. |
| Data location | **Browser-local** (OPFS-backed SQLite) for v1 | Server only becomes necessary for cross-device sync, which is deferred. |

## 3. Core user loop

1. User imports a text (paste or file).
2. App analyzes it and renders it word-by-word, colored by the user's knowledge state.
3. User taps an unknown word → sees dictionary form, definition, and morphology breakdown.
4. User marks the word (e.g. *learning* / *known* / *ignore*); the text recolors live.
5. Saved words become review cards scheduled by spaced repetition.
6. Comprehension grows; the colored-text feedback makes progress visible.

This loop *is* the product. Everything below serves it.

---

## 4. The reading pipeline (the heart of the app)

Korean is **agglutinative**: the unit between spaces (an *eojeol*) bundles a content word with particles and endings, and verbs/adjectives conjugate heavily. The surface form rarely matches the dictionary form — tapping `먹었어요` must resolve to `먹다` before any lookup. **Lemmatization is mandatory, not optional**; it's the spine of the engine.

```
raw text
  → sentence segmentation (punctuation-based)
  → eojeol split (whitespace)
  → morphological analysis per eojeol  [mecab-ko WASM, on-device]
      → morphemes + part-of-speech + lemma
  → for each content morpheme (noun / verb stem / adjective / adverb):
      → reconstruct dictionary form (e.g. verb stem + 다)
      → look up lemma in bundled dictionary
      → check user knowledge state (keyed by lemma + POS)
      → assign color + tappable span
  → particles (조사) & endings (어미): tag, style distinctly, explain — not tracked as vocab
  → render
```

**Knowledge is tracked at the lemma level**, not the surface level: knowing `먹다` counts whether the text shows `먹어요` or `먹었어요`.

**Performance:** never analyze a whole text at once. Analyze lazily per page/screen and cache the result in the local DB so re-opening a text is instant. The WASM module is loaded once at startup and kept alive; individual `analyze()` calls are fast synchronous calls into WASM memory.

**Korean-specific win:** the analyzer already returns the particle/ending breakdown for free. Surface that as a tap-time explainer (`먹었어요 → 먹다 + past + polite`) and color particles distinctly. Particles and endings are exactly where Korean learners struggle, so this is high-value for low extra cost.

> **Open decision — homographs.** `배` = pear / boat / stomach. Keying knowledge state by `lemma + POS` handles most cases but not full sense disambiguation. *Recommendation: accept lemma+POS for MVP; revisit sense-level tracking later.*

---

## 5. Data model

Browser-local SQLite via **wa-sqlite** (OPFS backend — persistent, fast, available in all modern browsers).

- **dictionary_entry** *(bundled, read-only)* — `lemma`, `pos`, `definitions` (KO→EN), `examples?`, `frequency_rank?`
- **user_word_state** — `lemma`, `pos`, `status` (NEW / LEARNING / KNOWN / IGNORED), `first_seen`, `last_seen`, `times_seen`
- **text** *(imported docs)* — `id`, `title`, `source_type` (paste / file), `content`, `created_at`, `last_read_position`
- **token_cache** *(perf)* — `text_id`, `offset`, `serialized_analysis` — avoids re-analyzing
- **review_card** — `lemma`, `pos`, `example_sentence` (captured when saved), FSRS fields: `stability`, `difficulty`, `due_date`, `reps`, `lapses`
- **review_log** — `card_id`, `rating`, `reviewed_at` (kept for later FSRS optimization)

The bundled dictionary is loaded into the SQLite DB on first launch (or shipped as a pre-populated `.sqlite` file served as a static asset and copied into OPFS).

---

## 6. Architecture (web layering)

```
┌─────────────────────────────────────────────┐
│                 UI Layer                    │
│  (Svelte or React — TBD, see open decision) │
│  Reader view · Tap panel · Review deck      │
├─────────────────────────────────────────────┤
│              Application Layer              │
│  ReadingPipeline · KnowledgeService         │
│  ImportService · ReviewScheduler (FSRS)     │
├─────────────────────────────────────────────┤
│              Data Layer                     │
│  DictionaryRepository · KnowledgeRepository │
│  TextRepository · ReviewRepository          │
│  wa-sqlite (OPFS) + token_cache             │
├──────────────┬──────────────────────────────┤
│  WASM Module │  Web Platform APIs           │
│  mecab-ko    │  File API · Web Speech API   │
│  (Emscripten)│  Service Worker (offline)    │
└──────────────┴──────────────────────────────┘
```

**WASM analyzer module:**
- mecab-ko C++ compiled via Emscripten to `mecab.wasm` + `mecab.js` glue
- mecab-ko-dic binary dictionary bundled as a static asset, mounted into WASM's virtual FS at startup
- Exposes a single `analyze(sentence: string): MorphemeResult[]` function
- Loaded once in a Web Worker to avoid blocking the main thread

**Service Worker:**
- Caches all static assets (app shell, WASM, dictionary) on install
- App is fully usable offline after first load

> **Open decision — UI framework.** *Option A:* **Svelte** — minimal bundle size, less boilerplate, good fit for a document-heavy app. *Option B:* **React** — broader ecosystem, more familiar to most developers. Both work equally well for this app. *Recommendation: Svelte if you want a leaner build; React if you want more library options.*

---

## 7. Tooling choices

- **Analyzer:** mecab-ko compiled to WASM via **Emscripten**. Alternatives if WASM build proves too difficult: a pure-JS Korean tokenizer (lower quality) or a small server-side analysis endpoint.
- **Dictionary (KO→EN):** open datasets such as KEngDic and Wiktionary extracts. Optionally Urimalsaem (국립국어원) for KO→KO definitions for advanced learners. *Verify each source's license before bundling.*
- **Script:** Hangul is left-to-right, phonetic — no furigana or RTL handling. Offer an optional **Revised Romanization** toggle for beginners.
- **SRS:** FSRS (well-documented; implement in TypeScript).
- **DB:** wa-sqlite (OPFS). **TTS:** Web Speech API (`ko-KR` voice — ships on Chrome, Safari, Firefox).
- **Build:** Vite. **Language:** TypeScript throughout.

---

## 8. Content import (user-import model)

- **Paste text** — trivial; the MVP entry point. Textarea → pipeline.
- **File import** — File API (`<input type="file">` or drag-and-drop). Plain `.txt` immediately. EPUB next (zip + XHTML, strip to plain text).
- **URL import** *(deferred)* — `fetch` the page then run a Readability-style extractor. No CORS issue if proxied, or use the Readability library client-side on the raw HTML.

Because the user supplies their own content, there is **no redistribution and no licensing exposure** — ideal for a solo v1.

---

## 9. MVP scope

**In:**
- Korean only
- Paste + plain-text file import
- On-device mecab-ko (WASM) + bundled KO→EN dictionary
- Tap-to-define with lemma lookup **and** conjugation/particle breakdown
- Mark word status; live-recoloring reading view
- FSRS review of saved words
- Fully offline after first load (Service Worker + OPFS)
- PWA manifest (installable on desktop/mobile)

**Deferred:**
- EPUB import
- URL import
- Account + cloud sync across devices
- Statistics dashboard
- KO→KO dictionary
- Any second language

---

## 10. Risks & open decisions (summary)

1. **mecab-ko WASM build** — still the highest-risk piece. Emscripten compilation of mecab-ko C++ plus bundling mecab-ko-dic into WASM virtual FS. Prior art exists (Japanese MeCab has been Emscripten-compiled); plan to adapt that work. De-risk first.
2. **OPFS browser support** — broadly available (Chrome, Firefox, Safari 16.4+). Edge case: Safari on iOS has had OPFS quirks. Test early.
3. **Dictionary bundle size** — mecab-ko-dic compiled is tens of MB. Must be loaded into WASM virtual FS at startup; needs a loading state and possibly lazy loading.
4. **UI framework choice** — Svelte vs React (§6).
5. **Homograph / sense disambiguation** — lemma+POS for MVP (§4).
6. **Dictionary licensing** — verify each dataset before shipping (§7).

---

## 11. Suggested build sequence (de-risk hardest-first)

1. **Spike the analyzer.** Compile mecab-ko to WASM with Emscripten, load mecab-ko-dic, and analyze one Korean sentence in the browser console. This is the make-or-break technical bet — prove it before anything else.
2. **Dictionary + lookup.** Load the KO→EN dictionary into wa-sqlite (OPFS); prove tap → dictionary-form → definition on a hardcoded text rendered in the browser.
3. **Persistence + rendering.** Full wa-sqlite schema, word-state save/load, colored tappable reading view with live recoloring.
4. **Import.** Paste first, then plain-text file upload.
5. **Review mode.** FSRS scheduler (TypeScript) + review UI over saved words.
6. **PWA + polish.** Service Worker for offline, PWA manifest, Romanization toggle, particle/conjugation explainer panel, TTS via Web Speech API.
