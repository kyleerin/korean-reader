import { useEffect, useState } from 'react';
import { AppHeader } from './AppHeader';
import { fsrs, Rating, State } from 'ts-fsrs';
import type { Grade } from 'ts-fsrs';
import type { ReviewCard } from '../review/repository';
import type { ReviewRepository } from '../review/repository';

interface Props {
  reviewRepo: ReviewRepository;
  onBack: () => void;
}

const scheduler = fsrs();

const RATING_CONFIG: { rating: Grade; label: string; bg: string }[] = [
  { rating: Rating.Again, label: 'Again', bg: '#ef4444' },
  { rating: Rating.Hard,  label: 'Hard',  bg: '#f59e0b' },
  { rating: Rating.Good,  label: 'Good',  bg: '#22c55e' },
  { rating: Rating.Easy,  label: 'Easy',  bg: '#3b82f6' },
];

function formatInterval(due: Date, now: Date): string {
  const ms = due.getTime() - now.getTime();
  if (ms <= 0) return 'now';
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(ms / 86_400_000)}d`;
}

export function ReviewScreen({ reviewRepo, onBack }: Props) {
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [current, setCurrent] = useState<ReviewCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    reviewRepo.getDue(new Date()).then(cards => {
      setQueue(cards);
      setCurrent(cards[0] ?? null);
      setLoading(false);
    });
  }, [reviewRepo]);

  async function handleRate(rating: Grade) {
    if (!current) return;
    const now = new Date();
    const { card: nextCard } = scheduler.next(current.fsrs, now, rating);
    const updated: ReviewCard = { ...current, fsrs: nextCard };
    await reviewRepo.saveCard(updated);

    setReviewed(r => r + 1);

    setQueue(prev => {
      const rest = prev.slice(1);
      // If still in learning/relearning and due within 15 min, put back at end
      const soonMs = 15 * 60 * 1000;
      if (
        (nextCard.state === State.Learning || nextCard.state === State.Relearning) &&
        nextCard.due.getTime() - now.getTime() <= soonMs
      ) {
        const next = [...rest, updated];
        setCurrent(next[0] ?? null);
        return next;
      }
      setCurrent(rest[0] ?? null);
      return rest;
    });

    setRevealed(false);
    setEditing(false);
  }

  function startEdit() {
    if (!current) return;
    setDraft(current.definitions.join('\n'));
    setEditing(true);
  }

  async function saveEdit() {
    if (!current) return;
    const definitions = draft.split('\n').map(d => d.trim()).filter(Boolean);
    const updated: ReviewCard = { ...current, definitions };
    await reviewRepo.saveCard(updated);
    setCurrent(updated);
    setQueue(prev => prev.map(c =>
      c.lemma === updated.lemma && c.pos === updated.pos ? updated : c,
    ));
    setEditing(false);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );
  }

  if (!current) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', flex: 1 }}>
        <p style={{ fontSize: '1.1rem' }}>
          {reviewed > 0 ? `Session complete — ${reviewed} card${reviewed === 1 ? '' : 's'} reviewed.` : 'Nothing due right now.'}
        </p>
        <button onClick={onBack} style={{ background: 'var(--color-new)', color: '#fff' }}>
          ← Back
        </button>
      </div>
    );
  }

  const now = new Date();
  const preview = scheduler.repeat(current.fsrs, now);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>

      <AppHeader
        left={(
          <>
            <button onClick={onBack} style={{ background: 'transparent', color: 'var(--color-text-muted)', padding: '0.25rem 0.5rem' }}>
              ← Back
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {reviewed} done · {queue.length} left
            </span>
          </>
        )}
      />

      {/* Card */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '1.5rem',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid var(--color-border)',
      }}>
        {/* Front */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            {current.lemma}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {current.pos}
            {current.fsrs.reps > 0 && (
              <span style={{ marginLeft: '0.5rem' }}>
                · reviewed {current.fsrs.reps}×
              </span>
            )}
          </div>
        </div>

        {/* Back */}
        {revealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={Math.max(3, draft.split('\n').length)}
                  autoFocus
                  placeholder="One definition per line"
                  style={{
                    width: '100%',
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flex: 1 }}>
                    One definition per line.
                  </span>
                  <button onClick={() => setEditing(false)} style={{ background: 'transparent', color: 'var(--color-text-muted)' }}>
                    Cancel
                  </button>
                  <button onClick={saveEdit} style={{ background: 'var(--color-new)', color: '#fff' }}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {current.definitions.length > 0 ? (
                  <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {current.definitions.slice(0, 3).map((def, i) => (
                      <li key={i} style={{ fontSize: '1rem' }}>{def}</li>
                    ))}
                  </ol>
                ) : (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    No definition found in dictionary.
                  </p>
                )}
                {current.examples && current.examples.length > 0 && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {current.examples[0]}
                  </p>
                )}
                <button
                  onClick={startEdit}
                  style={{ alignSelf: 'flex-start', background: 'transparent', color: 'var(--color-text-muted)', fontSize: '0.8rem', padding: '0.25rem 0' }}
                >
                  ✎ Edit definition
                </button>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            style={{ background: 'var(--color-border)', color: 'var(--color-text)', padding: '0.75rem', fontSize: '1rem', borderRadius: '8px' }}
          >
            Show answer
          </button>
        )}
      </div>

      {/* Rating buttons */}
      {revealed && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {RATING_CONFIG.map(({ rating, label, bg }) => {
            const interval = formatInterval(preview[rating].card.due, now);
            return (
              <button
                key={rating}
                onClick={() => handleRate(rating)}
                style={{
                  flex: 1,
                  background: bg,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.6rem 0.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                }}
              >
                <span>{label}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{interval}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
