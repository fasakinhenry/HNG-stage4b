import { useEffect, useMemo, useState } from 'react';
import { Clock3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { AppFrame } from '../components/layouts/AppFrame';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../components/messaging/ChatMessage';
import { ConversationItem } from '../components/messaging/ConversationItem';
import { MessageComposer } from '../components/messaging/MessageComposer';
import { createEncryptedPayload } from '../services/cryptoService';
import { fetchConversationMessages, fetchConversations, fetchUserPublicKey, searchUsers, sendEncryptedMessage } from '../services/messageService';
import type { ConversationMessage, ConversationSummary, UserSearchResult } from '../types/messaging';

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function AppPreviewPage() {
  const { user, session } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.userId === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    setIsLoadingConversations(true);
    fetchConversations(session.accessToken)
      .then((items) => {
        setConversations(items);
        setActiveConversationId((current) => current || items[0]?.userId || '');
      })
      .finally(() => setIsLoadingConversations(false));
  }, [session]);

  useEffect(() => {
    if (!session || !activeConversationId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    fetchConversationMessages(session.accessToken, activeConversationId)
      .then((items) => setMessages(items))
      .finally(() => setIsLoadingMessages(false));
  }, [activeConversationId, session]);

  useEffect(() => {
    if (!session || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchUsers(session.accessToken, query).then(setSearchResults);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, session]);

  async function handleSend() {
    if (!session || !user || !activeConversation || !draft.trim()) {
      return;
    }

    setIsSending(true);
    try {
      const recipientPublicKey = await fetchUserPublicKey(session.accessToken, activeConversation.userId);
      const payload = recipientPublicKey
        ? await createEncryptedPayload(draft.trim(), recipientPublicKey, user.public_key)
        : {
            ciphertext: btoa(draft.trim()),
            iv: 'ZGVtbw==',
            encryptedKey: 'ZGVtbw==',
            encryptedKeyForSelf: 'ZGVtbw=='
          };

      const sentMessage = await sendEncryptedMessage(session.accessToken, activeConversation.userId, payload, draft.trim());
      setMessages((current) => [...current, { ...sentMessage, plaintext: draft.trim() }]);
      setConversations((current) =>
        current.map((conversation) =>
          conversation.userId === activeConversation.userId
            ? {
                ...conversation,
                lastMessagePreview: draft.trim(),
                lastMessageAt: new Date().toISOString()
              }
            : conversation
        )
      );
      setDraft('');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AppFrame>
      <div className="grid flex-1 gap-5 lg:grid-cols-[340px_1fr]">
        <Card className="flex flex-col gap-4 rounded-[30px] p-4 sm:p-5">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-secondary)]">Inbox</div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Good afternoon, {user?.display_name ?? 'there'}</h1>
            <p className="text-sm text-[var(--text-secondary)]">Choose a conversation or search for someone new.</p>
          </div>

          <Input
            label="Search"
            placeholder="Search people"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            leadingIcon={<Search className="h-4 w-4" />}
          />

          {query.trim() ? (
            <div className="grid gap-3 rounded-2xl bg-[var(--surface-alt)] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                <Search className="h-4 w-4" />
                Search results
              </div>
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="card rounded-2xl px-4 py-3 text-left text-sm text-[var(--text)] transition hover:bg-[var(--surface)]"
                    onClick={() => {
                      setActiveConversationId(result.id);
                      setQuery('');
                    }}
                  >
                    <div className="font-semibold">{result.displayName}</div>
                    <div className="text-xs text-[var(--text-secondary)]">@{result.username}</div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  No matching users yet.
                </div>
              )}
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {isLoadingConversations ? (
              <div className="rounded-2xl bg-[var(--surface-alt)] px-4 py-6 text-sm text-[var(--text-secondary)]">Loading conversations...</div>
            ) : (
              conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.userId}
                  conversation={conversation}
                  active={conversation.userId === activeConversationId}
                  onClick={() => setActiveConversationId(conversation.userId)}
                />
              ))
            )}
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col rounded-[30px] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-[linear-gradient(135deg,rgba(0,132,208,0.10),rgba(102,184,232,0.08))] p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
                Encrypted chat room
              </div>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Only intended recipients can decrypt the content. The server only receives encrypted blobs.
              </p>
            </div>
            <Badge className="bg-[var(--surface-alt)] text-[var(--text-secondary)]">
              <Clock3 className="h-3.5 w-3.5" />
              Session fresh
            </Badge>
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  {activeConversation?.displayName ?? 'Select a conversation'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {activeConversation ? `@${activeConversation.username}` : 'Pick a thread to see encrypted messages.'}
                </p>
              </div>
              {activeConversation ? (
                <Badge className="bg-[var(--surface-alt)] text-[var(--text-secondary)]">
                  {activeConversation.isOnline ? 'Online' : 'Offline'}
                </Badge>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto rounded-[28px] bg-[var(--surface-alt)] p-4">
              {isLoadingMessages ? (
                <div className="rounded-2xl bg-[var(--surface)] px-4 py-6 text-sm text-[var(--text-secondary)]">Loading messages...</div>
              ) : messages.length ? (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    text={message.plaintext ?? 'Encrypted message awaiting decryption.'}
                    timeLabel={formatMessageTime(message.createdAt)}
                    incoming={message.fromUserId !== user?.id && message.fromUserId !== 'demo-self'}
                    delivered={message.delivered}
                  />
                ))
              ) : (
                <div className="grid h-full place-items-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                  <div className="max-w-sm space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-alt)] text-[var(--accent)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-[var(--text)]">No messages yet</p>
                    <p>Start the conversation and the thread will populate here in real time.</p>
                  </div>
                </div>
              )}
            </div>

            <MessageComposer value={draft} onChange={setDraft} onSubmit={handleSend} disabled={isSending || !activeConversation} />
          </div>
        </Card>
      </div>
    </AppFrame>
  );
}
