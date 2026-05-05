import { ArrowRight, Lock, MessageSquare, Sparkles, Zap } from 'lucide-react';
import { PublicLayout } from '../components/layouts/PublicLayout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const featureCards = [
  {
    icon: Lock,
    title: 'Client-side encryption',
    description: 'Keys are generated on the device first. The server only ever sees encrypted blobs.'
  },
  {
    icon: MessageSquare,
    title: 'Feels like a real messenger',
    description: 'Clean spacing, quick actions, active states, and a familiar conversation flow.'
  },
  {
    icon: Zap,
    title: 'Fast and responsive',
    description: 'Built to feel immediate on desktop and mobile, with lightweight transitions and feedback.'
  }
];

const workflow = [
  {
    step: '01',
    title: 'Register securely',
    text: 'Create your identity, generate keys on the client, and keep your private material wrapped locally.'
  },
  {
    step: '02',
    title: 'Find people quickly',
    text: 'Search usernames or display names and start a conversation without breaking the flow.'
  },
  {
    step: '03',
    title: 'Send encrypted messages',
    text: 'Messages are encrypted before upload, so the backend remains blind to plaintext.'
  },
  {
    step: '04',
    title: 'Read and reply',
    text: 'Real-time delivery, readable status cues, and an interface that stays calm under load.'
  }
];

export function LandingPage() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,132,208,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(102,184,232,0.14),transparent_28%),linear-gradient(180deg,rgba(0,132,208,0.08),transparent_50%)]" />
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 lg:px-8 lg:py-20">
          <div className="relative z-10 flex flex-col justify-center gap-7">
            <div className="space-y-4">
              <Badge className="w-fit bg-[linear-gradient(135deg,rgba(0,132,208,0.16),rgba(102,184,232,0.12))] text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                End-to-end encrypted messaging
              </Badge>
              <h1 className="brand-title max-w-2xl text-5xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-6xl">
                Private conversations with a calm, premium feel.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
                WhisperBox is built to satisfy the API guidelines and still feel like a real product from the first screen.
                Messages stay client-side encrypted, the backend only forwards ciphertext, and the interface stays clean.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" trailingIcon={<ArrowRight className="h-4 w-4" />} onClick={() => window.location.assign('/auth')}>
                Get started
              </Button>
              <Button variant="secondary" size="lg" onClick={() => window.location.assign('/app')}>
                Open demo app
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {featureCards.map((feature) => (
                <Card key={feature.title} className="rounded-[24px] p-4">
                  <feature.icon className="mb-3 h-5 w-5 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--text)]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <Card className="overflow-hidden rounded-[32px] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(240,242,245,0.94))] p-4 shadow-[0_28px_80px_rgba(0,132,208,0.10)] dark:bg-[linear-gradient(180deg,rgba(26,26,26,0.98),rgba(26,26,26,0.94))]">
              <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(0,132,208,0.14),rgba(102,184,232,0.10))] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">WhisperBox demo</p>
                    <h2 className="mt-1 text-2xl font-bold text-[var(--text)]">Encrypted inbox</h2>
                  </div>
                  <Badge className="bg-[var(--surface)] text-[var(--accent)]">Live preview</Badge>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="space-y-3 rounded-[26px] bg-[var(--surface)] p-3 shadow-sm">
                    {[
                      { name: 'Ava', preview: 'Encrypted key exchange looks good.', state: 'Active' },
                      { name: 'Noah', preview: 'Token refresh is ready.', state: 'Later' },
                      { name: 'Mina', preview: 'The design feels calmer now.', state: 'New' }
                    ].map((item, index) => (
                      <div
                        key={item.name}
                        className={`rounded-2xl px-3 py-3 ${index === 0 ? 'bg-[linear-gradient(135deg,rgba(0,132,208,0.12),rgba(102,184,232,0.08))]' : 'bg-[var(--surface-alt)]'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[var(--text)]">{item.name}</div>
                            <div className="mt-1 text-xs text-[var(--text-secondary)]">{item.preview}</div>
                          </div>
                          <div className="rounded-full bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--accent)]">{item.state}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[26px] bg-[var(--surface)] p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold text-[var(--text)]">Ava</div>
                        <div className="text-[var(--text-secondary)]">Online now</div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                        <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
                        E2EE
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="max-w-[85%] rounded-[24px] bg-[var(--surface-alt)] px-4 py-3 text-sm leading-6 text-[var(--text)]">
                        Payloads arrive encrypted, but the chat still feels readable and human.
                      </div>
                      <div className="ml-auto max-w-[85%] rounded-[24px] bg-[linear-gradient(135deg,var(--accent),#66b8e8)] px-4 py-3 text-sm leading-6 text-white shadow-[0_18px_40px_rgba(0,132,208,0.22)]">
                        That is exactly the balance we want.
                      </div>
                    </div>

                    <div className="mt-4 rounded-[22px] bg-[var(--surface-alt)] p-3 text-sm text-[var(--text-secondary)]">
                      Type a secure message...
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => (
            <Card key={item.step} className="rounded-[24px] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{item.step}</div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <Card className="rounded-[30px] p-6 sm:p-8">
            <div className="space-y-4">
              <Badge className="bg-[linear-gradient(135deg,rgba(0,132,208,0.12),rgba(102,184,232,0.08))] text-[var(--accent)]">Security posture</Badge>
              <h2 className="brand-title text-3xl font-bold text-[var(--text)] sm:text-4xl">The product is designed to feel secure before you read the specs.</h2>
              <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                The visual language stays minimal, the messaging surface stays familiar, and the encryption model stays explicit.
                No noisy dividers, no overbuilt chrome, just a clear product flow.
              </p>
            </div>
          </Card>

          <Card className="rounded-[30px] bg-[linear-gradient(135deg,rgba(0,132,208,0.12),rgba(102,184,232,0.08))] p-6 sm:p-8">
            <div className="space-y-4">
              <Badge className="bg-[var(--surface)] text-[var(--accent)]">Ready to use</Badge>
              <h3 className="text-2xl font-bold text-[var(--text)]">Open the demo app and start exploring the experience.</h3>
              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                You can move into the authenticated app shell, search conversations, and send demo encrypted messages while the full crypto flow lands in the next stage.
              </p>
              <Button size="lg" onClick={() => window.location.assign('/app')}>
                Launch app preview
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
