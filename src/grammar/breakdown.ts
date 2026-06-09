import type { AnalyzedEojeol, AnalyzedMorpheme } from '../domain/model';
import { isAnalyzerArtifactMorpheme } from '../domain/model';
import { morphemeLabel, posKind } from './labels';

export interface BreakdownItem {
  display: string;
  label?: string;
}

export function buildEojeolBreakdown(eojeol: AnalyzedEojeol): BreakdownItem[] | null {
  if (eojeol.morphemes.some(m => isAnalyzerArtifactMorpheme(eojeol.surface, m))) {
    return null;
  }

  const items: BreakdownItem[] = [];
  let hasGrammatical = false;

  for (const m of eojeol.morphemes) {
    const kind = posKind(m.pos);
    if (kind === 'skip') continue;

    if (kind === 'content') {
      const display = m.type === 'CONTENT' ? m.lemma : m.surface;
      items.push({ display });
    } else {
      hasGrammatical = true;
      items.push({ display: m.surface, label: morphemeLabel(m.surface, m.pos) });
    }
  }

  if (items.length <= 1) return null;
  return hasGrammatical ? items : null;
}

export function explainBreakdown(items: BreakdownItem[]): string {
  const parts = items.map(item => (
    item.label ? `${item.display} (${item.label})` : item.display
  ));
  return `This form combines ${parts.join(', ')}.`;
}

export function buildMorphemeBreakdown(morpheme: AnalyzedMorpheme): BreakdownItem[] | null {
  if (morpheme.eojeolContext.some(m => m.surface === '이민' && m.pos === 'NN')) {
    return null;
  }
  if (
    morpheme.eojeolContext.some(m => m.surface === '못' && m.pos === 'MAG')
    && morpheme.eojeolContext.some(m => m.surface === '기보' && m.pos === 'NN')
    && morpheme.eojeolContext.some(m => m.surface === '단' && m.pos === 'NN')
  ) {
    return null;
  }

  if (morpheme.eojeolContext.length === 0) return null;
  const items: BreakdownItem[] = [];
  let usedSelf = false;
  let hasGrammatical = false;

  for (const m of morpheme.eojeolContext) {
    const kind = posKind(m.pos);
    if (kind === 'skip') continue;

    const isSelf = !usedSelf && m.surface === morpheme.surface && m.pos === morpheme.pos;
    if (isSelf) {
      usedSelf = true;
      items.push({ display: kind === 'content' ? morpheme.lemma : m.surface });
    } else if (kind === 'content') {
      items.push({ display: m.surface });
    } else {
      hasGrammatical = true;
      items.push({ display: m.surface, label: morphemeLabel(m.surface, m.pos) });
    }
  }

  return hasGrammatical && items.length > 1 ? items : null;
}
