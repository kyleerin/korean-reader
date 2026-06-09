import { describe, expect, it, beforeEach } from 'vitest';
import { ReadingPipeline } from '../../src/pipeline/reading-pipeline';
import { FakeMorphologicalAnalyzer } from '../fakes/fake-analyzer';
import { InMemoryDictionaryRepository } from '../fakes/in-memory-dictionary';
import { InMemoryKnowledgeRepository } from '../fakes/in-memory-knowledge';
import { contentMorphemes, hasNewWords, isFullyKnown, totalEojeols, uniqueContentWords, vocabularyMorphemes } from '../../src/domain/model';
import type { EojeolMorphemes } from '../../src/pipeline/analyzer';

/**
 * Integration test for ReadingPipeline.
 *
 * Sentence under test — "나는 밥을 먹었어요." — breaks down as:
 *   나는     → 나(NP) + 는(JX)
 *   밥을     → 밥(NN) + 을(JKO)
 *   먹었어요. → 먹(VV) + 었(EP) + 어요(EF) + .(SF)
 */

const SENTENCE = '나는 밥을 먹었어요.';

const FAKE_ANALYSIS: EojeolMorphemes[] = [
  { surface: '나는',     morphemes: [{ surface: '나', pos: 'NP' }, { surface: '는', pos: 'JX' }] },
  { surface: '밥을',     morphemes: [{ surface: '밥', pos: 'NN' }, { surface: '을', pos: 'JKO' }] },
  { surface: '먹었어요.', morphemes: [{ surface: '먹', pos: 'VV' }, { surface: '었', pos: 'EP' }, { surface: '어요', pos: 'EF' }, { surface: '.', pos: 'SF' }] },
];

const DICTIONARY = new InMemoryDictionaryRepository([
  [['나',  'NP'],  { lemma: '나',  pos: 'NP',  definitions: ['I, me'] }],
  [['밥',  'NN'],  { lemma: '밥',  pos: 'NN',  definitions: ['cooked rice, meal'] }],
  [['먹다', 'VV'], { lemma: '먹다', pos: 'VV', definitions: ['to eat'] }],
]);

