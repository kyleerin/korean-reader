# Korean Reader

[![License: Polyform Noncommercial](https://img.shields.io/badge/license-Polyform%20NC-blue)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/support-Ko--fi-FF5E5B?logo=ko-fi)](https://ko-fi.com/kyleerin)

A reading-immersion web app for Korean learners. Paste any Korean text, tap words for instant definitions and grammar breakdowns, mark what you know, and review with spaced repetition. Runs fully offline in the browser — no account required.

<img width="743" height="1335" alt="image" src="https://github.com/user-attachments/assets/928c9c7c-aa7b-4efd-90e3-46b63af6477c" />

## Features

- **Morphological analysis** — decomposes eojeols into stems, particles, and endings using [garu-ko](https://github.com/zerry-jin/garu-ko) (WASM, F1 93.7%)
- **Color-coded reading** — words colored by knowledge state: blue (new), amber (learning), grey (particles/endings), no highlight (known)
- **Tap to define** — tap any word to see its dictionary form, definitions, and POS tag
- **Live recoloring** — marking a word instantly recolors every occurrence in the current text
- **Spaced repetition** — LEARNING words become flashcards, scheduled by [FSRS](https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm)
- **Vocabulary downloads** — open **Download words** on the home or reading screen to save known or unknown vocabulary as a UTF-8 `.txt` file containing just a comma-separated list of dictionary forms (for example, `가다, 먹다, 밥`), each word listed once, with no header or extra columns. Unknown includes NEW and LEARNING; IGNORED words are excluded. Downloads include all vocabulary saved in this browser. Newly encountered vocabulary is saved automatically; unmarked words from texts read before this feature require reopening the text.
- **Offline-first** — dictionary and analyzer are bundled; works without a network connection after first load

## Getting started

```bash
npm install
```

Build the dictionary (downloads ~18 MB from Hugging Face, outputs `public/dictionary.ndjson`):

```bash
npm run build:dict
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), paste Korean text, and start reading.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run build:dict` | Download and convert the NIKL dictionary |
| `npm test` | Run the Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

## How the reading pipeline works

```
raw text
  → sentence segmentation
  → garu-ko WASM morphological analysis
      → morphemes + Sejong POS tags
  → for each content morpheme (noun / verb / adjective / adverb):
      → reconstruct dictionary form  (e.g. 먹었어요 → 먹다)
      → look up in bundled KO→EN dictionary
      → check knowledge state (keyed by lemma + POS)
      → assign color + tappable span
  → particles (조사) and endings (어미): rendered in grey, not tracked as vocab
```

Knowledge is tracked at the **lemma level**: knowing 먹다 counts whether the text shows 먹어요, 먹었어요, or 먹을.

## Dictionary

The bundled dictionary is sourced from the [NIKL Korean-English dictionary](https://huggingface.co/datasets/binjang/NIKL-korean-english-dictionary) (National Institute of Korean Language, MIT license). It contains ~47,000 entries with English definitions and usage examples.

## Project structure

```
src/
  analyzer/       garu-ko WASM adapter
  components/     React UI (ImportScreen, Reader, ReviewScreen, TapPanel)
  db/             EXPERIMENTAL SQLite WASM + schema (unused by App; future OPFS)
  dictionary/     DictionaryRepository — ndjson loader (+ experimental SQLite repo)
  domain/         Core types (KnowledgeState, PartOfSpeech, AnalyzedText, …)
  knowledge/      KnowledgeRepository — localStorage-backed word state
  pipeline/       ReadingPipeline — tokenizer, lemma reconstructor, analyzer quirks
  review/         ReviewRepository — FSRS card storage (localStorage)
  server/         DeepL translate proxy (+ body/rate/origin guards)
scripts/
  build-dictionary.ts   Downloads and converts the NIKL parquet file
tests/
  fakes/          In-memory test doubles (DbClient, analyzer, repos)
  pipeline/       Unit tests for tokenizer, classifier, reconstructor, pipeline
  db/             Integration tests for dictionary and knowledge repositories
```

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 |
| Build | Vite 6 + TypeScript |
| Morphological analysis | garu-ko (WASM) |
| Dictionary | NIKL KO→EN (ndjson) |
| Spaced repetition | FSRS via ts-fsrs |
| Persistence | localStorage (word states + review cards) |
| Tests | Vitest |

## Translation API

`POST /api/translate` forwards `{ text, apiKey }` to DeepL. Protections:

- Max JSON body **64 KB**; text capped at **12 000** characters
- Per-client sliding-window rate limit (**30**/minute, best-effort per process)
- Optional origin allowlist via `TRANSLATE_ALLOWED_ORIGINS` (comma-separated). **Unset = unrestricted** (convenient for local dev). Set this on deployed hosts, e.g. `https://your-app.vercel.app`.

Request bodies may contain the user’s DeepL key — handlers must not log them.

## Roadmap

- [ ] Plain-text file import (`.txt`)
- [ ] OPFS-backed SQLite for text history and token cache (scaffold in `src/db/`)
- [ ] PWA manifest + Service Worker (installable, offline)
- [ ] Text-to-speech (Web Speech API, `ko-KR`)
- [ ] EPUB import

## License

[Polyform Noncommercial 1.0.0](LICENSE) — free to use, fork, and modify for any non-commercial purpose. Commercial use is not permitted.

The bundled dictionary is derived from the [NIKL Korean-English dictionary](https://huggingface.co/datasets/binjang/NIKL-korean-english-dictionary), licensed MIT by the National Institute of Korean Language (국립국어원).
