import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, LogOut, Shield,
  X, Loader2, Users, MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';
import { usersApi, messagesApi, ApiError } from '../lib/api';
import type { Conversation, UserSearchResult } from '../types';
import { Avatar } from '../components/ui/Avatar';
import { Logo } from '../components/ui/Logo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Button } from '../components/ui/Button';
import ChatWindow from '../components/chat/ChatWindow';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24)  return `${hrs}h`;
  if (days < 7)  return `${days}d`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ChatLayout() {
  const { user, accessToken, logout, isAuthenticated } = useAuth();
  const { error: toastError, success } = useToast();
  const navigate = useNavigate();

  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo]       = useState<Conversation | null>(null);
  const [loadingConvos, setLoadingConvos]   = useState(true);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading]   = useState(false);
  const [showSearch, setShowSearch]         = useState(false);
  const [mobileSidebarOpen, setMobileSidebar] = useState(false);
  const [loggingOut, setLoggingOut]         = useState(false);

  const searchRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated, navigate]);

  const loadConversations = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await messagesApi.getConversations(accessToken);
      setConversations(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) navigate('/login');
    } finally {
      setLoadingConvos(false);
    }
  }, [accessToken, navigate]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchRef.current ?? undefined);
    setSearchLoading(true);
    searchRef.current = setTimeout(async () => {
      try {
        const results = await usersApi.search(searchQuery, accessToken!);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, [searchQuery, accessToken]);

  const openSearch = () => {
    setShowSearch(true);
    setTimeout(() => searchInput.current?.focus(), 80);
  };

  const closeSearch = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const startConversation = (u: UserSearchResult) => {
    const existing = conversations.find(c => c.user_id === u.id);
    setActiveConvo(existing ?? {
      user_id: u.id,
      display_name: u.display_name,
      username: u.username,
      last_message_at: new Date().toISOString(),
    });
    closeSearch();
    setMobileSidebar(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      success('Signed out', 'Session securely ended.');
      navigate('/');
    } catch {
      toastError('Logout failed', 'Please try again');
    } finally {
      setLoggingOut(false);
    }
  };

  const onMessageSent = () => loadConversations();

  // ── Sidebar content ──────────────────────────────────────────────
  const sidebar = (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-surface)',
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 16px', height: 56, flexShrink: 0,
        borderBottom: '1px solid var(--border-dark)',
      }}>
        <Logo size="sm" showWordmark />
        <div style={{ flex: 1 }} />
        <ThemeToggle />
        <button
          onClick={openSearch}
          className="btn btn-icon"
          style={{ padding: 8 }}
          data-tooltip="New message"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Search panel */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: 'hidden',
              borderBottom: '1px solid var(--border-dark)',
              flexShrink: 0,
            }}
          >
            <div style={{ padding: '12px 12px 8px' }}>
              {/* Search input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0 12px', height: 38, borderRadius: 10,
                  background: 'var(--bg-sunken)', boxShadow: 'var(--neu-shadow-in)',
                  border: '1px solid var(--border-light)',
                }}>
                  <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  <input
                    ref={searchInput}
                    type="text"
                    placeholder="Search users…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      fontSize: '0.875rem', color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                    }}
                  />
                  {searchLoading && <Loader2 size={12} className="animate-spin" style={{ color: 'var(--text-muted)' }} />}
                </div>
                <button onClick={closeSearch} className="btn btn-icon" style={{ padding: 8 }}>
                  <X size={13} />
                </button>
              </div>

              {/* Results */}
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
                    No users found
                  </p>
                )}
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startConversation(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Avatar name={u.display_name} size="sm" />
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {u.display_name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                        @{u.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section label */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 8px', flexShrink: 0,
      }}>
        <span style={{
          fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
        }}>Messages</span>
        {conversations.length > 0 && (
          <span className="badge badge-muted" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>
            {conversations.length}
          </span>
        )}
      </div>

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
        {loadingConvos ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px' }}>
                <div className="shimmer-loading" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="shimmer-loading" style={{ height: 12, width: '55%', borderRadius: 6 }} />
                  <div className="shimmer-loading" style={{ height: 10, width: '75%', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, padding: '48px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: 'var(--brand-glow-xs)', color: 'var(--brand-primary)',
              boxShadow: 'var(--neu-shadow-out)', border: '1px solid var(--border-brand)',
            }}>
              <Users size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                No conversations yet
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                Search for a user to start messaging
              </p>
            </div>
            <button onClick={openSearch} className="btn btn-primary btn-sm" style={{ gap: 6 }}>
              <Plus size={13} /> Find someone
            </button>
          </div>
        ) : (
          conversations.map(convo => {
            const isActive = activeConvo?.user_id === convo.user_id;
            return (
              <button
                key={convo.user_id}
                onClick={() => { setActiveConvo(convo); setMobileSidebar(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 10px', borderRadius: 10, textAlign: 'left',
                  background: isActive ? 'var(--brand-glow-xs)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--border-brand)' : 'transparent'}`,
                  boxShadow: isActive ? 'var(--neu-shadow-in)' : 'none',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  marginBottom: 2,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-raised)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <Avatar name={convo.display_name} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{
                      fontSize: '0.875rem', fontWeight: 600, margin: 0,
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {convo.display_name}
                    </p>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatRelativeTime(convo.last_message_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    @{convo.username}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px', flexShrink: 0,
        borderTop: '1px solid var(--border-dark)',
        background: 'var(--bg-sunken)',
      }}>
        {user && (
          <>
            <Avatar name={user.display_name} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)',
                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.display_name}
              </p>
              <div className="enc-chip" style={{ marginTop: 3 }}>
                <Shield size={8} />Encrypted
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-icon"
              style={{ padding: 8, color: 'var(--danger)' }}
              data-tooltip="Sign out"
            >
              {loggingOut
                ? <Loader2 size={14} className="animate-spin" />
                : <LogOut size={14} />
              }
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: 'var(--bg-base)', fontFamily: 'var(--font-sans)',
    }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 264, flexShrink: 0, height: '100%',
          boxShadow: 'var(--neu-shadow-out)',
          borderRight: '1px solid var(--border-dark)',
          zIndex: 10,
        }}
      >
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 30,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
              }}
            />
            <motion.aside
              initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                position: 'fixed', left: 0, top: 0, height: '100%', width: 264,
                zIndex: 40, display: 'flex', flexDirection: 'column',
                boxShadow: 'var(--neu-shadow-lg)',
              }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {activeConvo ? (
          <ChatWindow
            conversation={activeConvo}
            onBack={() => setMobileSidebar(true)}
            onMessageSent={onMessageSent}
          />
        ) : (
          <EmptyState onSearchClick={openSearch} onMenuClick={() => setMobileSidebar(true)} />
        )}
      </main>
    </div>
  );
}

function EmptyState({ onSearchClick, onMenuClick }: { onSearchClick: () => void; onMenuClick: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mobile top bar */}
      <div
        className="md:hidden"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', height: 56, flexShrink: 0,
          borderBottom: '1px solid var(--border-dark)',
          background: 'var(--bg-surface)',
        }}
      >
        <button onClick={onMenuClick} className="btn btn-icon" style={{ padding: 8 }}>
          <MessageSquare size={15} />
        </button>
        <Logo size="sm" />
      </div>

      {/* Centre content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '40px 24px', textAlign: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="animate-float"
          style={{
            width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(135deg, var(--brand-primary), var(--accent-primary))',
            boxShadow: '0 12px 36px var(--brand-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Shield size={32} color="white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '1.25rem',
            letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0,
          }}>
            Select a conversation
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: 300, margin: 0, lineHeight: 1.6 }}>
            Choose from your conversations or search for someone new to message.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <Button variant="primary" leftIcon={<Search size={15} />} onClick={onSearchClick}>
            Find someone to message
          </Button>
          <div className="enc-chip">
            <Shield size={9} />
            All messages end-to-end encrypted
          </div>
        </motion.div>
      </div>
    </div>
  );
}
