import { Garu } from 'garu-ko';
import type { EojeolMorphemes, MorphologicalAnalyzer } from '../pipeline/analyzer';
import { posFromTag } from '../domain/model';
import type { PartOfSpeech } from '../domain/model';

function mapTag(sejongTag: string): PartOfSpeech {
  // garu-ko uses NNG for common nouns; our domain uses NN to match the NIKL dictionary
  if (sejongTag === 'NNG') return 'NN';
  return posFromTag(sejongTag);
}

export class GaruKoAnalyzer implements MorphologicalAnalyzer {
  private constructor(private readonly garu: Garu) {}

  static async load(): Promise<GaruKoAnalyzer> {
    const garu = await Garu.load();
    return new GaruKoAnalyzer(garu);
  }

  async analyze(sentence: string): Promise<EojeolMorphemes[]> {
    const raw = this.garu.analyze(sentence);
    const { tokens } = Array.isArray(raw) ? raw[0]! : raw;

    // Group morphemes by eojeol — tokens from the same space-delimited chunk
    // share the same `start` character offset in the sentence string.
    const byStart = new Map<number, { end: number; morphemes: { surface: string; pos: PartOfSpeech }[] }>();

    for (const token of tokens) {
      let bucket = byStart.get(token.start);
      if (!bucket) {
        bucket = { end: token.end, morphemes: [] };
        byStart.set(token.start, bucket);
      }
      bucket.morphemes.push({ surface: token.text, pos: mapTag(token.pos) });
    }

    return [...byStart.entries()]
      .sort(([a], [b]) => a - b)
      .map(([start, { end, morphemes }]) => ({
        surface: sentence.slice(start, end),
        morphemes,
      }));
  }

  destroy(): void {
    this.garu.destroy();
  }
}
