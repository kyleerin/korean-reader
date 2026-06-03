import { createEmptyCard } from 'ts-fsrs';
import type { Card } from 'ts-fsrs';
import type { PartOfSpeech } from '../domain/model';
import type { ReviewCard, ReviewRepository } from './repository';

const LS_KEY = 'korean-reader:review-cards';

// Serialized form — Date objects converted to ISO strings
interface StoredCard {
  lemma: string;
  pos: string;
  definitions: string[];
  examples?: string[];
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  learning_steps: number;
  state: number;
  last_review?: string;
}

function toFsrs(s: StoredCard): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    reps: s.reps,
    lapses: s.lapses,
    learning_steps: s.learning_steps,
    state: s.state as Card['state'],
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

function fromReviewCard(card: ReviewCard): StoredCard {
  return {
    lemma: card.lemma,
    pos: card.pos,
    definitions: [...card.definitions],
    examples: card.examples ? [...card.examples] : undefined,
    due: card.fsrs.due.toISOString(),
    stability: card.fsrs.stability,
    difficulty: card.fsrs.difficulty,
    elapsed_days: card.fsrs.elapsed_days,
    scheduled_days: card.fsrs.scheduled_days,
    reps: card.fsrs.reps,
    lapses: card.fsrs.lapses,
    learning_steps: card.fsrs.learning_steps,
    state: card.fsrs.state,
    last_review: card.fsrs.last_review?.toISOString(),
  };
}

export class LocalStorageReviewRepository implements ReviewRepository {
  private store: Map<string, StoredCard>;

  constructor() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      const parsed = raw ? (JSON.parse(raw) as [string, StoredCard][]) : [];
      this.store = new Map(parsed);
    } catch {
      this.store = new Map();
    }
  }

  private key(lemma: string, pos: PartOfSpeech): string {
    return `${lemma}\x00${pos}`;
  }

  private persist(): void {
    localStorage.setItem(LS_KEY, JSON.stringify([...this.store]));
  }

  private all(): ReviewCard[] {
    return [...this.store.values()].map(s => ({
      lemma: s.lemma,
      pos: s.pos as PartOfSpeech,
      definitions: s.definitions,
      examples: s.examples,
      fsrs: toFsrs(s),
    }));
  }

  async getDue(now: Date): Promise<ReviewCard[]> {
    return this.all()
      .filter(c => c.fsrs.due <= now)
      .sort((a, b) => a.fsrs.due.getTime() - b.fsrs.due.getTime());
  }

  async countDue(now: Date): Promise<number> {
    return this.all().filter(c => c.fsrs.due <= now).length;
  }

  async ensureCard(lemma: string, pos: PartOfSpeech, definitions: readonly string[], examples?: readonly string[]): Promise<void> {
    const k = this.key(lemma, pos);
    if (this.store.has(k)) return;
    const newCard: ReviewCard = {
      lemma,
      pos,
      definitions,
      examples,
      fsrs: createEmptyCard(),
    };
    this.store.set(k, fromReviewCard(newCard));
    this.persist();
  }

  async saveCard(card: ReviewCard): Promise<void> {
    this.store.set(this.key(card.lemma, card.pos), fromReviewCard(card));
    this.persist();
  }

  async deleteCard(lemma: string, pos: PartOfSpeech): Promise<void> {
    this.store.delete(this.key(lemma, pos));
    this.persist();
  }
}