describe('ReadingPipeline', () => {
  let knowledge: InMemoryKnowledgeRepository;
  let pipeline: ReadingPipeline;

  beforeEach(() => {
    knowledge = new InMemoryKnowledgeRepository();
    pipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[SENTENCE, FAKE_ANALYSIS]])),
      DICTIONARY,
      knowledge,
    );
  });

  // ── Structure ──────────────────────────────────────────────────────────────

  it('produces one sentence', async () => {
    const result = await pipeline.analyze(SENTENCE);
    expect(result.sentences).toHaveLength(1);
  });

  it('preserves the original sentence surface', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.surface).toBe(SENTENCE);
  });

  it('produces three eojeols', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols).toHaveLength(3);
  });

  // ── Lemma reconstruction ───────────────────────────────────────────────────

  it('noun lemma is unchanged', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const na = contentMorphemes(sentences[0]!.eojeols[0]!)[0]!;
    expect(na.lemma).toBe('나');
  });

  it('verb lemma gets 다 suffix', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const eat = contentMorphemes(sentences[0]!.eojeols[2]!)[0]!;
    expect(eat.lemma).toBe('먹다');
  });

  it('resolves native numeral determiner 두 via NR lemma 둘 when MM is missing', async () => {
    const sentence = '아몬드를 두 개 가지고 있다.';
    const analysis: EojeolMorphemes[] = [
      { surface: '아몬드를', morphemes: [{ surface: '아몬드', pos: 'NN' }, { surface: '를', pos: 'JKO' }] },
      { surface: '두', morphemes: [{ surface: '두', pos: 'MM' }] },
      { surface: '개', morphemes: [{ surface: '개', pos: 'NNB' }] },
      { surface: '가지고', morphemes: [{ surface: '가지', pos: 'VV' }, { surface: '고', pos: 'EC' }] },
      { surface: '있다.', morphemes: [{ surface: '있', pos: 'VX' }, { surface: '다', pos: 'EF' }, { surface: '.', pos: 'SF' }] },
    ];
    const dict = new InMemoryDictionaryRepository([
      [['둘', 'NR'], { lemma: '둘', pos: 'NR', definitions: ['two'], examples: ['자식이 둘이다.'] }],
    ]);
    const numeralPipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[sentence, analysis]])),
      dict,
      knowledge,
    );
    const { sentences } = await numeralPipeline.analyze(sentence);
    const two = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(two.surface).toBe('두');
    expect(two.lemma).toBe('두');
    expect(two.definitions).toEqual(['two']);
  });

  it('falls back from VX to VV for auxiliary verbs like 보다', async () => {
    const sentence = '느껴 본다.';
    const analysis: EojeolMorphemes[] = [
      { surface: '느껴', morphemes: [{ surface: '느끼', pos: 'VV' }, { surface: '어', pos: 'EC' }] },
      { surface: '본다.', morphemes: [{ surface: '보', pos: 'VX' }, { surface: 'ㄴ다', pos: 'EF' }, { surface: '.', pos: 'SF' }] },
    ];
    const dict = new InMemoryDictionaryRepository([
      [['느끼다', 'VV'], { lemma: '느끼다', pos: 'VV', definitions: ['to feel'] }],
      [['보다', 'VV'], { lemma: '보다', pos: 'VV', definitions: ['to see; to try doing'] }],
    ]);
    const auxPipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[sentence, analysis]])),
      dict,
      knowledge,
    );
    const { sentences } = await auxPipeline.analyze(sentence);
    const see = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(see.pos).toBe('VX');
    expect(see.lemma).toBe('보다');
    expect(see.definitions).toEqual(['to see; to try doing']);
  });

  it('resolves 들이민다 to 들이밀다 when the analyzer mis-splits the compound verb', async () => {
    const sentence = '코를 들이민다.';
    const analysis: EojeolMorphemes[] = [
      { surface: '코를', morphemes: [{ surface: '코', pos: 'NN' }, { surface: '를', pos: 'JKO' }] },
      {
        surface: '들이민다.',
        morphemes: [
          { surface: '들', pos: 'VV' },
          { surface: 'ㄹ', pos: 'ETM' },
          { surface: '이민', pos: 'NN' },
          { surface: '이', pos: 'VCP' },
          { surface: '다', pos: 'EF' },
          { surface: '.', pos: 'SF' },
        ],
      },
    ];
    const dict = new InMemoryDictionaryRepository([
      [['코', 'NN'], { lemma: '코', pos: 'NN', definitions: ['nose'], examples: ['코가 높다.'] }],
      [['들다', 'VV'], { lemma: '들다', pos: 'VV', definitions: ['to enter'] }],
      [['들이밀다', 'VV'], { lemma: '들이밀다', pos: 'VV', definitions: ['to thrust in'], examples: ['얼굴을 들이밀다.'] }],
    ]);
    const thrustPipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[sentence, analysis]])),
      dict,
      knowledge,
    );
    const { sentences } = await thrustPipeline.analyze(sentence);
    const thrust = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(thrust.lemma).toBe('들이밀다');
    expect(thrust.definitions).toEqual(['to thrust in']);
    expect(thrust.examples).toEqual(['얼굴을 들이밀다.']);
  });

  it('resolves epenthetic 으 stems to the dictionary lemma', async () => {
    const flySentence = '햇빛이 날아든다.';
    const flyAnalysis: EojeolMorphemes[] = [
      { surface: '햇빛이', morphemes: [{ surface: '햇빛', pos: 'NN' }, { surface: '이', pos: 'JKS' }] },
      { surface: '날아든다.', morphemes: [{ surface: '날으', pos: 'VV' }, { surface: '어', pos: 'EC' }, { surface: '든', pos: 'JX' }, { surface: '.', pos: 'SF' }] },
    ];
    const dict = new InMemoryDictionaryRepository([
      [['날다', 'VV'], { lemma: '날다', pos: 'VV', definitions: ['To move from one location to another in the air.'] }],
      [['햇빛', 'NN'], { lemma: '햇빛', pos: 'NN', definitions: ['Light from the sun.'] }],
    ]);
    const flyPipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[flySentence, flyAnalysis]])),
      dict,
      knowledge,
    );
    const { sentences } = await flyPipeline.analyze(flySentence);
    const fly = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(fly.lemma).toBe('날다');
    expect(fly.definitions[0]).toContain('air');
  });

  // ── MorphemeType classification ────────────────────────────────────────────

  it('pronoun is CONTENT', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[0]!.morphemes[0]!.type).toBe('CONTENT');
  });

  it('auxiliary particle 는 is PARTICLE', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[0]!.morphemes[1]!.type).toBe('PARTICLE');
  });

  it('object particle 을 is PARTICLE', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[1]!.morphemes[1]!.type).toBe('PARTICLE');
  });

  it('pre-final ending 었 is ENDING', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[2]!.morphemes[1]!.type).toBe('ENDING');
  });

  it('final ending 어요 is ENDING', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[2]!.morphemes[2]!.type).toBe('ENDING');
  });

  it('period is PUNCTUATION', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[2]!.morphemes[3]!.type).toBe('PUNCTUATION');
  });

  // ── Dictionary lookup ──────────────────────────────────────────────────────

  it('attaches definition to noun 밥', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const rice = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(rice.definitions).toEqual(['cooked rice, meal']);
  });

  it('attaches definition to verb 먹다', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const eat = contentMorphemes(sentences[0]!.eojeols[2]!)[0]!;
    expect(eat.definitions).toEqual(['to eat']);
  });

  it('particle has no definitions', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(sentences[0]!.eojeols[0]!.morphemes[1]!.definitions).toHaveLength(0);
  });

  // ── Knowledge state ────────────────────────────────────────────────────────

  it('all content words are NEW by default', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const allContent = sentences.flatMap(s => s.eojeols.flatMap(e => contentMorphemes(e)));
    expect(allContent.every(m => m.state === 'NEW')).toBe(true);
  });

  it('reflects KNOWN state set before analysis', async () => {
    await knowledge.setState('밥', 'NN', 'KNOWN');
    const { sentences } = await pipeline.analyze(SENTENCE);
    const rice = contentMorphemes(sentences[0]!.eojeols[1]!)[0]!;
    expect(rice.state).toBe('KNOWN');
  });

  it('reflects LEARNING state set before analysis', async () => {
    await knowledge.setState('먹다', 'VV', 'LEARNING');
    const { sentences } = await pipeline.analyze(SENTENCE);
    const eat = contentMorphemes(sentences[0]!.eojeols[2]!)[0]!;
    expect(eat.state).toBe('LEARNING');
  });

  it('does not treat garu-ko suffix artifacts in 어딘가가 as new vocabulary', async () => {
    const sentence = '어딘가가 고장 났다.';
    const analysis: EojeolMorphemes[] = [
      {
        surface: '어딘가가',
        morphemes: [
          { surface: '어디', pos: 'NP' },
          { surface: 'ㄴ', pos: 'JX' },
          { surface: '가가', pos: 'NNP' },
        ],
      },
      { surface: '고장', morphemes: [{ surface: '고장', pos: 'NN' }] },
      { surface: '났다.', morphemes: [{ surface: '나', pos: 'VV' }, { surface: '았', pos: 'EP' }, { surface: '다', pos: 'EF' }, { surface: '.', pos: 'SF' }] },
    ];
    const dict = new InMemoryDictionaryRepository([
      [['어디', 'NP'], { lemma: '어디', pos: 'NP', definitions: ['where'] }],
    ]);
    await knowledge.setState('어디', 'NP', 'KNOWN');
    const artifactPipeline = new ReadingPipeline(
      new FakeMorphologicalAnalyzer(new Map([[sentence, analysis]])),
      dict,
      knowledge,
    );
    const { sentences } = await artifactPipeline.analyze(sentence);
    const somewhere = sentences[0]!.eojeols[0]!;
    expect(vocabularyMorphemes(somewhere).map(m => m.lemma)).toEqual(['어디']);
    expect(hasNewWords(somewhere)).toBe(false);
    expect(isFullyKnown(somewhere)).toBe(true);
  });

  // ── Eojeol helpers ─────────────────────────────────────────────────────────

  it('eojeol with all new words reports hasNewWords=true', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(hasNewWords(sentences[0]!.eojeols[0]!)).toBe(true);
  });

  it('eojeol whose content word is KNOWN reports isFullyKnown=true', async () => {
    await knowledge.setState('나', 'NP', 'KNOWN');
    const { sentences } = await pipeline.analyze(SENTENCE);
    expect(isFullyKnown(sentences[0]!.eojeols[0]!)).toBe(true);
  });

  // ── Conjugation context ────────────────────────────────────────────────────

  it('content morpheme carries full eojeol context', async () => {
    const { sentences } = await pipeline.analyze(SENTENCE);
    const eat = contentMorphemes(sentences[0]!.eojeols[2]!)[0]!;
    // context = [먹(VV), 었(EP), 어요(EF), .(SF)]
    expect(eat.eojeolContext).toHaveLength(4);
    expect(eat.eojeolContext[0]!.pos).toBe('VV');
    expect(eat.eojeolContext[1]!.pos).toBe('EP');
    expect(eat.eojeolContext[2]!.pos).toBe('EF');
  });

  // ── Aggregate helpers ──────────────────────────────────────────────────────

  it('totalEojeols counts all eojeols', async () => {
    const result = await pipeline.analyze(SENTENCE);
    expect(totalEojeols(result)).toBe(3);
  });

  it('uniqueContentWords counts distinct lemma+pos pairs', async () => {
    // 나(NP), 밥(NN), 먹다(VV) → 3
    const result = await pipeline.analyze(SENTENCE);
    expect(uniqueContentWords(result)).toBe(3);
  });
});
