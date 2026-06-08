import type { BreakdownItem } from '../grammar/breakdown';

export function BreakdownChips({ items }: { items: BreakdownItem[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.25rem', fontSize: '0.875rem' }}>
      {items.flatMap((item, i) => {
        const chip = (
          <span key={`item-${i}`} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>{item.display}</span>
            {item.label && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
            )}
          </span>
        );
        return i === 0
          ? [chip]
          : [
              <span key={`sep-${i}`} style={{ color: 'var(--color-text-muted)', alignSelf: 'flex-start', paddingTop: '1px' }}>+</span>,
              chip,
            ];
      })}
    </div>
  );
}
