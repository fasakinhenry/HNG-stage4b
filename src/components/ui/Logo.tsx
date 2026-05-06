import { clsx } from 'clsx';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: 28, text: '1.125rem' },
  md: { box: 36, text: '1.375rem' },
  lg: { box: 48, text: '1.75rem' },
};

export function Logo({ size = 'md', showWordmark = true, className }: LogoProps) {
  const { box, text } = sizes[size];
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      <div style={{
        width: box, height: box,
        borderRadius: 8,
        background: 'var(--brand)',
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width={box * 0.52} height={box * 0.52} viewBox="0 0 24 24" fill="none">
          <path d="M12 2C9.24 2 7 4.24 7 7v1H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 8a2 2 0 110 4 2 2 0 010-4z" fill="white"/>
        </svg>
      </div>
      {showWordmark && (
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 800,
          fontSize: text,
          letterSpacing: '-0.03em',
          color: 'var(--text-1)',
          lineHeight: 1,
        }}>
          Whisper<span style={{ color: 'var(--brand)' }}>Box</span>
        </span>
      )}
    </div>
  );
}
