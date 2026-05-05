import { ArrowLeft } from 'lucide-react';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <PublicLayout>
      <div className="mx-auto flex min-h-[70dvh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <div className="card rounded-[34px] px-8 py-10 sm:px-12 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">404</p>
          <h1 className="brand-title mt-4 text-4xl font-bold tracking-tight text-[var(--text)] sm:text-5xl">
            This room is locked.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--text-secondary)]">
            The page you asked for does not exist, but the secure entry point is right here.
          </p>
          <div className="mt-8 flex justify-center">
            <Button leadingIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => window.location.assign('/')}>
              Back to landing
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
