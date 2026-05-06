import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck, AtSign } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ApiError } from '../lib/api';

interface FormErrors {
  username?: string;
  displayName?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase',     pass: /[A-Z]/.test(password) },
    { label: 'Number',        pass: /\d/.test(password) },
    { label: 'Symbol',        pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score  = checks.filter(c => c.pass).length;
  const colors = ['', '#f0506e', '#f59e0b', '#6aad6a', 'var(--accent-primary)'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= score ? colors[score] : 'var(--bg-sunken)',
            transition: 'background 0.3s ease',
            boxShadow: i <= score ? `0 0 6px ${colors[score]}40` : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {checks.map((c, i) => (
            <span key={i} style={{
              fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4,
              color: c.pass ? 'var(--accent-primary)' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}>
              <span>{c.pass ? '✓' : '·'}</span>{c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: colors[score], flexShrink: 0, marginLeft: 8 }}>
            {labels[score]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

const KEY_GEN_STEPS = [
  'Generating RSA-OAEP keypair…',
  'Deriving wrapping key via PBKDF2…',
  'Wrapping private key with AES-KW…',
  'Registering your account…',
  'Finalizing session…',
];

function KeyGenProgress({ step }: { step: number }) {
  if (step < 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'var(--brand-glow-xs)', border: '1px solid var(--border-brand)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
          border: '2px solid var(--brand-primary)', borderTopColor: 'transparent',
          animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
          {KEY_GEN_STEPS[Math.min(step, KEY_GEN_STEPS.length - 1)]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {KEY_GEN_STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2, borderRadius: 2,
            background: i <= step ? 'var(--brand-primary)' : 'var(--bg-sunken)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [errors, setErrors]           = useState<FormErrors>({});
  const [loading, setLoading]         = useState(false);
  const [keyGenStep, setKeyGenStep]   = useState(-1);

  const clearErr = (f: keyof FormErrors) => setErrors(p => ({ ...p, [f]: undefined }));

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!displayName.trim()) errs.displayName = 'Required';
    else if (displayName.length > 50) errs.displayName = 'Max 50 characters';
    if (!username.trim()) errs.username = 'Required';
    else if (username.length < 3) errs.username = 'At least 3 characters';
    else if (username.length > 32) errs.username = 'Max 32 characters';
    else if (!/^[a-zA-Z0-9_-]+$/.test(username)) errs.username = 'Letters, digits, _ and - only';
    if (!password) errs.password = 'Required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    if (!confirm) errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirm) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    try {
      setKeyGenStep(0); await delay(380);
      setKeyGenStep(1); await delay(280);
      setKeyGenStep(2); await delay(220);
      setKeyGenStep(3);
      await register(username.trim().toLowerCase(), displayName.trim(), password);
      setKeyGenStep(4); await delay(350);
      success('Account created!', 'Your encrypted keys are ready.');
      navigate('/chat');
    } catch (err) {
      setKeyGenStep(-1);
      if (err instanceof ApiError) {
        if (err.status === 409) setErrors({ username: 'Username already taken' });
        else if (err.status === 422) setErrors({ general: 'Please check your inputs and try again' });
        else toastError('Registration failed', err.message);
      } else {
        toastError('Registration failed', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
      setKeyGenStep(-1);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Encrypted messaging, ready in seconds">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AnimatePresence>
          {errors.general && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                padding: '12px 14px', borderRadius: 10, fontSize: '0.875rem',
                background: 'var(--danger-bg)', border: '1px solid rgba(240,80,110,0.2)',
                color: 'var(--danger)',
              }}
            >{errors.general}</motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            label="Display name"
            type="text"
            placeholder="Ada Obi"
            value={displayName}
            onChange={e => { setDisplayName(e.target.value); clearErr('displayName'); }}
            error={errors.displayName}
            leftIcon={<User size={15} />}
            autoComplete="name"
            autoFocus
            disabled={loading}
          />
          <Input
            label="Username"
            type="text"
            placeholder="ada_obi"
            value={username}
            onChange={e => { setUsername(e.target.value.toLowerCase()); clearErr('username'); }}
            error={errors.username}
            leftIcon={<AtSign size={15} />}
            autoComplete="username"
            disabled={loading}
            hint="3–32 chars, letters/digits/_/-"
          />
        </div>

        <Input
          label="Password"
          placeholder="Create a strong password"
          value={password}
          onChange={e => { setPassword(e.target.value); clearErr('password'); }}
          error={errors.password}
          leftIcon={<Lock size={15} />}
          showPasswordToggle
          autoComplete="new-password"
          disabled={loading}
        />

        <AnimatePresence>
          <PasswordStrength password={password} />
        </AnimatePresence>

        <Input
          label="Confirm password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); clearErr('confirmPassword'); }}
          error={errors.confirmPassword}
          leftIcon={<Lock size={15} />}
          showPasswordToggle
          autoComplete="new-password"
          disabled={loading}
        />

        <AnimatePresence>
          {keyGenStep >= 0 && <KeyGenProgress step={keyGenStep} />}
        </AnimatePresence>

        {keyGenStep < 0 && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--success-bg)', border: '1px solid rgba(16,201,160,0.15)',
          }}>
            <ShieldCheck size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Your <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>cryptographic keys</strong> are
              generated in your browser. Your private key is wrapped with your password before storage.
            </span>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={!loading ? <ArrowRight size={16} /> : undefined}
        >
          {loading ? 'Generating keys…' : 'Create encrypted account'}
        </Button>

        <div className="divider-label"><span>already have an account</span></div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          <Link to="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in instead
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
