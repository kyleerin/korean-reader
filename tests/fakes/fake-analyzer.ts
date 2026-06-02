import type { MorphologicalAnalyzer, EojeolMorphemes } from '../../src/pipeline/analyzer';

export class FakeMorphologicalAnalyzer implements MorphologicalAnalyzer {
  constructor(
    private readonly responses: Map<string, EojeolMorphemes[]> = new Map()
  ) {}

  async analyze(sentence: string): Promise<EojeolMorphemes[]> {
    return this.responses.get(sentence) ?? [];
  }
}
