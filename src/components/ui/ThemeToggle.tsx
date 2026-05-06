import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { clsx } from 'clsx';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className={clsx(
        'btn btn-icon',
        'transition-all duration-200',
        className
      )}
    >
      <div className="relative w-4 h-4">
        <Sun
          size={16}
          className="absolute inset-0 transition-all duration-300"
          style={{
            opacity: theme === 'dark' ? 1 : 0,
            transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)',
          }}
        />
        <Moon
          size={16}
          className="absolute inset-0 transition-all duration-300"
          style={{
            opacity: theme === 'light' ? 1 : 0,
            transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          }}
        />
      </div>
    </button>
  );
}
