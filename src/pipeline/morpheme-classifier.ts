import type { MorphemeType, PartOfSpeech } from '../domain/model';

/** Maps a MeCab-ko POS tag to the pipeline's morpheme type. */
export function classifyMorpheme(pos: PartOfSpeech): MorphemeType {
  switch (pos) {
    case 'NN': case 'NNP': case 'NNB': case 'NP': case 'NR':
    case 'VV': case 'VA': case 'VX':
    case 'MM': case 'MAG': case 'MAJ': case 'IC': case 'XR':
      return 'CONTENT';

    case 'JKS': case 'JKC': case 'JKG': case 'JKO':
    case 'JKB': case 'JKV': case 'JKQ': case 'JX': case 'JC':
    case 'VCP': case 'VCN':
      return 'PARTICLE';

    case 'EP': case 'EF': case 'EC': case 'ETN': case 'ETM':
      return 'ENDING';

    case 'XPN': case 'XSN': case 'XSV': case 'XSA':
      return 'AFFIX';

    case 'SF': case 'SP': case 'SS': case 'SE': case 'SO': case 'SW':
      return 'PUNCTUATION';

    case 'SL': case 'SH': case 'SN':
      return 'FOREIGN';

    default:
      return 'UNKNOWN';
  }
}
