import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Fingerprint, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { generateRegistrationKeys } from '../services/cryptoService';

const tabCopy = {
  signIn: {
    badge: 'Secure access',
    title: 'Welcome back.',
    description: 'Pick up the conversation where you left off. WhisperBox keeps plaintext on your device and restores your session securely.'
  },
  signUp: {
    badge: 'Create account',
    title: 'Start a private inbox.',
    description: 'Create a WhisperBox identity with client-generated keys, wrapped private material, and a clean encrypted session.'
  }
} as const;

const capabilityItems = [
  'Login stays fast with secure tokens.',
  'Private keys remain wrapped and local.',
  'Dark and light mode stay equally readable.',
  'Client-side crypto is wired in from day one.'
];

export function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isWorking, signInUser, signUpUser } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [errorMessage, setErrorMessage] = useState('');
  const [form, setForm] = useState({
    username: '',
    displayName: '',
    password: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const passwordStrength = useMemo(() => {
    const score = [form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;

    if (score >= 4) return { label: 'Strong', width: '100%' };
    if (score === 3) return { label: 'Good', width: '75%' };
    if (score === 2) return { label: 'Fair', width: '50%' };
    if (score === 1) return { label: 'Weak', width: '25%' };
    return { label: 'Start typing', width: '0%' };
  }, [form.password]);

  const copy = tabCopy[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    try {
      if (mode === 'signIn') {
        await signInUser({
          username: form.username.trim(),
          password: form.password
        });
      } else {
        const registrationKeys = await generateRegistrationKeys(form.password);
        await signUpUser({
          username: form.username.trim(),
          display_name: form.displayName.trim() || form.username.trim(),
          password: form.password,
          ...registrationKeys
        });
      }
      navigate('/app', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Something blocked the secure handshake.');
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AuthLayout
      hero={
        <div className="max-w-xl space-y-6">
          <Badge className="bg-[linear-gradient(135deg,rgba(0,132,208,0.18),rgba(102,184,232,0.12))] text-[var(--accent)]">{copy.badge}</Badge>
          <div className="space-y-4">
            <h1 className="brand-title text-5xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">{copy.title}</h1>
            <p className="max-w-lg text-base leading-8 text-[var(--text-secondary)] sm:text-lg">{copy.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {capabilityItems.map((item) => (
              <Card key={item} className="rounded-2xl p-4 text-sm text-[var(--text-secondary)]">
                {item}
              </Card>
            ))}
          </div>

          <Card className="rounded-[32px] bg-[linear-gradient(135deg,rgba(0,132,208,0.14),rgba(102,184,232,0.10))] p-5 text-sm text-[var(--text-secondary)] shadow-[0_20px_60px_rgba(0,132,208,0.08)]">
            <div className="flex items-center gap-2 font-semibold text-[var(--text)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              Security note
            </div>
            <p className="mt-2 leading-7">
              WhisperBox is prepared to call the WhisperBox API, and the sign-up flow now generates real client-side keys before registration.
            </p>
          </Card>
        </div>
      }
    >
      <Card className="w-full max-w-[520px] rounded-[32px] p-5 sm:p-7">
        <div className="flex rounded-2xl bg-[var(--surface-alt)] p-1">
          <button
            type="button"
            className={`focus-ring flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'signIn' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            onClick={() => setMode('signIn')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`focus-ring flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'signUp' ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-secondary)]'}`}
            onClick={() => setMode('signUp')}
          >
            Create account
          </button>
        </div>

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          {mode === 'signUp' ? (
            <Input
              label="Display name"
              placeholder="Alice"
              value={form.displayName}
              onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
              leadingIcon={<Fingerprint className="h-4 w-4" />}
              helperText="This shows up in your conversation list and profile card."
            />
          ) : null}

          <Input
            label="Username"
            placeholder="alice_92"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value.toLowerCase() }))}
            leadingIcon={<Mail className="h-4 w-4" />}
            helperText="Lowercase letters, numbers, underscores, and hyphens only."
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter a strong password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            leadingIcon={<KeyRound className="h-4 w-4" />}
            helperText={`Strength: ${passwordStrength.label}`}
          />

          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-alt)]">
            <div className="h-full rounded-full bg-[linear-gradient(135deg,var(--accent),#66b8e8)] transition-all duration-300" style={{ width: passwordStrength.width }} />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
              {errorMessage}
            </div>
          ) : null}

          <Button type="submit" size="lg" loading={isWorking} trailingIcon={<ArrowRight className="h-4 w-4" />}>
            {mode === 'signIn' ? 'Enter WhisperBox' : 'Create secure account'}
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
