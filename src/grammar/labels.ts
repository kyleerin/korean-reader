import type { PartOfSpeech } from '../domain/model';

export function posKind(pos: PartOfSpeech): 'content' | 'particle' | 'ending' | 'affix' | 'skip' {
  if (['JKS', 'JKC', 'JKG', 'JKO', 'JKB', 'JKV', 'JKQ', 'JX', 'JC', 'VCP', 'VCN'].includes(pos)) return 'particle';
  if (['EP', 'EF', 'EC', 'ETN', 'ETM'].includes(pos)) return 'ending';
  if (['XPN', 'XSN', 'XSV', 'XSA', 'XR'].includes(pos)) return 'affix';
  if (['SF', 'SP', 'SS', 'SE', 'SO', 'SW', 'SL', 'SH', 'SN', 'UNKNOWN'].includes(pos)) return 'skip';
  return 'content';
}

export function morphemeLabel(surface: string, pos: PartOfSpeech): string {
  switch (pos) {
    case 'EP':
      if (surface === '었' || surface === '았') return 'past tense';
      if (surface === '시') return 'honorific';
      if (surface === '겠') return 'intention';
      return 'verb ending';
    case 'EF':
      if (surface === '습니다' || surface === 'ㅂ니다') return 'formal speech';
      if (['어요', '아요', '여요'].includes(surface)) return 'polite speech';
      if (['어', '아', '여'].includes(surface)) return 'informal speech';
      if (surface === '다') return 'plain statement';
      if (['냐', '니', '나'].includes(surface)) return 'question';
      if (surface === '자') return "let's";
      if (['라', '아라', '어라'].includes(surface)) return 'command';
      return 'sentence ending';
    case 'EC':
      if (surface === '고') return 'and / while';
      if (['서', '아서', '어서'].includes(surface)) return 'so / because';
      if (['면', '으면'].includes(surface)) return 'if / when';
      if (surface === '지만') return 'but';
      if (['니까', '으니까'].includes(surface)) return 'because';
      if (surface === '거나') return 'or';
      if (['며', '으며'].includes(surface)) return 'while / and';
      if (['러', '으러'].includes(surface)) return 'in order to';
      if (['려', '으려'].includes(surface)) return 'intending to';
      if (surface === '게') return 'so that';
      if (surface === '도') return 'even if';
      if (surface === '지') return 'negation';
      return 'connective';
    case 'ETM':
      if (['ㄴ', '은'].includes(surface)) return 'past modifier';
      if (surface === '는') return 'present modifier';
      if (['ㄹ', '을'].includes(surface)) return 'future modifier';
      return 'modifier';
    case 'ETN': return 'nominalizer';
    case 'JKS': return 'subject marker';
    case 'JKO': return 'object marker';
    case 'JKC': return 'complement';
    case 'JKG': return 'possessive';
    case 'JKV': return 'vocative';
    case 'JKQ': return 'quotation';
    case 'JKB':
      if (surface === '에') return 'at / to';
      if (surface === '에서') return 'at / from';
      if (['로', '으로'].includes(surface)) return 'by / toward';
      if (['와', '과', '랑', '이랑'].includes(surface)) return 'with';
      if (['한테', '에게'].includes(surface)) return 'to (person)';
      if (['한테서', '에게서'].includes(surface)) return 'from (person)';
      return 'adverbial';
    case 'JX':
      if (['은', '는'].includes(surface)) return 'topic marker';
      if (surface === '도') return 'also';
      if (surface === '만') return 'only';
      if (['조차', '마저'].includes(surface)) return 'even';
      if (surface === '부터') return 'from';
      if (surface === '까지') return 'until';
      return 'particle';
    case 'JC': return 'and';
    case 'VCP': return 'copula (is)';
    case 'VCN': return 'copula (is not)';
    case 'XSV': return '→ verb';
    case 'XSA': return '→ adjective';
    case 'XSN': return '→ noun';
    default: return pos.toLowerCase();
  }
}
