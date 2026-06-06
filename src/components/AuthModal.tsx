import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthProvider';

type Mode = 'signin' | 'register';

interface Props {
  onClose: () => void;
}

const fieldStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '0.35rem',
  padding: '0.5rem 0.65rem',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
};

export function AuthModal({ onClose }: Props) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '22rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '1.25rem',
        }}
      >
        <h2 id="auth-modal-title" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </h2>

        <form onSubmit={e => { void handleSubmit(e); }}>
          {mode === 'register' && (
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              Name (optional)
              <input
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={fieldStyle}
              />
            </label>
          )}

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={fieldStyle}
            />
          </label>

          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={fieldStyle}
            />
          </label>

          {error && (
            <p role="alert" style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              background: 'var(--color-new)',
              color: '#fff',
              marginBottom: '0.75rem',
            }}
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                style={{ background: 'none', color: 'var(--color-new)', padding: 0, fontSize: 'inherit' }}
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                style={{ background: 'none', color: 'var(--color-new)', padding: 0, fontSize: 'inherit' }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.75rem',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
            fontSize: '0.85rem',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
