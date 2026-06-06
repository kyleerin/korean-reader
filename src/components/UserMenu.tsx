import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { AuthModal } from './AuthModal';

export function UserMenu() {
  const { enabled, loading, user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (!enabled || loading) return null;

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', maxWidth: '12rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.name}
        </span>
        <button
          onClick={() => { void signOut(); }}
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            padding: '0.35rem 0.75rem',
            fontSize: '0.8rem',
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginLeft: 'auto' }}>
        <button
          type="button"
          onClick={() => setShowAuth(true)}
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            padding: '0.35rem 0.85rem',
            fontSize: '0.85rem',
          }}
        >
          Sign in
        </button>
      </div>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
