/**
 * Downloads the NIKL Korean-English dictionary from Hugging Face and converts
 * it to the NDJSON format expected by loadDictionary().
 *
 * Source: binjang/NIKL-korean-english-dictionary (MIT license)
 * Original: National Institute of Korean Language (국립국어원)
 *
 * Run: npm run build:dict
 * Output: public/dictionary.ndjson
 */

import { writeFileSync, mkdirSync, createWriteStream, unlinkSync } from 'fs';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ParquetReader } from '@dsnp/parquetjs';

const PARQUET_URL =
  'https://huggingface.co/datasets/binjang/NIKL-korean-english-dictionary' +
  '/resolve/refs%2Fconvert%2Fparquet/default/train/0000.parquet';
const TMP_FILE = '/tmp/nikl-dict.parquet';
const OUTPUT = 'public/dictionary.ndjson';

// Maps Korean POS names (NIKL) to mecab-ko POS tags (our pipeline).
// Particles, endings, and affixes are excluded — not tracked as learner vocab.
const POS_MAP: Record<string, string> = {
  '명사':    'NN',
  '고유명사': 'NNP',
  '의존명사': 'NNB',
  '대명사':  'NP',
  '수사':    'NR',
  '동사':    'VV',
  '형용사':  'VA',
  '보조동사': 'VX',
  '보조용언': 'VX',
  '부사':    'MAG',
  '접속부사': 'MAJ',
  '관형사':  'MM',
  '감탄사':  'IC',
};

/**
 * Parses a Python repr string like "['def 1', 'def 2']" into a string array.
 * The NIKL dataset stores list fields as Python repr rather than JSON.
 *
 * Handles:
 * - Single-quoted items: ['a', 'b']
 * - Double-quoted items (Python uses " when item contains '): ["it's", 'b']
 * - Escaped quotes: ['it\'s', "say \"hi\""]
 */
function parsePythonList(raw: unknown): string[] {
  if (!raw || raw === 'None' || raw === '[]' || raw === "['']") return [];
  const s = String(raw).trim();

  try {
    const parsed = JSON.parse(s) as unknown;
    if (Array.isArray(parsed)) return (parsed as unknown[]).filter(Boolean).map(String);
  } catch { /* fall through */ }

  if (!s.startsWith('[')) return s ? [s] : [];

  const inner = s.slice(1, -1);
  const results: string[] = [];
  let i = 0;

  while (i < inner.length) {
    while (i < inner.length && (inner[i] === ',' || inner[i] === ' ')) i++;
    if (i >= inner.length) break;

    const quote = inner[i];
    if (quote === "'" || quote === '"') {
      i++;
      let item = '';
      while (i < inner.length) {
        if (inner[i] === '\\' && i + 1 < inner.length) {
          item += inner[i + 1]; i += 2;
        } else if (inner[i] === quote) {
          i++; break;
        } else {
          item += inner[i++];
        }
      }
      const clean = item.trim();
      if (clean) results.push(clean);
    } else if (inner[i] === '[') {
      // Nested list (dialogue pair in Usages) — skip.
      let depth = 1; i++;
      while (i < inner.length && depth > 0) {
        if (inner[i] === '[') depth++;
        else if (inner[i] === ']') depth--;
        i++;
      }
    } else {
      i++;
    }
  }

  return repairApostropheSplits(results);
}

/**
 * After parsing a Python repr list, some items are split by unescaped apostrophes:
 *   "For one's attention" → ["For one", "s attention..."]
 *
 * Heuristic: if an item starts with a contraction suffix (s, t, re, ve, d, ll, m)
 * followed by a space or end-of-string, merge it with the previous item.
 */
function repairApostropheSplits(items: string[]): string[] {
  const CONTRACTION = /^(s|t|re|ve|d|ll|m|n)(\s|$)/;
  const result: string[] = [];
  for (const item of items) {
    if (result.length > 0 && CONTRACTION.test(item)) {
      result[result.length - 1] += "'" + item;
    } else {
      result.push(item);
    }
  }
  // Remove residual junk: lone commas, empty, or very short fragments.
  return result.filter(d => d.trim().length > 3 && d !== ',');
}

async function downloadParquet(): Promise<void> {
  console.log(`Downloading parquet (~18 MB)…`);
  const res = await fetch(PARQUET_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const dest = createWriteStream(TMP_FILE);
  // @ts-expect-error – Node 18 ReadableStream → Node stream
  await pipeline(res.body, dest);
  console.log('Download complete.');
}

async function main(): Promise<void> {
  mkdirSync('public', { recursive: true });

  await downloadParquet();

  console.log('Parsing parquet…');
  const reader = await ParquetReader.openFile(TMP_FILE);
  const cursor = reader.getCursor();

  const lines: string[] = [];
  let skippedNoPos = 0;
  let skippedNoEn  = 0;

  let row: Record<string, unknown> | null;
  while ((row = await cursor.next() as Record<string, unknown> | null)) {
    const pos = POS_MAP[String(row['Part of Speech'] ?? '')];
    if (!pos) { skippedNoPos++; continue; }

    const lemma = String(row['Form'] ?? '').trim();
    if (!lemma) continue;

    const definitions = parsePythonList(row['English Definition']);
    if (definitions.length === 0) { skippedNoEn++; continue; }

    const examples = parsePythonList(row['Usages']).slice(0, 3);

    lines.push(JSON.stringify({
      lemma,
      pos,
      definitions,
      ...(examples.length > 0 && { examples }),
    }));
  }

  await reader.close();
  unlinkSync(TMP_FILE);

  writeFileSync(OUTPUT, lines.join('\n') + '\n', 'utf8');
  const kb = Math.round(lines.join('\n').length / 1024);
  console.log(`\nWrote ${lines.length} entries → ${OUTPUT} (${kb} KB)`);
  console.log(`Skipped: ${skippedNoPos} no-POS-map, ${skippedNoEn} no-EN-def`);
}

main().catch(err => { console.error(err); process.exit(1); });
