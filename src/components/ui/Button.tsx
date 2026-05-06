import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'icon' | 'icon-brand';
type Size    = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  { variant = 'primary', size = 'md', loading = false, fullWidth = false,
    leftIcon, rightIcon, children, className, disabled, ...rest },
  ref
) => {
  const variantCls: Record<Variant, string> = {
    primary:    'btn btn-primary',
    secondary:  'btn btn-secondary',
    ghost:      'btn btn-ghost',
    danger:     'btn btn-danger',
    accent:     'btn btn-accent',
    icon:       'btn btn-icon',
    'icon-brand': 'btn btn-icon-brand',
  };
  const sizeCls: Record<Size, string> = {
    sm: 'btn-sm', md: '', lg: 'btn-lg', xl: 'btn-xl',
  };
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(variantCls[variant], sizeCls[size], fullWidth && 'btn-full', className)}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 0.8s linear infinite' }} />
       : leftIcon ? <span className="flex-shrink-0">{leftIcon}</span> : null}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
});
Button.displayName = 'Button';
