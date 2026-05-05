import { cn } from '../../lib/cn';

interface ChatMessageProps {
  text: string;
  timeLabel: string;
  incoming?: boolean;
  delivered?: boolean;
}

export function ChatMessage({ text, timeLabel, incoming = false, delivered = true }: ChatMessageProps) {
  return (
    <div className={cn('flex gap-3', incoming ? 'justify-start' : 'justify-end')}>
      {incoming ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-sm font-semibold text-[var(--text)]">
          A
        </div>
      ) : null}
      <div
        className={cn(
          'max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm',
          incoming
            ? 'bg-[var(--surface-alt)] text-[var(--text)]'
            : 'bg-[linear-gradient(135deg,var(--accent),#66b8e8)] text-white shadow-[0_18px_40px_rgba(0,132,208,0.20)]'
        )}
      >
        <p>{text}</p>
        <div className={cn('mt-2 flex items-center justify-between gap-4 text-[11px]', incoming ? 'text-[var(--text-secondary)]' : 'text-white/80')}>
          <span>{timeLabel}</span>
          {!incoming ? <span>{delivered ? 'Delivered' : 'Sending'}</span> : null}
        </div>
      </div>
    </div>
  );
}
