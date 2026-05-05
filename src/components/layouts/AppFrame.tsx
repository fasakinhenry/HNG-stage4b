import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, KeyRound, Settings2, ShieldCheck, X } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { ThemeToggle } from '../ThemeToggle';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

interface AppFrameProps {
  children: ReactNode;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function displaySecret(value: string) {
  if (!value) {
    return 'Not available';
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 12)}…${value.slice(-12)}`;
}

export function AppFrame({ children }: AppFrameProps) {
  const { user, signOutUser } = useAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="relative min-h-dvh px-4 py-5 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl flex-col gap-4">
        <header className="card flex flex-wrap items-center justify-between gap-4 rounded-lg px-5 py-4">
          <Link to="/" className="transition-all duration-200 hover:opacity-80">
            <BrandMark />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <Card className="hidden items-center gap-2 rounded-lg px-4 py-2 text-sm text-[var(--text-secondary)] sm:flex">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              Secure session for {user?.display_name ?? 'you'}
            </Card>
            <ThemeToggle />
            <Button variant="secondary" className="cursor-pointer" onClick={() => setShowProfile(true)} leadingIcon={<Settings2 className="h-4 w-4" />}>
              Profile
            </Button>
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

      {showProfile ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-4 backdrop-blur-sm" onClick={() => setShowProfile(false)}>
          <div className="h-full w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <Card className="flex h-full flex-col rounded-[30px] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">Profile & settings</div>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--text)]">{user?.display_name ?? 'Your profile'}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">View your account details, key material, and current session state.</p>
                </div>
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowProfile(false)} leadingIcon={<X className="h-4 w-4" />}>
                  Close
                </Button>
              </div>

              <div className="mt-6 grid gap-4 overflow-y-auto">
                <Card className="rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                    Account details
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Display name</span>
                      <span className="font-semibold text-[var(--text)]">{user?.display_name ?? 'Unavailable'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Username</span>
                      <span className="font-semibold text-[var(--text)]">@{user?.username ?? 'unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>User ID</span>
                      <span className="max-w-[55%] truncate font-semibold text-[var(--text)]">{user?.id ?? 'Unavailable'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Created</span>
                      <span className="font-semibold text-[var(--text)]">{user?.created_at ? formatDate(user.created_at) : 'Unavailable'}</span>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <KeyRound className="h-4 w-4 text-[var(--accent)]" />
                    Key material
                  </div>
                  <div className="mt-4 grid gap-3 text-sm text-[var(--text-secondary)]">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Public key</div>
                      <div className="mt-1 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 font-mono text-xs leading-6 text-[var(--text)]">
                        {displaySecret(user?.public_key ?? '')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Wrapped private key</div>
                      <div className="mt-1 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 font-mono text-xs leading-6 text-[var(--text)]">
                        {displaySecret(user?.wrapped_private_key ?? '')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">PBKDF2 salt</div>
                      <div className="mt-1 rounded-2xl bg-[var(--surface-alt)] px-4 py-3 font-mono text-xs leading-6 text-[var(--text)]">
                        {displaySecret(user?.pbkdf2_salt ?? '')}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    <CalendarDays className="h-4 w-4 text-[var(--accent)]" />
                    Session notes
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    Session data lives in memory and session storage only. Use sign out to revoke the current token pair.
                  </p>
                </Card>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
