import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../BrandMark';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/Button';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="relative min-h-dvh">
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="transition-all duration-200 hover:opacity-80">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => window.location.assign('/auth')}>
            Secure access
          </Button>
        </div>
      </header>

      <main className="relative z-10">{children}</main>
    </div>
  );
}
