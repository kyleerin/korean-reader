# Korean Reading-Immersion App — Specification & Architecture

*Draft v0.1 — solo-developer build. Locked decisions and open questions are marked inline.*

---

## 1. Vision

A reading-immersion app for learners of **Korean**. The user brings their own text (pasted, or imported from a file), reads it inside the app, and taps any unfamiliar word to get an instant definition plus a breakdown of its grammar. Every word the user has seen is tracked by knowledge state, so all text is colored to show what's new, what's being learned, and what's already known. Saved words flow into a spaced-repetition review deck. The app is **offline-first and device-local** — no account required to use it.

## 2. Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| Target language | Korean only | Eliminates pluggable tokenizers, multi-dictionary management, language-switcher UI. |
| Platforms | iOS + Android via **Kotlin Multiplatform (KMP)** | One shared codebase for logic; near-native on each platform. |
| Morphological analysis | **On-device** (mecab-ko) | Fast taps, full offline reading, no per-tap network round-trip. |
| Content source | **User import** (paste / file) | No licensing burden, no content pipeline, no backend needed for v1. |
| Data location | **Local-first**, device-local for v1 | Server only becomes necessary for cross-device sync, which is deferred. |

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
  → morphological analysis per eojeol  [mecab-ko, on-device]
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

**Performance:** never analyze a whole book at once. Analyze lazily per page/screen and cache the result in the local DB so re-opening a text is instant.

**Korean-specific win:** the analyzer already returns the particle/ending breakdown for free. Surface that as a tap-time explainer (`먹었어요 → 먹다 + past + polite`) and color particles distinctly. Particles and endings are exactly where Korean learners struggle, so this is high-value for low extra cost.

> **Open decision — homographs.** `배` = pear / boat / stomach. Keying knowledge state by `lemma + POS` handles most cases but not full sense disambiguation. *Recommendation: accept lemma+POS for MVP; revisit sense-level tracking later.*

---

## 5. Data model

Local SQLite via **SQLDelight** (KMP-native, type-safe, shared schema).

- **dictionary_entry** *(bundled, read-only)* — `lemma`, `pos`, `definitions` (KO→EN), `examples?`, `frequency_rank?`
- **user_word_state** — `lemma`, `pos`, `status` (NEW / LEARNING / KNOWN / IGNORED), `first_seen`, `last_seen`, `times_seen`
- **text** *(imported docs)* — `id`, `title`, `source_type` (paste / file), `content`, `created_at`, `last_read_position`
- **token_cache** *(perf)* — `text_id`, `offset`, `serialized_analysis` — avoids re-analyzing
- **review_card** — `lemma`, `pos`, `example_sentence` (captured when saved), FSRS fields: `stability`, `difficulty`, `due_date`, `reps`, `lapses`
- **review_log** — `card_id`, `rating`, `reviewed_at` (kept for later FSRS optimization)

---

## 6. Architecture (KMP layering)

**Shared (`commonMain`, pure Kotlin) — most of the app:**
- Domain models, reading-pipeline orchestration
- Knowledge-state logic
- SRS scheduler (**FSRS** — modern choice over SM-2)
- Repository layer + SQLDelight database
- Dictionary lookup
- Analyzer *interface* via `expect`/`actual`

**Platform-specific (`androidMain` / `iosMain`):**
- **mecab-ko binding** (the `actual` analyzer) — C++ via JNI on Android, C++ bridged through Obj-C/Swift on iOS
- TTS wrapper (native `ko-KR` voices ship on both OSes — word/sentence audio is essentially free)
- File-import pickers
- UI

> **Open decision — UI sharing.** *Option A:* **Compose Multiplatform** shares even the reader view across both platforms (max reuse; iOS support is newer/riskier). *Option B:* native UI — Compose on Android, SwiftUI on iOS (lower risk, double the UI work). Logic is shared either way. *Recommendation for a solo dev: try Compose Multiplatform; it's the biggest reuse lever for the reader screen.*

> **Highest-risk component: on-device mecab-ko across both platforms.** mecab-ko is C++ and the dictionary (`mecab-ko-dic`, tens of MB) ships as a bundled binary asset. The native bridging is the single trickiest piece of the whole project — **spike it before committing to anything else** (see build sequence).

---

## 7. Tooling choices

- **Analyzer:** mecab-ko + mecab-ko-dic (best quality/perf balance). Alternatives if needed: Komoran, Okt, Khaiii.
- **Dictionary (KO→EN):** open datasets such as KEngDic and Wiktionary extracts. Optionally Urimalsaem (국립국어원) for KO→KO definitions for advanced learners. *Verify each source's license before bundling.*
- **Script:** Hangul is left-to-right, phonetic — no furigana or RTL handling. Offer an optional **Revised Romanization** toggle for beginners.
- **SRS:** FSRS (well-documented; port or implement the algorithm).
- **DB:** SQLDelight. **TTS:** native platform voices.

---

## 8. Content import (user-import model)

- **Paste text** — trivial; the MVP entry point.
- **EPUB import** — parse EPUB (zip + XHTML), strip to plain-text chapters. Use a Kotlin EPUB parser or a minimal custom one.
- **URL import** *(deferred)* — fetch the page (no CORS issue on native HTTP) then run a Readability-style extractor to get clean article text. Client-side keeps you backend-free.

Because the user supplies their own content, there is **no redistribution and no licensing exposure** — ideal for a solo v1.

---

## 9. MVP scope

**In:**
- Korean only
- Paste + EPUB import
- On-device analyzer + bundled KO→EN dictionary
- Tap-to-define with lemma lookup **and** conjugation/particle breakdown
- Mark word status; live-recoloring reading view
- FSRS review of saved words
- Fully offline, device-local (no account)

**Deferred:**
- URL import
- Account + cloud sync across devices
- Audio sentence-mining / clip capture
- Statistics dashboard
- KO→KO dictionary
- Any second language

---

## 10. Risks & open decisions (summary)

1. **On-device mecab-ko bridging on both platforms** — highest risk. De-risk first.
2. **Compose Multiplatform vs native UI** — decide by appetite for bleeding-edge (§6).
3. **Homograph / sense disambiguation** — lemma+POS for MVP (§4).
4. **Dictionary licensing** — verify each dataset before shipping (§7).
5. **Large-text performance** — lazy per-page analysis + token caching (§4).

---

## 11. Suggested build sequence (de-risk hardest-first)

1. **Spike the analyzer.** Get mecab-ko analyzing one Korean sentence on *both* Android and iOS from shared KMP code. This is the make-or-break technical bet — prove it before anything else.
2. **Dictionary + lookup.** Bundle the dictionary; prove tap → dictionary-form → definition on a hardcoded text.
3. **Persistence + rendering.** SQLDelight schema, word-state save/load, colored tappable reading view.
4. **Import.** Paste first, then EPUB.
5. **Review mode.** FSRS scheduler + review UI over saved words.
6. **Polish.** Romanization toggle, particle/conjugation explainer, TTS.
