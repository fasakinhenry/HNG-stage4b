import { cn } from '../../lib/cn';
import type { ConversationSummary } from '../../types/messaging';

interface ConversationItemProps {
  conversation: ConversationSummary;
  active?: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, active = false, onClick }: ConversationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'card cursor-pointer rounded-2xl px-4 py-4 text-left transition-all duration-200 hover:-translate-y-0.5',
        active ? 'border-[var(--accent)] shadow-[0_10px_30px_rgba(0,132,208,0.12)]' : 'hover:bg-[var(--surface-alt)]'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text)]">{conversation.displayName}</span>
            <span className="text-xs text-[var(--text-secondary)]">@{conversation.username}</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
            {conversation.lastMessagePreview ?? 'Encrypted message waiting to be decrypted.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          <span className={cn('h-2.5 w-2.5 rounded-full', conversation.isOnline ? 'bg-[var(--success)]' : 'bg-[var(--border)]')} />
          {conversation.unreadCount ? (
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-white">
              {conversation.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}
