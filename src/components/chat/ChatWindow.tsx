import {
  useState, useEffect, useRef, useCallback,
  type FormEvent, type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Shield, Lock, AlertTriangle,
  ChevronDown, Loader2, MoreVertical,
} from 'lucide-react';
import type { Conversation, Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../ui/Toast';
import { messagesApi, usersApi, ApiError } from '../../lib/api';
import {
  encryptMessage, decryptMessage,
  importPublicKey, importOwnPublicKey,
} from '../../lib/crypto';
import { Avatar } from '../ui/Avatar';

const WS_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://whisperbox.koyeb.app')
  .replace('https://', 'wss://')
  .replace('http://', 'ws://');

interface DecryptedMessage extends Message {
  plaintext: string;
  decryptionError: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function dateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

interface Props {
  conversation: Conversation;
  onBack: () => void;
  onMessageSent: () => void;
}

export default function ChatWindow({ conversation, onBack, onMessageSent }: Props) {
  const { user, accessToken, privateKey } = useAuth();
  const { error: toastError, warning } = useToast();

  const [messages, setMessages]         = useState<DecryptedMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs]   = useState(true);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [recipientKey, setRecipientKey] = useState<CryptoKey | null>(null);
  const [ownPublicKey, setOwnPublicKey] = useState<CryptoKey | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasMore, setHasMore]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const listRef    = useRef<HTMLDivElement>(null);
  const wsRef      = useRef<WebSocket | null>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // ── Import keys ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !user) return;
    (async () => {
      try {
        const [recipData, ownKey] = await Promise.all([
          usersApi.getPublicKey(conversation.user_id, accessToken),
          importOwnPublicKey(user.public_key),
        ]);
        setRecipientKey(await importPublicKey(recipData.public_key));
        setOwnPublicKey(ownKey);
      } catch {
        toastError('Key error', 'Could not load encryption keys');
      }
    })();
  }, [conversation.user_id, accessToken, user]);

  // ── Decrypt helper ──────────────────────────────────────
  const decrypt = useCallback(async (msg: Message): Promise<DecryptedMessage> => {
    if (!privateKey) return { ...msg, plaintext: '[Re-login to decrypt messages]', decryptionError: true };
    try {
      const plaintext = await decryptMessage(msg.payload, privateKey, msg.from_user_id === user?.id);
      return { ...msg, plaintext, decryptionError: false };
    } catch {
      return { ...msg, plaintext: '[Could not decrypt]', decryptionError: true };
    }
  }, [privateKey, user?.id]);

  // ── Load history ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    setMessages([]);
    setLoadingMsgs(true);
    setHasMore(false);
    (async () => {
      try {
        const raw = await messagesApi.getMessages(conversation.user_id, accessToken, 30);
        const decrypted = await Promise.all(raw.map(decrypt));
        setMessages(decrypted.reverse());
        setHasMore(raw.length === 30);
      } catch (err) {
        if (err instanceof ApiError && err.status !== 404) toastError('Failed to load messages', '');
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [conversation.user_id, accessToken, decrypt]);

  // ── WebSocket ────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    let ws: WebSocket;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws?token=${accessToken}`);
      wsRef.current = ws;
      ws.onopen  = () => { if (alive) setIsConnected(true); };
      ws.onclose = () => {
        if (alive) { setIsConnected(false); retryTimer = setTimeout(connect, 4000); }
      };
      ws.onerror = () => ws.close();
      ws.onmessage = async (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.event === 'message.receive' && data.from_user_id === conversation.user_id) {
            const dec = await decrypt(data as Message);
            setMessages(prev => [...prev, dec]);
            onMessageSent();
          }
        } catch { /* ignore */ }
      };
    };
    connect();
    return () => { alive = false; clearTimeout(retryTimer); ws?.close(); };
  }, [accessToken, conversation.user_id]);

  // ── Scroll to bottom on new messages ───────────────────
  useEffect(() => {
    if (!loadingMsgs) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loadingMsgs]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 180);
  };

  // ── Load older messages ─────────────────────────────────
  const loadMore = async () => {
    if (!accessToken || !messages.length || loadingMore) return;
    setLoadingMore(true);
    try {
      const raw = await messagesApi.getMessages(
        conversation.user_id, accessToken, 30, messages[0].created_at
      );
      if (!raw.length) { setHasMore(false); return; }
      const dec = await Promise.all(raw.map(decrypt));
      setMessages(prev => [...dec.reverse(), ...prev]);
      setHasMore(raw.length === 30);
    } catch { toastError('Failed to load more', ''); }
    finally { setLoadingMore(false); }
  };

  // ── Send ────────────────────────────────────────────────
  const sendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending || !recipientKey || !ownPublicKey) return;
    if (!privateKey) { warning('Session expired', 'Re-login to send messages.'); return; }

    setSending(true);
    setInput('');
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const payload = await encryptMessage(text, recipientKey, ownPublicKey);
      let sentMsg: Message;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ event: 'message.send', to: conversation.user_id, payload }));
        sentMsg = {
          id: `opt-${Date.now()}`,
          from_user_id: user!.id,
          to_user_id: conversation.user_id,
          payload,
          delivered: false,
          created_at: new Date().toISOString(),
        };
      } else {
        sentMsg = await messagesApi.sendMessage(conversation.user_id, payload, accessToken!);
      }

      const dec = await decrypt(sentMsg);
      setMessages(prev => [...prev, dec]);
      onMessageSent();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
    } catch {
      toastError('Failed to send', 'Check your connection and try again.');
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  // ── Group by date ───────────────────────────────────────
  const grouped: { separator?: string; msg: DecryptedMessage }[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = dateSeparator(msg.created_at);
    if (d !== lastDate) { grouped.push({ separator: d, msg }); lastDate = d; }
    else grouped.push({ msg });
  }

  const canSend = !sending && !!recipientKey && !!ownPublicKey && input.trim().length > 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-base)', position: 'relative',
    }}>

      {/* ── Header ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, flexShrink: 0,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-dark)',
        boxShadow: '0 1px 0 var(--border-dark)',
        zIndex: 5,
      }}>
        {/* Mobile back */}
        <button onClick={onBack} className="md:hidden btn btn-icon" style={{ padding: 8 }}>
          <ArrowLeft size={15} />
        </button>

        <Avatar name={conversation.display_name} size="md" online={isConnected} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)',
            margin: 0, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {conversation.display_name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <div className="enc-chip"><Lock size={8} />E2E Encrypted</div>
            <span style={{
              fontSize: '0.6875rem',
              color: isConnected ? 'var(--accent-primary)' : 'var(--text-muted)',
            }}>
              {isConnected ? '● Live' : '● Offline'}
            </span>
          </div>
        </div>

        <button className="btn btn-icon" style={{ padding: 8 }}>
          <MoreVertical size={15} />
        </button>
      </div>

      {/* ── Message list ────────────────────────── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Load more */}
        {hasMore && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn btn-ghost btn-sm"
              style={{ gap: 6 }}
            >
              {loadingMore ? <Loader2 size={12} className="animate-spin" /> : null}
              Load older messages
            </button>
          </div>
        )}

        {/* Skeleton */}
        {loadingMsgs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[70, 120, 90, 140, 80, 110].map((w, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
                <div className="shimmer-loading" style={{
                  height: 36, width: w, borderRadius: 16,
                }} />
              </div>
            ))}
          </div>
        )}

        {/* Messages */}
        {!loadingMsgs && grouped.map(({ separator, msg }, i) => {
          const isMine = msg.from_user_id === user?.id;
          return (
            <div key={`${msg.id}-${i}`}>
              {separator && (
                <div className="divider-label" style={{ margin: '16px 0 12px' }}>
                  <span>{separator}</span>
                </div>
              )}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    display: 'flex', marginBottom: 4,
                    justifyContent: isMine ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isMine && (
                    <div style={{ flexShrink: 0, marginRight: 8, alignSelf: 'flex-end', marginBottom: 4 }}>
                      <Avatar name={conversation.display_name} size="sm" />
                    </div>
                  )}

                  <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}>
                    <div
                      className={isMine ? 'bubble-out' : 'bubble-in'}
                      style={{
                        padding: '9px 14px',
                        opacity: msg.decryptionError ? 0.65 : 1,
                      }}
                    >
                      {msg.decryptionError && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          marginBottom: 4,
                        }}>
                          <AlertTriangle size={11} style={{ color: 'var(--warning)' }} />
                          <span style={{ fontSize: '0.6875rem', color: 'var(--warning)' }}>Decryption failed</span>
                        </div>
                      )}
                      <p style={{
                        fontSize: '0.9rem', lineHeight: 1.5, margin: 0,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        fontFamily: 'var(--font-sans)',
                      }}>
                        {msg.plaintext}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      marginTop: 3, padding: '0 4px',
                    }}>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {formatTime(msg.created_at)}
                      </span>
                      <Lock size={8} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}

        {/* Empty state */}
        {!loadingMsgs && messages.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 12, textAlign: 'center', padding: '48px 24px',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'var(--brand-glow-xs)',
              border: '1px solid var(--border-brand)',
              color: 'var(--brand-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                Start your encrypted conversation
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, maxWidth: 240 }}>
                Messages with {conversation.display_name} are end-to-end encrypted. Only you two can read them.
              </p>
            </div>
            <div className="enc-chip"><Lock size={9} />E2E Encrypted · Zero knowledge</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="btn btn-icon"
            style={{
              position: 'absolute', right: 20, bottom: 88, zIndex: 10,
              padding: 8, boxShadow: 'var(--neu-shadow-lg)',
            }}
          >
            <ChevronDown size={15} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input area ──────────────────────────── */}
      <form
        onSubmit={sendMessage}
        style={{
          flexShrink: 0, padding: '12px 16px',
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-dark)',
        }}
      >
        {/* No private key warning */}
        {!privateKey && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10, marginBottom: 10,
            background: 'var(--warning-bg)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: 'var(--warning)', fontSize: '0.8125rem',
          }}>
            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
            <span>
              Decryption keys not loaded.{' '}
              <strong>Re-login to restore full functionality.</strong>
            </span>
          </div>
        )}

        {/* Textarea + send */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 10,
          padding: '10px 12px', borderRadius: 14,
          background: 'var(--bg-sunken)', boxShadow: 'var(--neu-shadow-in)',
          border: '1px solid var(--border-light)',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type an encrypted message…"
            disabled={sending || !recipientKey}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              resize: 'none', fontSize: '0.9rem', lineHeight: 1.5,
              color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
              caretColor: 'var(--brand-primary)',
              maxHeight: 128, minHeight: 22,
              paddingTop: 1,
            }}
          />
          <button
            type="submit"
            disabled={!canSend}
            className={canSend ? 'btn btn-icon-brand' : 'btn btn-icon'}
            style={{ padding: 9, borderRadius: 10, flexShrink: 0, transition: 'all 0.15s' }}
          >
            {sending
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>

        {/* Footer hint */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 5, marginTop: 7,
        }}>
          <Lock size={9} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            End-to-end encrypted · Enter to send
          </span>
        </div>
      </form>
    </div>
  );
}
