import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../auth/AuthProvider';

export function UserMenu() {
  const { enabled, loading, user, signIn, signOut } = useAuth();

  if (!enabled || loading) return null;

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
        {user.picture && (
          <img
            src={user.picture}
            alt=""
            width={28}
            height={28}
            style={{ borderRadius: '50%' }}
            referrerPolicy="no-referrer"
          />
        )}
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
    <div style={{ marginLeft: 'auto' }}>
      <GoogleLogin
        onSuccess={(response: CredentialResponse) => {
          if (response.credential) void signIn(response.credential);
        }}
        onError={() => {
          console.error('Google sign-in failed');
        }}
        theme="filled_black"
        size="medium"
        text="signin_with"
        shape="rectangular"
      />
    </div>
  );
}
