import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { clearDeepLApiKey, getDeepLApiKey, setDeepLApiKey } from './storage';

interface DeepLSettingsContextValue {
  apiKey: string | null;
  hasApiKey: boolean;
  openSettings: () => void;
  saveApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
}

const DeepLSettingsContext = createContext<DeepLSettingsContextValue | null>(null);

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

function DeepLSettingsModal({
  initialValue,
  onSave,
  onClear,
  onClose,
}: {
  initialValue: string;
  onSave: (apiKey: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('API key is required.');
      return;
    }
    onSave(trimmed);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deepl-settings-title"
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
          maxWidth: '24rem',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '1.25rem',
        }}
      >
        <h2 id="deepl-settings-title" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          DeepL API key
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Saved in this browser only. Used for full-text translation below your reading.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            API key
            <input
              type="password"
              autoComplete="off"
              value={value}
              onChange={e => { setValue(e.target.value); setError(null); }}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx"
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
            style={{ width: '100%', background: 'var(--color-new)', color: '#fff', marginBottom: '0.5rem' }}
          >
            Save
          </button>
        </form>

        {initialValue && (
          <button
            type="button"
            onClick={onClear}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#f87171',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
              marginBottom: '0.5rem',
            }}
          >
            Remove saved key
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
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

export function DeepLSettingsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() => getDeepLApiKey());
  const [open, setOpen] = useState(false);

  const saveApiKey = useCallback((key: string) => {
    setDeepLApiKey(key);
    setApiKeyState(key);
    setOpen(false);
  }, []);

  const clearApiKey = useCallback(() => {
    clearDeepLApiKey();
    setApiKeyState(null);
    setOpen(false);
  }, []);

  const value = useMemo<DeepLSettingsContextValue>(() => ({
    apiKey,
    hasApiKey: apiKey !== null,
    openSettings: () => setOpen(true),
    saveApiKey,
    clearApiKey,
  }), [apiKey, saveApiKey, clearApiKey]);

  return (
    <DeepLSettingsContext.Provider value={value}>
      {children}
      {open && (
        <DeepLSettingsModal
          initialValue={apiKey ?? ''}
          onSave={saveApiKey}
          onClear={clearApiKey}
          onClose={() => setOpen(false)}
        />
      )}
    </DeepLSettingsContext.Provider>
  );
}

export function useDeepLSettings(): DeepLSettingsContextValue {
  const ctx = useContext(DeepLSettingsContext);
  if (!ctx) throw new Error('useDeepLSettings must be used within DeepLSettingsProvider');
  return ctx;
}

export function DeepLSettingsButton() {
  const { hasApiKey, openSettings } = useDeepLSettings();

  return (
    <button
      type="button"
      onClick={openSettings}
      title={hasApiKey ? 'DeepL key saved — click to edit' : 'Add DeepL API key for translation'}
      style={{
        marginLeft: 'auto',
        background: 'var(--color-surface)',
        color: hasApiKey ? '#22c55e' : 'var(--color-text-muted)',
        border: '1px solid var(--color-border)',
        padding: '0.35rem 0.75rem',
        fontSize: '0.8rem',
      }}
    >
      {hasApiKey ? 'Translation on' : 'Add DeepL key'}
    </button>
  );
}
