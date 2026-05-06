import { type InputHTMLAttributes, type ReactNode, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>((
  { label, error, hint, leftIcon, rightIcon, showPasswordToggle, className, type, id, ...rest },
  ref
) => {
  const [showPass, setShowPass] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const resolvedType = showPasswordToggle ? (showPass ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.01em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }}>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={resolvedType}
          className={clsx('input-nb', leftIcon && 'pl-10', (rightIcon || showPasswordToggle) && 'pr-10', error && 'error', className)}
          {...rest}
        />
        {showPasswordToggle ? (
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
            style={{ color: 'var(--text-3)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : rightIcon ? (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }}>
            {rightIcon}
          </span>
        ) : null}
      </div>
      {error && <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--danger)' }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';
