import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'message' | 'collab_invite' | 'edit_request' | 'edit_complete' | string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function notifIcon(type: string): string {
  switch (type) {
    case 'message':       return '💬';
    case 'collab_invite': return '🤝';
    case 'edit_request':  return '✒️';
    case 'edit_complete': return '✅';
    default:              return '🔔';
  }
}

// ─── NotificationBell ────────────────────────────────────────────────────────

export const NotificationBell: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  // ── Poll unread count ────────────────────────────────────────────────────

  const fetchUnreadCount = useCallback(async () => {
    try {
      const r = await fetchWithAuth('/api/notifications?unread=true');
      if (r.ok) {
        const d = await r.json();
        const list: Notification[] = d.notifications ?? d ?? [];
        setUnreadCount(list.filter(n => !n.isRead).length);
      }
    } catch { /* silent */ }
  }, [fetchWithAuth]);

  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = window.setInterval(fetchUnreadCount, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchUnreadCount]);

  // ── Fetch full list on open ──────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchWithAuth('/api/notifications')
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(d => setNotifications(d.notifications ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, fetchWithAuth]);

  // ── Close on outside click ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const markRead = async (id: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleClickNotif = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id);
    if (notif.link) {
      window.location.hash = notif.link;
      setOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetchWithAuth('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // fallback: mark each individually
      for (const n of notifications.filter(n => !n.isRead)) {
        await markRead(n.id);
      }
    }
  };

  const badge = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'rgba(201,168,76,0.12)' : 'transparent',
          border: open ? '1px solid rgba(201,168,76,0.3)' : '1px solid transparent',
          color: open ? '#c9a84c' : '#8a7a68',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        title="Notifications"
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.color = '#c9a84c';
            (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.08)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.color = '#8a7a68';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, padding: '0 3px',
            background: '#ef4444', color: '#fff',
            borderRadius: 999, fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, border: '1.5px solid #0d0b08',
          }}>
            {badge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0, width: 340, zIndex: 200,
          background: '#161210', border: '1px solid #2a2218',
          borderRadius: 16, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #2a2218', background: '#1e1a16',
          }}>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#ede6d6', fontSize: 14 }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                style={{
                  fontSize: 11, color: '#c9a84c', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
                }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton rounded-xl" style={{ height: 60 }} />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#4a3f35' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                <p style={{ fontSize: 13 }}>You're all caught up</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotif(n)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 16px', background: n.isRead ? 'transparent' : 'rgba(201,168,76,0.04)',
                    border: 'none', borderBottom: '1px solid #2a2218',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(201,168,76,0.04)')}
                >
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{notifIcon(n.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#ede6d6', flex: 1 }}>{n.title}</span>
                      {!n.isRead && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#8a7a68', marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>
                    <p style={{ fontSize: 11, color: '#4a3f35', marginTop: 3 }}>{fmtTime(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
