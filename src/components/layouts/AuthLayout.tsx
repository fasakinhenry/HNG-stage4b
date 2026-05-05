import type { ReactNode } from 'react';
import { BrandMark } from '../BrandMark';
import { ThemeToggle } from '../ThemeToggle';
import { Card } from '../ui/Card';

interface AuthLayoutProps {
  hero: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ hero, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-dvh px-4 py-5 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl gap-6 lg:grid-cols-[1fr_1fr] lg:py-0">
        <section className="card flex flex-col justify-between rounded-lg p-6 sm:p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4">
            <BrandMark />
            <ThemeToggle />
          </div>
          <div className="py-10 sm:py-14">{hero}</div>
          <div className="grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-3">
            <Card className="rounded-lg px-4 py-3">Client-side E2EE</Card>
            <Card className="rounded-lg px-4 py-3">Private key stays local</Card>
            <Card className="rounded-lg px-4 py-3">JWT session ready</Card>
          </div>
        </section>

        <section className="flex items-center justify-center py-4 lg:py-0">{children}</section>
      </div>
    </div>
  );
}
