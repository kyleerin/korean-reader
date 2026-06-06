import { GoogleOAuthProvider } from '@react-oauth/google';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchAuthConfig,
  fetchCurrentUser,
  signInWithGoogle,
  signOut,
} from './client';
import type { User } from './types';

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  user: User | null;
  signIn: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const config = await fetchAuthConfig();
      if (cancelled) return;

      setEnabled(config.enabled);
      setGoogleClientId(
        config.googleClientId ?? import.meta.env.VITE_GOOGLE_CLIENT_ID ?? undefined,
      );

      if (!config.enabled) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const current = await fetchCurrentUser();
        if (!cancelled) setUser(current);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const signIn = useCallback(async (credential: string) => {
    const signedIn = await signInWithGoogle(credential);
    setUser(signedIn);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    enabled,
    loading,
    user,
    signIn,
    signOut: handleSignOut,
  }), [enabled, loading, user, signIn, handleSignOut]);

  if (!enabled) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  if (!googleClientId) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
