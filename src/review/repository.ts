import type { Card } from 'ts-fsrs';
import type { PartOfSpeech } from '../domain/model';

export interface ReviewCard {
  readonly lemma: string;
  readonly pos: PartOfSpeech;
  readonly definitions: readonly string[];
  readonly examples?: readonly string[];
  readonly fsrs: Card;
}

export interface ReviewRepository {
  getDue(now: Date): Promise<ReviewCard[]>;
  countDue(now: Date): Promise<number>;
  ensureCard(lemma: string, pos: PartOfSpeech, definitions: readonly string[], examples?: readonly string[]): Promise<void>;
  saveCard(card: ReviewCard): Promise<void>;
  deleteCard(lemma: string, pos: PartOfSpeech): Promise<void>;
}
