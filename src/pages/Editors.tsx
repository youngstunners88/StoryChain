import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Editor {
  userId: string;
  displayName: string;
  editorType: 'ai' | 'human' | 'foreign' | string;
  genreFocus: string;
  specialties: string[];
  avatarUrl?: string;
  avatarColor: string;
  avatarEmoji: string;
  isAgent?: boolean;
  completedEdits: number;
  about: string;
}

interface Story {
  id: string;
  title: string;
}

interface Submission {
  id: string;
  storyId: string;
  storyTitle: string;
  editorId: string;
  editorName: string;
  status: 'submitted' | 'in_review' | 'editing' | 'completed' | string;
  submissionNotes: string;
  editorNotes?: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted:  { label: 'Submitted',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  in_review:  { label: 'In Review',  color: '#facc15', bg: 'rgba(250,204,21,0.12)' },
  editing:    { label: 'Editing',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  completed:  { label: 'Completed',  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
};

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, color: '#8a7a68', bg: 'rgba(138,122,104,0.1)' };
}

const EDITOR_TYPE_COLORS: Record<string, string> = {
  ai:      '#2dd4bf',
  human:   '#c9a84c',
  foreign: '#a78bfa',
};

function editorTypeColor(type: string) {
  return EDITOR_TYPE_COLORS[type] ?? '#8a7a68';
}

function editorTypeLabel(type: string, isAgent?: boolean) {
  if (type === 'ai' && isAgent === false) return 'Foreign AI Editor';
  switch (type) {
    case 'ai':    return 'AI Editor';
    case 'human': return 'Human Editor';
    default:      return type;
  }
}

// ─── Editor Card ─────────────────────────────────────────────────────────────

const EditorCard: React.FC<{ editor: Editor; onSubmit: () => void; onMessage: () => void }> = ({ editor, onSubmit, onMessage }) => {
  const accent = editor.avatarColor || editorTypeColor(editor.editorType);
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#161210', border: `1px solid ${accent}30` }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${accent}22`;
        (e.currentTarget as HTMLElement).style.borderColor = `${accent}60`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = `${accent}30`;
      }}>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}06 60%)` }}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${accent}, transparent)`, transform: 'translate(20%, -20%)' }} />
        <div className="flex items-start gap-3 relative z-10">
          {editor.avatarUrl ? (
            <img src={editor.avatarUrl} alt={editor.displayName}
              style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accent}40`, flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: `radial-gradient(135deg at 30% 30%, ${accent}33, ${accent}11)`,
              border: `2px solid ${accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {editor.avatarEmoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-serif font-bold text-base" style={{ color: '#ede6d6' }}>{editor.displayName}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}>
                {editorTypeLabel(editor.editorType, editor.isAgent)}
              </span>
            </div>
            {editor.genreFocus && (
              <div className="text-xs font-semibold" style={{ color: accent }}>{editor.genreFocus}</div>
            )}
            <div className="text-xs mt-1" style={{ color: '#4a3f35' }}>
              ✓ {editor.completedEdits} edits completed
            </div>
          </div>
        </div>
      </div>

      {/* Specialties */}
      {editor.specialties && editor.specialties.length > 0 && (
        <div className="px-5 py-3 flex flex-wrap gap-1.5">
          {editor.specialties.slice(0, 4).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${accent}12`, border: `1px solid ${accent}25`, color: '#8a7a68' }}>
              {s}
            </span>
          ))}
        </div>
      )}

      {/* About */}
      {editor.about && (
        <div className="px-5 pb-4">
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8a7a68' }}>{editor.about}</p>
        </div>
      )}

      {/* CTAs */}
      <div className="px-5 pb-5 flex gap-2" style={{ borderTop: `1px solid ${accent}15`, paddingTop: 12 }}>
        <button onClick={onSubmit}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: `${accent}15`, border: `1px solid ${accent}35`,
            color: accent, cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = `${accent}25`); }}
          onMouseLeave={e => { (e.currentTarget.style.background = `${accent}15`); }}>
          Submit Work
        </button>
        <button onClick={onMessage}
          title={`Message ${editor.displayName}`}
          className="px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1"
          style={{
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            color: '#c9a84c', cursor: 'pointer',
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(201,168,76,0.16)'); }}
          onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(201,168,76,0.08)'); }}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          DM
        </button>
      </div>
    </div>
  );
};

// ─── Submission Modal ─────────────────────────────────────────────────────────

const SubmissionModal: React.FC<{
  editors: Editor[];
  preselectedEditorId?: string;
  onClose: () => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  onSuccess: () => void;
}> = ({ editors, preselectedEditorId, onClose, fetchWithAuth, onSuccess }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [storyId, setStoryId] = useState('');
  const [editorId, setEditorId] = useState(preselectedEditorId ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth('/api/stories')
      .then(r => r.ok ? r.json() : { stories: [] })
      .then(d => setStories(d.stories ?? []))
      .catch(() => {});
  }, [fetchWithAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyId || !editorId) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetchWithAuth('/api/editorial/submit', {
        method: 'POST',
        body: JSON.stringify({ storyId, editorId, submissionNotes: notes }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'Submission failed');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: '#161210', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #c9a84c, #a78bfa, #2dd4bf)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold" style={{ color: '#ede6d6' }}>Submit for Editorial Review</h2>
              <p className="text-sm mt-1" style={{ color: '#8a7a68' }}>Send your work to an editor for professional review</p>
            </div>
            <button onClick={onClose} style={{ color: '#4a3f35', background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Select Story *</label>
              <select value={storyId} onChange={e => setStoryId(e.target.value)}
                className="input-ink w-full px-4 py-3 text-sm" required>
                <option value="">Choose a story…</option>
                {stories.map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Select Editor *</label>
              <select value={editorId} onChange={e => setEditorId(e.target.value)}
                className="input-ink w-full px-4 py-3 text-sm" required>
                <option value="">Choose an editor…</option>
                {editors.map(ed => (
                  <option key={ed.userId} value={ed.userId}>{ed.displayName} — {editorTypeLabel(ed.editorType, ed.isAgent)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Submission Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Describe what you're looking for — tone, pacing, genre conventions…"
                rows={4} className="input-ink w-full px-4 py-3 text-sm resize-none" />
            </div>

            {error && (
              <p className="text-xs rounded-lg px-4 py-2.5"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#e07070' }}>
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting || !storyId || !editorId} className="btn-gold flex-1 py-3 text-sm">
                {submitting ? 'Submitting…' : 'Submit for Review'}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost px-5 py-3 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Editor Profile Setup Modal ───────────────────────────────────────────────

const EditorSetupModal: React.FC<{
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ fetchWithAuth, onClose, onSuccess }) => {
  const [form, setForm] = useState({ displayName: '', editorType: 'human', genreFocus: '', specialties: '', about: '' });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAvatar = () => {
    if (!form.displayName.trim()) return;
    setGeneratingAvatar(true);
    const seed = encodeURIComponent(form.displayName.replace(/[^a-zA-Z0-9]/g, ''));
    const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;
    setAvatarUrl(url);
    setTimeout(() => setGeneratingAvatar(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await fetchWithAuth('/api/editors/me/ensure', { method: 'POST' });
      const r = await fetchWithAuth('/api/editors/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: form.displayName,
          editorType: form.editorType,
          genreFocus: form.genreFocus,
          specialties: form.specialties.split(',').map(s => s.trim()).filter(Boolean),
          about: form.about,
          ...(avatarUrl ? { avatarUrl } : {}),
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || 'Setup failed');
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: '#161210', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ height: 4, background: 'linear-gradient(90deg, #a78bfa, #c9a84c)' }} />
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold" style={{ color: '#ede6d6' }}>Join as Editor</h2>
              <p className="text-sm mt-1" style={{ color: '#8a7a68' }}>Set up your editorial profile</p>
            </div>
            <button onClick={onClose} style={{ color: '#4a3f35', background: 'none', border: 'none', cursor: 'pointer' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Display Name *</label>
              <input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                placeholder="Your editor name" className="input-ink w-full px-4 py-3 text-sm" required />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Editor Type</label>
              <select value={form.editorType} onChange={e => setForm(f => ({ ...f, editorType: e.target.value }))}
                className="input-ink w-full px-4 py-3 text-sm">
                <option value="human">Human Editor</option>
                <option value="ai">AI Editor</option>
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Genre Focus</label>
              <input value={form.genreFocus} onChange={e => setForm(f => ({ ...f, genreFocus: e.target.value }))}
                placeholder="e.g. Literary Fiction, Fantasy…" className="input-ink w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Specialties (comma separated)</label>
              <input value={form.specialties} onChange={e => setForm(f => ({ ...f, specialties: e.target.value }))}
                placeholder="e.g. Line Editing, Pacing, Dialogue" className="input-ink w-full px-4 py-3 text-sm" />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>About</label>
              <textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
                placeholder="Describe your editorial approach…" rows={3} className="input-ink w-full px-4 py-3 text-sm resize-none" />
            </div>

            {/* Avatar generation */}
            <div>
              <label className="text-xs block mb-2" style={{ color: '#8a7a68' }}>Profile Image (optional)</label>
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar preview"
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(167,139,250,0.4)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: 'rgba(167,139,250,0.1)', border: '2px dashed rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    ✒️
                  </div>
                )}
                <div className="flex-1">
                  <button type="button" onClick={handleGenerateAvatar}
                    disabled={!form.displayName.trim() || generatingAvatar}
                    className="w-full py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: form.displayName.trim() ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.05)',
                      border: '1px solid rgba(167,139,250,0.3)',
                      color: form.displayName.trim() ? '#a78bfa' : '#4a3f35',
                      cursor: form.displayName.trim() ? 'pointer' : 'not-allowed',
                    }}>
                    {generatingAvatar ? 'Generating…' : avatarUrl ? '🔄 Regenerate Avatar' : '✨ Generate AI Avatar'}
                  </button>
                  {!form.displayName.trim() && (
                    <p className="text-xs mt-1" style={{ color: '#4a3f35' }}>Enter a name first</p>
                  )}
                </div>
              </div>
              {avatarUrl && (
                <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="Or paste image URL…"
                  className="input-ink w-full px-3 py-2 text-xs mt-2 font-mono" />
              )}
            </div>

            {error && (
              <p className="text-xs rounded-lg px-4 py-2.5"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#e07070' }}>
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting || !form.displayName.trim()} className="btn-gold flex-1 py-3 text-sm">
                {submitting ? 'Saving…' : 'Join as Editor'}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost px-5 py-3 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── My Submissions View ──────────────────────────────────────────────────────

const MySubmissions: React.FC<{ fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response> }> = ({ fetchWithAuth }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth('/api/editorial/mine')
      .then(r => r.ok ? r.json() : { submissions: [] })
      .then(d => setSubmissions(d.submissions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fetchWithAuth]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: 96 }} />)}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>No submissions yet</p>
        <p className="text-sm" style={{ color: '#8a7a68' }}>Submit a story from the Directory tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map(sub => {
        const sm = statusMeta(sub.status);
        return (
          <div key={sub.id} className="rounded-2xl p-5"
            style={{ background: '#161210', border: '1px solid #2a2218' }}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-serif font-semibold" style={{ color: '#ede6d6' }}>{sub.storyTitle}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8a7a68' }}>Editor: {sub.editorName}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.color}40` }}>
                {sm.label}
              </span>
            </div>
            {sub.submissionNotes && (
              <p className="text-xs mb-2" style={{ color: '#8a7a68' }}>
                <span style={{ color: '#4a3f35' }}>Your notes: </span>{sub.submissionNotes}
              </p>
            )}
            {sub.editorNotes && (
              <p className="text-xs px-3 py-2 rounded-xl"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', color: '#c9a84c' }}>
                <span className="font-semibold">Editor:</span> {sub.editorNotes}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Editors (main page) ──────────────────────────────────────────────────────

export function Editors() {
  const { fetchWithAuth } = useAuth();
  const [editors, setEditors] = useState<Editor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'ai' | 'human'>('all');
  const [tab, setTab] = useState<'directory' | 'mine'>('directory');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [preselectedEditor, setPreselectedEditor] = useState<string | undefined>();
  const [toast, setToast] = useState<string | null>(null);

  const loadEditors = () => {
    setLoading(true);
    fetchWithAuth('/api/editors')
      .then(r => r.ok ? r.json() : { editors: [] })
      .then(d => setEditors(d.editors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadEditors(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const FILTER_TABS = [
    { id: 'all' as const,   label: 'All',           count: editors.length },
    { id: 'ai' as const,    label: 'AI Editors',    count: editors.filter(e => e.editorType === 'ai').length },
    { id: 'human' as const, label: 'Human Editors', count: editors.filter(e => e.editorType === 'human').length },
  ];

  const visible = editors.filter(e =>
    filter === 'all' ? true : e.editorType === filter
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl text-sm"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
          ✓ {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>The Editorial Board</h1>
            <p className="text-sm" style={{ color: '#8a7a68' }}>Craft perfected, stories immortalized</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setPreselectedEditor(undefined); setShowSubmitModal(true); }}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', cursor: 'pointer' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Submit Your Work
            </button>
            <button onClick={() => setShowJoinModal(true)}
              className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Join as Editor
            </button>
          </div>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {[{ id: 'directory' as const, label: 'Directory' }, { id: 'mine' as const, label: 'My Submissions' }].map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === id ? 'rgba(201,168,76,0.12)' : '#161210',
                border: `1px solid ${tab === id ? 'rgba(201,168,76,0.35)' : '#2a2218'}`,
                color: tab === id ? '#c9a84c' : '#8a7a68', cursor: 'pointer',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Filter tabs (directory only) */}
        {tab === 'directory' && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {FILTER_TABS.map(({ id, label, count }) => (
              <button key={id} onClick={() => setFilter(id)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: filter === id ? 'rgba(201,168,76,0.08)' : 'transparent',
                  border: `1px solid ${filter === id ? 'rgba(201,168,76,0.25)' : '#2a2218'}`,
                  color: filter === id ? '#c9a84c' : '#4a3f35', cursor: 'pointer',
                }}>
                {label} <span className="ml-1 opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {tab === 'mine' ? (
        <MySubmissions fetchWithAuth={fetchWithAuth} />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#161210', border: '1px solid #2a2218' }}>
              <div className="px-5 pt-5 pb-4" style={{ background: '#1a1612' }}>
                <div className="flex items-start gap-3">
                  <div className="skeleton rounded-full" style={{ width: 52, height: 52 }} />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-4 w-28 rounded" />
                    <div className="skeleton h-3 w-20 rounded" />
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 space-y-1.5">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">✒️</div>
          <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>No editors found</p>
          <p className="text-sm mb-6" style={{ color: '#8a7a68' }}>Be the first to join the Editorial Board</p>
          <button onClick={() => setShowJoinModal(true)} className="btn-gold px-6 py-3 text-sm">
            Join as Editor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(ed => (
            <EditorCard key={ed.userId} editor={ed}
              onSubmit={() => { setPreselectedEditor(ed.userId); setShowSubmitModal(true); }}
              onMessage={() => { window.location.hash = `messages/${ed.userId}`; }} />
          ))}
        </div>
      )}

      {/* Modals */}
      {showSubmitModal && (
        <SubmissionModal
          editors={editors}
          preselectedEditorId={preselectedEditor}
          fetchWithAuth={fetchWithAuth}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => { showToast('Submission sent successfully!'); setTab('mine'); }}
        />
      )}
      {showJoinModal && (
        <EditorSetupModal
          fetchWithAuth={fetchWithAuth}
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => { showToast('You\'ve joined the Editorial Board!'); loadEditors(); }}
        />
      )}
    </div>
  );
}

export default Editors;
