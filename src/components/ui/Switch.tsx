import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface SwitchProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean;
}

export function Switch({ checked, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      className={cn(
        'focus-ring cursor-pointer inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-all duration-200',
        checked ? 'justify-end bg-[var(--accent)]' : 'justify-start bg-gray-300 dark:bg-gray-600',
        className
      )}
      style={{
        borderColor: checked ? 'var(--accent)' : 'var(--border)'
      }}
      {...props}
    >
      <span
        className="h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
      />
    </button>
  );
}
