import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'pdd-theme';
const darkQuery = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-color-scheme: dark)') : null;

const systemTheme = (): Theme => (darkQuery?.matches ? 'dark' : 'light');

function savedTheme(): Theme | null {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : null;
}

function apply(theme: Theme) {
  const root = document.documentElement;
  // Picking the theme the OS already uses goes back to following the OS.
  const followOs = theme === systemTheme();
  try {
    if (followOs) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
  if (followOs) delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => savedTheme() ?? systemTheme());

  // Keep following the OS while the user hasn't overridden it.
  useEffect(() => {
    if (!darkQuery) return;
    const onChange = () => {
      if (!savedTheme()) setTheme(systemTheme());
    };
    darkQuery.addEventListener('change', onChange);
    return () => darkQuery.removeEventListener('change', onChange);
  }, []);

  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      class="theme-toggle"
      aria-label={next === 'dark' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      title={next === 'dark' ? 'Modo oscuro' : 'Modo claro'}
      onClick={() => {
        apply(next);
        setTheme(next);
      }}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
