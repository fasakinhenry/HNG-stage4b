import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import AuthLayout from '../layouts/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ApiError } from '../lib/api';

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!username.trim()) errs.username = 'Username is required';
    else if (username.length < 3) errs.username = 'At least 3 characters';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      await login(username.trim().toLowerCase(), password);
      success('Welcome back!', 'Your encrypted session is active.');
      navigate('/chat');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setErrors({ general: 'Invalid username or password' });
        else toastError('Login failed', err.message);
      } else if (err instanceof Error && err.name === 'OperationError') {
        setErrors({ general: 'Could not decrypt your keys — check your password.' });
      } else {
        toastError('Login failed', 'An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your encrypted workspace">
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* General error */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 10, fontSize: '0.875rem',
              background: 'var(--danger-bg)',
              border: '1px solid rgba(240,80,110,0.2)',
              color: 'var(--danger)',
            }}
          >
            <Lock size={14} style={{ flexShrink: 0 }} />
            {errors.general}
          </motion.div>
        )}

        <Input
          label="Username"
          type="text"
          placeholder="your_username"
          value={username}
          onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })); }}
          error={errors.username}
          leftIcon={<User size={15} />}
          autoComplete="username"
          autoFocus
          disabled={loading}
        />

        <Input
          label="Password"
          placeholder="Your password"
          value={password}
          onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
          error={errors.password}
          leftIcon={<Lock size={15} />}
          showPasswordToggle
          autoComplete="current-password"
          disabled={loading}
        />

        {/* Privacy note */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '12px 14px', borderRadius: 10,
          background: 'var(--success-bg)',
          border: '1px solid rgba(16,201,160,0.15)',
        }}>
          <ShieldCheck size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Your password decrypts your private key locally —{' '}
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>never sent</strong>{' '}
            to our servers.
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          rightIcon={!loading ? <ArrowRight size={16} /> : undefined}
        >
          {loading ? 'Decrypting keys…' : 'Sign in'}
        </Button>

        <div className="divider-label"><span>or</span></div>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Create one free
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
