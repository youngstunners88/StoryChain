import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SpeakButton } from '../components/VoicePlayer';
import { VoiceCallModal } from '../components/VoiceCallModal';
import { startListening } from '../services/voiceService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  unread_count: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function nameColor(name: string): string {
  const COLORS = ['#c9a84c', '#a78bfa', '#2dd4bf', '#fb7185', '#34d399', '#f97316', '#60a5fa', '#e879f9'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

// ─── New Message Modal ────────────────────────────────────────────────────────

const NewMessageModal: React.FC<{
  onClose: () => void;
  onStart: (partnerId: string) => void;
}> = ({ onClose, onStart }) => {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{ background: '#161210', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #c9a84c, #a78bfa)' }} />
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold" style={{ color: '#ede6d6' }}>New Message</h2>
            <button onClick={onClose} style={{ color: '#4a3f35', background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <label className="text-xs block mb-2" style={{ color: '#8a7a68' }}>Writer ID or Display Name</label>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onStart(value.trim()); onClose(); } }}
            placeholder="Enter writer's ID…"
            className="input-ink w-full px-4 py-3 text-sm mb-4"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => { if (value.trim()) { onStart(value.trim()); onClose(); } }}
              disabled={!value.trim()}
              className="btn-gold flex-1 py-2.5 text-sm">
              Start Conversation
            </button>
            <button onClick={onClose} className="btn-ghost px-4 py-2.5 text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MessagingPanel ───────────────────────────────────────────────────────────

export const MessagingPanel: React.FC = () => {
  const { fetchWithAuth, penName } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [compose, setCompose] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  const activeConvoInfo = conversations.find(c => c.sender_id === activePartnerId);
  const isActiveAgent = activePartnerId?.startsWith('agent_') || activePartnerId?.startsWith('editor_agent_');

  const loadConversations = useCallback(async () => {
    try {
      const r = await fetchWithAuth('/api/messages');
      if (r.ok) {
        const d = await r.json();
        setConversations(d.conversations ?? d ?? []);
      }
    } catch { /* silent */ }
    finally { setLoadingConvos(false); }
  }, [fetchWithAuth]);

  const loadThread = useCallback(async (partnerId: string, markRead = true) => {
    setLoadingThread(true);
    try {
      const r = await fetchWithAuth(`/api/messages/${partnerId}`);
      if (r.ok) {
        const d = await r.json();
        setMessages(d.messages ?? d ?? []);
      }
      if (markRead) {
        fetchWithAuth(`/api/messages/${partnerId}/read`, { method: 'PATCH' }).catch(() => {});
        setConversations(prev => prev.map(c =>
          c.sender_id === partnerId ? { ...c, unread_count: 0 } : c
        ));
      }
    } catch { /* silent */ }
    finally { setLoadingThread(false); }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadConversations();
    pollRef.current = window.setInterval(loadConversations, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadConversations]);

  useEffect(() => {
    if (activePartnerId) loadThread(activePartnerId);
  }, [activePartnerId, loadThread]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSelectConvo = (partnerId: string) => {
    setActivePartnerId(partnerId);
  };

  const handleToggleMic = () => {
    if (isRecording) {
      stopRecordingRef.current?.();
      stopRecordingRef.current = null;
      setIsRecording(false);
    } else {
      setIsRecording(true);
      let transcript = '';
      const stop = startListening(
        (text, isFinal) => {
          if (isFinal) { transcript = text; setCompose(prev => (prev + ' ' + text).trim()); }
          else setCompose(prev => (prev.replace(/ ?…$/, '') + ' ' + text + '…').trim());
        },
        () => { setIsRecording(false); stopRecordingRef.current = null; }
      );
      stopRecordingRef.current = stop ?? null;
    }
  };

  const handleSend = async () => {
    if (!compose.trim() || !activePartnerId || sending) return;
    const text = compose.trim();
    setSending(true);
    setCompose('');
    // Optimistic add
    const optimistic: Message = {
      id: `opt_${Date.now()}`,
      senderId: 'me',
      senderName: penName || 'You',
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await fetchWithAuth(`/api/messages/${activePartnerId}`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });
      await fetchWithAuth(`/api/messages/${activePartnerId}/read`, { method: 'PATCH' });
      await loadThread(activePartnerId, false);
      await loadConversations();
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const activeConvo = conversations.find(c => c.sender_id === activePartnerId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>Messages</h1>
          <p className="text-sm" style={{ color: '#8a7a68' }}>Private conversations with writers</p>
        </div>
        <button onClick={() => setShowNewMsg(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', cursor: 'pointer' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Message
        </button>
      </div>

      {/* Two-panel layout */}
      <div className="rounded-2xl overflow-hidden flex" style={{ background: '#161210', border: '1px solid #2a2218', minHeight: 520 }}>
        {/* Conversation list */}
        <div className="flex-shrink-0 overflow-y-auto"
          style={{ width: 280, borderRight: '1px solid #2a2218', background: '#111009' }}>
          {loadingConvos ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#161210' }}>
                  <div className="skeleton rounded-full flex-shrink-0" style={{ width: 40, height: 40 }} />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-2.5 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center" style={{ color: '#4a3f35' }}>
              <div className="text-3xl mb-3">💬</div>
              <p className="text-xs leading-relaxed">No conversations yet. Start a conversation from a writer's profile.</p>
            </div>
          ) : (
            <div className="py-2">
              {conversations.map(c => {
                const active = activePartnerId === c.sender_id;
                const color = nameColor(c.sender_name);
                return (
                  <button key={c.conversation_id}
                    onClick={() => handleSelectConvo(c.sender_id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
                      borderLeft: active ? '2px solid #c9a84c' : '2px solid transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{ width: 40, height: 40, background: `${color}22`, border: `2px solid ${color}40`, color }}>
                      {c.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium truncate" style={{ color: '#ede6d6' }}>{c.sender_name}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: '#4a3f35' }}>{fmtTime(c.created_at)}</span>
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: '#8a7a68' }}>{c.content}</p>
                    </div>
                    {c.unread_count > 0 && (
                      <div className="flex-shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ minWidth: 18, height: 18, padding: '0 4px', background: '#c9a84c', color: '#0d0b08' }}>
                        {c.unread_count > 9 ? '9+' : c.unread_count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread view */}
        <div className="flex-1 flex flex-col min-w-0">
          {activePartnerId ? (
            <>
              {/* Thread header */}
              <div className="px-5 py-4 flex items-center gap-3 flex-shrink-0"
                style={{ borderBottom: '1px solid #2a2218', background: '#161210' }}>
                {activeConvoInfo && (
                  <>
                    <div className="rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ width: 36, height: 36, background: `${nameColor(activeConvoInfo.sender_name)}22`, color: nameColor(activeConvoInfo.sender_name) }}>
                      {activeConvoInfo.sender_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-serif font-semibold flex-1" style={{ color: '#ede6d6' }}>{activeConvoInfo.sender_name}</span>
                  </>
                )}
                {/* Voice call button */}
                <button
                  onClick={() => setShowVoiceCall(true)}
                  title="Voice call"
                  style={{
                    width: 34, height: 34, borderRadius: '50%', border: '1px solid rgba(201,168,76,0.25)',
                    background: 'rgba(201,168,76,0.08)', color: '#c9a84c',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div ref={threadRef} className="flex-1 overflow-y-auto p-5 space-y-3"
                style={{ background: '#0f0d0b' }}>
                {loadingThread ? (
                  <div className="flex justify-center pt-8">
                    <div className="w-6 h-6 rounded-full border-2 animate-spin"
                      style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center pt-12" style={{ color: '#4a3f35' }}>
                    <div className="text-3xl mb-2">✉️</div>
                    <p className="text-sm">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.senderId === 'me' || msg.senderName === penName;
                    const isAgentMsg = msg.senderId?.startsWith('agent_') || msg.senderId?.startsWith('editor_agent_');
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
                        <div className="max-w-xs rounded-2xl px-4 py-2.5"
                          style={{
                            background: isOwn ? 'linear-gradient(135deg, #c9a84c, #b8942e)' : '#1e1a16',
                            border: isOwn ? 'none' : '1px solid #2a2218',
                            borderBottomRightRadius: isOwn ? 4 : undefined,
                            borderBottomLeftRadius: isOwn ? undefined : 4,
                          }}>
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-0.5" style={{ color: nameColor(msg.senderName) }}>
                              {msg.senderName}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed" style={{ color: isOwn ? '#0d0b08' : '#ede6d6' }}>
                            {msg.content}
                          </p>
                          <p className="text-xs mt-1 text-right" style={{ color: isOwn ? 'rgba(13,11,8,0.5)' : '#4a3f35' }}>
                            {fmtTime(msg.createdAt)}
                          </p>
                        </div>
                        {/* Speak button on agent messages */}
                        {!isOwn && (isAgentMsg || isActiveAgent) && (
                          <SpeakButton
                            text={msg.content}
                            agentId={msg.senderId}
                            agentName={msg.senderName}
                            size="sm"
                            color={nameColor(msg.senderName)}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compose */}
              <div className="px-4 py-3 flex items-end gap-2 flex-shrink-0"
                style={{ borderTop: '1px solid #2a2218', background: '#161210' }}>
                {/* Mic button */}
                <button
                  onClick={handleToggleMic}
                  title={isRecording ? 'Stop recording' : 'Speak your message'}
                  style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: `1px solid ${isRecording ? '#dc2626' : 'rgba(201,168,76,0.3)'}`,
                    background: isRecording ? 'rgba(220,38,38,0.15)' : 'rgba(201,168,76,0.08)',
                    color: isRecording ? '#dc2626' : '#c9a84c',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>

                <textarea
                  value={compose}
                  onChange={e => setCompose(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={isRecording ? 'Listening…' : 'Write a message… (Enter to send)'}
                  rows={2}
                  className="input-ink flex-1 px-4 py-3 text-sm resize-none"
                  style={{ minHeight: 60, maxHeight: 120 }}
                />
                <button onClick={handleSend} disabled={!compose.trim() || sending}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: compose.trim() ? 'linear-gradient(135deg, #c9a84c, #b8942e)' : 'rgba(201,168,76,0.1)',
                    border: '1px solid rgba(201,168,76,0.3)',
                    cursor: compose.trim() ? 'pointer' : 'not-allowed',
                  }}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={compose.trim() ? '#0d0b08' : '#4a3f35'} strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center" style={{ color: '#4a3f35' }}>
              <div className="text-5xl mb-4">💬</div>
              <p className="font-serif text-lg mb-1" style={{ color: '#8a7a68' }}>Select a conversation</p>
              <p className="text-sm">or start a new one</p>
              <button onClick={() => setShowNewMsg(true)}
                className="mt-5 px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', cursor: 'pointer' }}>
                New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {showVoiceCall && activePartnerId && (
        <VoiceCallModal
          partnerId={activePartnerId}
          partnerName={activeConvoInfo?.sender_name ?? activePartnerId}
          isAgent={!!isActiveAgent}
          onClose={() => setShowVoiceCall(false)}
        />
      )}

      {showNewMsg && (
        <NewMessageModal
          onClose={() => setShowNewMsg(false)}
          onStart={partnerId => {
            setActivePartnerId(partnerId);
            // add skeleton conversation if not already present
            if (!conversations.find(c => c.sender_id === partnerId)) {
              const fake: Conversation = {
                conversation_id: partnerId,
                sender_id: partnerId,
                sender_name: partnerId,
                content: '',
                created_at: new Date().toISOString(),
                unread_count: 0,
              };
              setConversations(prev => [fake, ...prev]);
            }
          }}
        />
      )}
    </div>
  );
};

export default MessagingPanel;
