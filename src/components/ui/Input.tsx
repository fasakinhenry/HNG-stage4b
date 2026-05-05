import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
}

export function Input({ label, helperText, error, leadingIcon, className, id, ...props }: InputProps) {
  const generatedId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <label htmlFor={generatedId} className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--muted-strong)]">{label}</span>
      <span
        className={cn(
          'card flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200',
          error ? 'border-[var(--danger)] bg-red-50 dark:bg-red-950/20' : '',
          className
        )}
      >
        {leadingIcon ? <span className="text-[var(--muted)]">{leadingIcon}</span> : null}
        <input
          id={generatedId}
          className="focus-ring w-full bg-transparent text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          {...props}
        />
      </span>
      {error ? <span className="text-xs text-[var(--danger)]">{error}</span> : null}
      {!error && helperText ? <span className="text-xs text-[var(--muted)]">{helperText}</span> : null}
    </label>
  );
}
