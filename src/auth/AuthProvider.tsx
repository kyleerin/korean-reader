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
  login,
  register,
  signOut,
} from './client';
import type { User } from './types';

interface AuthContextValue {
  enabled: boolean;
  loading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const config = await fetchAuthConfig();
      if (cancelled) return;

      setEnabled(config.enabled);

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

  const handleLogin = useCallback(async (email: string, password: string) => {
    const signedIn = await login(email, password);
    setUser(signedIn);
  }, []);

  const handleRegister = useCallback(async (email: string, password: string, name?: string) => {
    const signedIn = await register(email, password, name);
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
    login: handleLogin,
    register: handleRegister,
    signOut: handleSignOut,
  }), [enabled, loading, user, handleLogin, handleRegister, handleSignOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
