import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const trustItems = [
  'AES-256-GCM message encryption',
  'RSA-OAEP key exchange',
  'Private key never leaves your device',
  'Server stores only ciphertext',
];

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-sans)',
      background: 'var(--bg-base)',
    }}>
      {/* Ambient */}
      <div style={{
        position: 'fixed', top: -100, left: -100, width: 400, height: 400,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, var(--brand-glow-sm), transparent 70%)',
        filter: 'blur(50px)', opacity: 0.5,
      }} />
      <div style={{
        position: 'fixed', bottom: -80, right: -80, width: 320, height: 320,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)',
        filter: 'blur(50px)', opacity: 0.4,
      }} />

      {/* ── Left panel (desktop) ── */}
      <div style={{
        width: 400, flexShrink: 0, position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '32px 36px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-dark)',
        boxShadow: 'var(--neu-shadow-out)',
      }} className="hidden lg:flex">

        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo size="sm" />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
            boxShadow: '0 8px 24px var(--brand-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={28} color="white" />
          </div>

          <div>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.375rem',
              letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: '0 0 10px',
            }}>
              Security you can{' '}
              <span style={{
                fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>verify.</span>
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Built on Web Crypto API standards — open, auditable, and mathematically sound.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trustItems.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.07 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                  boxShadow: 'var(--neu-shadow-sm)',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: 'var(--success-bg)', color: 'var(--success)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ShieldCheck size={12} />
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          © 2026 WhisperBox · E2EE by design
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10 }}>

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 32px',
          borderBottom: '1px solid var(--border-dark)',
        }}>
          <div className="lg:hidden">
            <Link to="/" style={{ textDecoration: 'none' }}><Logo size="sm" /></Link>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>

        {/* Centered form */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 32px',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            style={{ width: '100%', maxWidth: 420 }}
          >
            {/* Card */}
            <div style={{
              padding: '36px 32px', borderRadius: 20,
              background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-lg)',
              border: '1px solid var(--border-light)',
            }}>
              {/* Header */}
              <div style={{ marginBottom: 28 }}>
                <h1 style={{
                  fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.375rem',
                  letterSpacing: '-0.025em', color: 'var(--text-primary)',
                  margin: '0 0 6px',
                }}>{title}</h1>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {subtitle}
                </p>
              </div>

              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
