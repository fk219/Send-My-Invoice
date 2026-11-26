import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'clarity.theme';

function systemIsDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(theme: Theme) {
  if (typeof document === 'undefined') return;
  const dark = theme === 'dark' || (theme === 'system' && systemIsDark());
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setTheme(stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system');
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    apply(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
    if (theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const next: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme}`}
      onClick={() => setTheme(next)}
    >
      {theme === 'light' ? <Sun size={13} /> : theme === 'dark' ? <Moon size={13} /> : <Monitor size={13} />}
      {!compact && <span className="theme-toggle-label">{theme}</span>}
    </button>
  );
}
