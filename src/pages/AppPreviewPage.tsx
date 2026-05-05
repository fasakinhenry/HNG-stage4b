import { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { AppFrame } from '../components/layouts/AppFrame';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { ChatMessage } from '../components/messaging/ChatMessage';
import { ConversationItem } from '../components/messaging/ConversationItem';
import { MessageComposer } from '../components/messaging/MessageComposer';
import { createEncryptedPayload, decryptPayload } from '../services/cryptoService';
import { fetchConversationMessages, fetchConversations, fetchUserPublicKey, searchUsers, sendEncryptedMessage } from '../services/messageService';
import { websocketManager } from '../services/websocketService';
import type { ConversationMessage, ConversationSummary, UserSearchResult } from '../types/messaging';

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function sortMessagesByDate(items: ConversationMessage[]) {
  return [...items].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function mergeMessages(current: ConversationMessage[], next: ConversationMessage[]) {
  const merged = new Map<string, ConversationMessage>();

  for (const item of [...current, ...next]) {
    merged.set(item.id, item);
  }

  return sortMessagesByDate(Array.from(merged.values()));
}

async function decryptConversationMessage(message: ConversationMessage, viewerUserId: string | undefined, privateKey: CryptoKey | null) {
  if (!privateKey) {
    return message;
  }

  try {
    const preferSelfKey = message.fromUserId === viewerUserId;
    const plaintext = await decryptPayload(message.payload, privateKey, preferSelfKey);
    return { ...message, plaintext };
  } catch {
    return { ...message, plaintext: 'Unable to decrypt this message.' };
  }
}

export function AppPreviewPage() {
  const { user, session, privateKey } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [chatError, setChatError] = useState('');
  const [realtimeNotice, setRealtimeNotice] = useState('');
  const activeConversationIdRef = useRef(activeConversationId);
  const userIdRef = useRef(user?.id);
  const privateKeyRef = useRef(privateKey);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.userId === activeConversationId) ?? null,
    [activeConversationId, conversations]
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    privateKeyRef.current = privateKey;
  }, [privateKey]);

  function startConversationFromSearch(result: UserSearchResult) {
    setConversations((current) => {
      const existing = current.find((conversation) => conversation.userId === result.id);

      if (existing) {
        return current;
      }

      return [
        {
          userId: result.id,
          displayName: result.displayName,
          username: result.username,
          lastMessageAt: new Date().toISOString(),
          lastMessagePreview: 'Encrypted conversation started.',
          unreadCount: 0,
          isOnline: false
        },
        ...current
      ];
    });

    setActiveConversationId(result.id);
    setMessages([]);
    setQuery('');
  }

  useEffect(() => {
    if (!session) {
      return;
    }

    setIsLoadingConversations(true);
    setChatError('');
    fetchConversations(session.accessToken)
      .then((items) => {
        setConversations(items);
        setActiveConversationId((current) => current || items[0]?.userId || '');
      })
      .catch((error) => {
        setConversations([]);
        setChatError(error instanceof Error ? error.message : 'Failed to load conversations.');
      })
      .finally(() => setIsLoadingConversations(false));
  }, [session]);

  useEffect(() => {
    if (!session) {
      websocketManager.disconnect();
      setWsConnected(false);
      return;
    }

    websocketManager
      .connect(session.accessToken, {
        onMessage: (message) => {
          decryptConversationMessage(message, userIdRef.current, privateKeyRef.current).then((decryptedMessage) => {
            if (decryptedMessage.fromUserId === activeConversationIdRef.current || decryptedMessage.toUserId === activeConversationIdRef.current) {
              setMessages((current) => {
                if (current.some((currentMessage) => currentMessage.id === decryptedMessage.id)) {
                  return current;
                }
                return mergeMessages(current, [decryptedMessage]);
              });
            }

            setConversations((current) =>
              current
                .map((conversation) => {
                  if (conversation.userId === decryptedMessage.fromUserId || conversation.userId === decryptedMessage.toUserId) {
                    return {
                      ...conversation,
                      lastMessageAt: decryptedMessage.createdAt,
                      lastMessagePreview: 'Encrypted message'
                    };
                  }
                  return conversation;
                })
                .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime())
            );
          });
        },
        onConnected: () => {
          setWsConnected(true);
          setRealtimeNotice('');
        },
        onDisconnected: () => setWsConnected(false),
        onError: (error) => {
          setWsConnected(false);
          setRealtimeNotice(error);
        }
      })
      .catch((error) => {
        setWsConnected(false);
        setRealtimeNotice(error instanceof Error ? error.message : 'Realtime unavailable. Using REST fallback.');
      });

    return () => {
      websocketManager.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (!session || !activeConversationId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    setChatError('');
    fetchConversationMessages(session.accessToken, activeConversationId)
      .then(async (items) => {
        const decryptedItems = await Promise.all(items.map((item) => decryptConversationMessage(item, user?.id, privateKey)));
        setMessages(sortMessagesByDate(decryptedItems));
      })
      .catch((error) => {
        setMessages([]);
        setChatError(error instanceof Error ? error.message : 'Failed to load conversation history.');
      })
      .finally(() => setIsLoadingMessages(false));
  }, [activeConversationId, privateKey, session, user?.id]);

  useEffect(() => {
    if (!session || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = window.setTimeout(() => {
      searchUsers(session.accessToken, query)
        .then(setSearchResults)
        .catch((error) => {
          setSearchResults([]);
          setChatError(error instanceof Error ? error.message : 'User search failed.');
        });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, session]);

  async function handleSend() {
    if (!session || !user || !activeConversation || !draft.trim()) {
      return;
    }

    const plaintext = draft.trim();
    setIsSending(true);
    setChatError('');

    try {
      const recipientPublicKey = await fetchUserPublicKey(session.accessToken, activeConversation.userId);
      const payload = await createEncryptedPayload(plaintext, recipientPublicKey, user.public_key);

      const optimisticMessage: ConversationMessage = {
        id: `pending-${Date.now()}`,
        fromUserId: user.id,
        toUserId: activeConversation.userId,
        payload,
        delivered: false,
        createdAt: new Date().toISOString(),
        plaintext
      };
      setMessages((current) => mergeMessages(current, [optimisticMessage]));

      if (wsConnected && websocketManager.isConnected()) {
        websocketManager.sendMessage(activeConversation.userId, payload);
      } else {
        await sendEncryptedMessage(session.accessToken, activeConversation.userId, payload);
      }

      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.userId === activeConversation.userId
              ? {
                  ...conversation,
                  lastMessagePreview: 'Encrypted message',
                  lastMessageAt: new Date().toISOString()
                }
              : conversation
          )
          .sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime())
      );
      setDraft('');
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Message send failed.');
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
                    onClick={() => startConversationFromSearch(result)}
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
            <Badge className={`${wsConnected ? 'bg-green-500/20 text-green-600' : 'bg-amber-500/15 text-amber-700'}`}>
              <Clock3 className="h-3.5 w-3.5" />
              {wsConnected ? 'Real-time' : 'REST mode'}
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
              {chatError ? (
                <div className="rounded-2xl border border-[var(--danger)]/20 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-[var(--danger)]">
                  {chatError}
                </div>
              ) : null}
              {realtimeNotice ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                  {realtimeNotice}
                </div>
              ) : null}
              {isLoadingMessages ? (
                <div className="rounded-2xl bg-[var(--surface)] px-4 py-6 text-sm text-[var(--text-secondary)]">Loading messages...</div>
              ) : messages.length ? (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    text={message.plaintext ?? 'Encrypted message awaiting decryption.'}
                    timeLabel={formatMessageTime(message.createdAt)}
                    incoming={message.fromUserId !== user?.id}
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
