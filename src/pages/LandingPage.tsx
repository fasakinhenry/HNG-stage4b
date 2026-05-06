import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  ShieldCheck, Lock, Zap, ArrowRight,
  MessageCircle, KeyRound, ChevronRight,
  Star, CheckCircle2,
} from 'lucide-react';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const features = [
  {
    icon: <ShieldCheck size={20} />,
    title: 'End-to-End Encrypted',
    desc: 'Every message encrypted on your device. Server stores only ciphertext — mathematically zero knowledge.',
  },
  {
    icon: <KeyRound size={20} />,
    title: 'Your Keys, Your Control',
    desc: 'RSA-OAEP keypairs generated in your browser. Private keys wrapped with PBKDF2 — never sent in plaintext.',
  },
  {
    icon: <Zap size={20} />,
    title: 'Real-Time Delivery',
    desc: 'WebSocket-powered live messaging with offline REST fallback. Messages arrive the instant you reconnect.',
  },
  {
    icon: <MessageCircle size={20} />,
    title: 'Zero Server Knowledge',
    desc: 'We cannot read your messages — not by policy, by mathematics. A breached server reveals nothing useful.',
  },
];

const stats = [
  { value: '256-bit', label: 'AES-GCM' },
  { value: '2048-bit', label: 'RSA-OAEP' },
  { value: '0', label: 'Plaintext stored' },
  { value: '100%', label: 'Client-side crypto' },
];

