import { MoonStar, SunMedium } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="card cursor-pointer inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-alt)]"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    </button>
  );
}
