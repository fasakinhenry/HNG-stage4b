import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../BrandMark';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

interface AppFrameProps {
  children: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  const { user, signOutUser } = useAuth();

  return (
    <div className="relative min-h-dvh px-4 py-5 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl flex-col gap-4">
        <header className="card flex flex-wrap items-center justify-between gap-4 rounded-lg px-5 py-4">
          <Link to="/" className="transition-all duration-200 hover:opacity-80">
            <BrandMark />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Card className="hidden items-center gap-2 rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] sm:flex">
              Secure session for {user?.display_name ?? 'you'}
            </Card>
            <ThemeToggle />
            <Button variant="secondary" className="cursor-pointer">Find people</Button>
            <Button variant="ghost" className="cursor-pointer" onClick={signOutUser}>
              Sign out
            </Button>
          </div>
        </header>

        {children}

        <footer className="pb-2 text-center text-xs text-[var(--text-secondary)]">
          WhisperBox keeps plaintext on the device. The server only receives encrypted blobs.
        </footer>
      </div>
    </div>
  );
}