const previewMessages = [
  { out: false, text: 'Can we talk privately?', time: '9:41' },
  { out: true,  text: 'This chat is E2E encrypted 🔒', time: '9:41' },
  { out: false, text: "Even WhisperBox can't read this?", time: '9:42' },
  { out: true,  text: 'Mathematically impossible.', time: '9:42' },
  { out: false, text: 'Perfect. ✨', time: '9:43' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [activeMsg, setActiveMsg] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveMsg(p => (p + 1) % previewMessages.length);
    }, 2200);
    return () => clearInterval(intervalRef.current ?? undefined);
  }, []);

  return (
    <div className="bg-landing min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Ambient blobs — subtle */}
      <div style={{
        position: 'fixed', top: -120, left: -120, width: 480, height: 480,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, var(--brand-glow-xs) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'fixed', bottom: -80, right: -80, width: 360, height: 360,
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter: 'blur(40px)', opacity: 0.6,
      }} />

      {/* ── NAV ─────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-20"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: 64,
          borderBottom: '1px solid var(--border-dark)',
          background: 'var(--bg-base)',
        }}
      >
        <Logo size="sm" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/chat">
              <Button variant="primary" size="sm" rightIcon={<ChevronRight size={14} />}>Open app</Button>
            </Link>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/register"><Button variant="primary" size="sm">Get started</Button></Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── HERO ────────────────────────────── */}
      <section
        className="relative z-10"
        style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 40px 72px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

          {/* Left */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'flex', flexDirection: 'column', gap: 28 }}
          >
            <motion.div variants={fadeUp}>
              <div className="enc-chip" style={{ display: 'inline-flex' }}>
                <ShieldCheck size={10} />
                End-to-end encrypted by default
              </div>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h1 style={{
                fontFamily: 'var(--font-sans)', fontWeight: 800,
                fontSize: 'clamp(2.25rem, 4vw, 3.25rem)',
                letterSpacing: '-0.035em', lineHeight: 1.06,
                color: 'var(--text-primary)', margin: 0,
              }}>
                Messages only{' '}
                <span style={{
                  fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic',
                  background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>you</span>{' '}can read.
              </h1>
              <p style={{
                fontSize: '1.0625rem', color: 'var(--text-secondary)',
                lineHeight: 1.65, maxWidth: 420, margin: 0, fontWeight: 400,
              }}>
                WhisperBox encrypts every message on your device before it reaches our servers.
                We see nothing. You own everything.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>
                  Start for free
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', marginRight: -4 }}>
                {['A','B','C','D'].map((l, i) => (
                  <div key={l} className="avatar avatar-sm" style={{
                    border: '2px solid var(--bg-base)',
                    background: `linear-gradient(135deg, hsl(${i*65+200},65%,55%), hsl(${i*65+230},60%,65%))`,
                    zIndex: 4 - i, marginRight: -8, fontSize: '0.6rem',
                  }}>{l}</div>
                ))}
              </div>
              <div style={{ marginLeft: 8 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill="var(--warning)" color="var(--warning)" />
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Trusted by privacy-conscious teams
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ width: 300, position: 'relative' }} className="animate-float">
              {/* Glow behind card */}
              <div style={{
                position: 'absolute', inset: -24, borderRadius: '50%', zIndex: 0,
                background: 'radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)',
                filter: 'blur(20px)',
              }} />
              {/* Card */}
              <div style={{
                position: 'relative', zIndex: 1, borderRadius: 24, overflow: 'hidden',
                background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-lg)',
                border: '1px solid var(--border-light)',
              }}>
                {/* Chat header */}
                <div style={{
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                  background: 'var(--bg-raised)', borderBottom: '1px solid var(--border-dark)',
                }}>
                  <div className="avatar avatar-md avatar-online" style={{ fontSize: '0.8rem' }}>AO</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Adaeze Obi</p>
                    <div className="enc-chip" style={{ marginTop: 3 }}><Lock size={8} />E2E Encrypted</div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ padding: '16px 14px', minHeight: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previewMessages.map((msg, i) => (
                    <motion.div key={i}
                      animate={{ opacity: i <= activeMsg ? 1 : 0, y: i <= activeMsg ? 0 : 6 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', justifyContent: msg.out ? 'flex-end' : 'flex-start' }}
                    >
                      <div
                        className={msg.out ? 'bubble-out' : 'bubble-in'}
                        style={{ padding: '8px 12px', maxWidth: '78%' }}
                      >
                        <p style={{ fontSize: '0.8125rem', margin: 0, lineHeight: 1.4 }}>{msg.text}</p>
                        <p style={{ fontSize: '0.625rem', margin: '3px 0 0', opacity: 0.6, textAlign: 'right' }}>{msg.time}</p>
                      </div>
                    </motion.div>
                  ))}
                  {activeMsg === previewMessages.length - 1 && (
                    <div style={{ display: 'flex' }}>
                      <div className="bubble-in" style={{ padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div style={{
                  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
                  borderTop: '1px solid var(--border-dark)', background: 'var(--bg-raised)',
                }}>
                  <div style={{
                    flex: 1, padding: '8px 12px', borderRadius: 16, fontSize: '0.8125rem',
                    background: 'var(--bg-sunken)', boxShadow: 'var(--neu-shadow-in)',
                    color: 'var(--text-muted)',
                  }}>Encrypted message…</div>
                  <div className="btn btn-icon-brand" style={{ padding: 8, borderRadius: 12 }}>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        style={{ padding: '0 40px 64px' }}
      >
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--border-dark)', gap: 1,
          borderRadius: 16, overflow: 'hidden',
          boxShadow: 'var(--neu-shadow-out)',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-card)', padding: '24px 16px',
              textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{
                display: 'block', fontWeight: 800, fontSize: '1.5rem',
                letterSpacing: '-0.025em', fontFamily: 'var(--font-sans)',
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{s.value}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── FEATURES ────────────────────────── */}
      <motion.section
        variants={stagger} initial="hidden" whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        style={{ maxWidth: 1080, margin: '0 auto', padding: '0 40px 80px' }}
      >
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="badge badge-brand" style={{ marginBottom: 12 }}>Why WhisperBox</div>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: '0 0 12px',
          }}>
            Security isn't a feature.{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>It's the foundation.</span>
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
            Every decision starts with: if our server is breached, does it reveal anything useful?
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              style={{
                padding: '24px 20px', borderRadius: 16,
                background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-out)',
                border: '1px solid var(--border-light)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: 'var(--brand-glow-xs)', color: 'var(--brand-primary)',
                border: '1px solid var(--border-brand)', boxShadow: 'var(--neu-shadow-sm)',
              }}>{f.icon}</div>
              <div>
                <p style={{
                  fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)',
                  letterSpacing: '-0.01em', margin: '0 0 6px',
                }}>{f.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── HOW IT WORKS ────────────────────── */}
      <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-dark)', borderBottom: '1px solid var(--border-dark)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-accent" style={{ marginBottom: 12 }}>How it works</div>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0,
            }}>Simple to use.{' '}
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}>
                Impossible to compromise.
              </span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { step: '01', icon: <KeyRound size={18} />, title: 'Keys Generated Locally', desc: 'A 2048-bit RSA-OAEP keypair is created in your browser. Your private key is immediately wrapped with your password and stored as encrypted ciphertext.' },
              { step: '02', icon: <Lock size={18} />, title: 'Encrypted Before Sending', desc: 'Each message gets a unique AES-256-GCM key. That key is RSA-encrypted for your recipient — and for yourself — before the payload leaves your device.' },
              { step: '03', icon: <ShieldCheck size={18} />, title: 'Only You Can Decrypt', desc: 'The server routes encrypted blobs. Only your private key can unwrap the AES key and read the content — making a server breach mathematically useless.' },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  position: 'relative', padding: '28px 24px', borderRadius: 16,
                  background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-out)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <span style={{
                  position: 'absolute', top: 12, right: 16,
                  fontSize: '2.5rem', fontWeight: 800, lineHeight: 1,
                  color: 'var(--brand-primary)', opacity: 0.08,
                  fontFamily: 'var(--font-sans)',
                }}>{s.step}</span>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 16,
                  background: 'var(--brand-glow-xs)', color: 'var(--brand-primary)',
                  border: '1px solid var(--border-brand)',
                }}>{s.icon}</div>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>{s.title}</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────── */}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '72px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="badge badge-muted" style={{ marginBottom: 12 }}>Community</div>
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
            letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0,
          }}>Trusted by privacy-first teams</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { name: 'Adaeze O.', role: 'Security Engineer', text: "Finally a messaging app I can recommend to my team. The E2EE implementation is textbook-correct." },
            { name: 'Emeka T.', role: 'Privacy Advocate', text: "WhisperBox proves you don't have to sacrifice UX for security. Absolutely stunning product." },
            { name: 'Chiamaka B.', role: 'Software Developer', text: "The key management is seamless. My private key never leaves my browser — exactly what E2EE should be." },
          ].map((t, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
              style={{
                padding: '24px', borderRadius: 16,
                background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-out)',
                border: '1px solid var(--border-light)',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                {[...Array(5)].map((_, j) => <Star key={j} size={13} fill="var(--warning)" color="var(--warning)" />)}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, fontStyle: 'italic', margin: 0, flex: 1 }}>
                "{t.text}"
              </p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                paddingTop: 16, borderTop: '1px solid var(--border-dark)',
              }}>
                <div className="avatar avatar-sm" style={{
                  background: `linear-gradient(135deg, hsl(${i*80+220},65%,55%), hsl(${i*80+250},60%,65%))`,
                }}>{t.name[0]}</div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{t.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── CTA ─────────────────────────────── */}
      <div style={{ padding: '0 40px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{
            maxWidth: 640, margin: '0 auto', textAlign: 'center',
            padding: '56px 40px', borderRadius: 24,
            background: 'var(--bg-card)', boxShadow: 'var(--neu-shadow-lg)',
            border: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 50% at 50% 0%, var(--brand-glow-xs), transparent)',
          }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div className="enc-chip">
              <ShieldCheck size={10} />Free forever · No credit card
            </div>
            <h2 style={{
              fontFamily: 'var(--font-sans)', fontWeight: 700,
              fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
              letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0,
            }}>
              Your privacy is not{' '}
              <span style={{
                background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>negotiable.</span>
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', maxWidth: 380, margin: 0 }}>
              Join WhisperBox and experience messaging as it should be — private, secure, and completely under your control.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight size={16} />}>Create free account</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">Sign in</Button>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['No ads, ever', 'Open-source crypto', 'Zero plaintext stored'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── FOOTER ──────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border-dark)',
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <Logo size="sm" />
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          © 2026 WhisperBox · E2EE by design, not policy
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Security', 'API Docs'].map(l => (
            <a key={l} href="#" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>

    </div>
  );
}
