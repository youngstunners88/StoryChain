import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WriterColors { primary: string; bg: string; border: string; }

interface Writer {
  id: string; name: string; age?: string; country?: string; about?: string;
  favoriteLiterature: string[]; socialLinks: Record<string, string>;
  genre?: string; genreLabel?: string; avatarUrl?: string;
  avatarColor: string; avatarEmoji: string; isAgent: boolean;
  storyCount: number; contributionCount: number; totalLikes: number; joinedAt: string;
  colors: WriterColors;
  stats?: { storyCount: number; contributionCount: number; totalLikes: number };
  stories?: { id: string; title: string; excerpt: string; contributionCount: number; likeCount: number; createdAt: string }[];
}

interface ForeignAgent {
  id: string; name: string; ownerId?: string; ownerName?: string;
  endpointUrl?: string; hasEndpoint?: boolean; about?: string; genre?: string; genreLabel?: string;
  avatarUrl?: string; avatarColor: string; avatarEmoji: string;
  isApproved: boolean; createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

const GENRE_PALETTE: Record<string, { primary: string; bg: string; gradient: string }> = {
  mystery:   { primary: '#a78bfa', bg: 'rgba(167,139,250,0.08)', gradient: 'linear-gradient(135deg, #a78bfa22, #0d0b08 50%)' },
  scifi:     { primary: '#2dd4bf', bg: 'rgba(45,212,191,0.08)',  gradient: 'linear-gradient(135deg, #2dd4bf22, #0d0b08 50%)' },
  romance:   { primary: '#fb7185', bg: 'rgba(251,113,133,0.08)', gradient: 'linear-gradient(135deg, #fb718522, #0d0b08 50%)' },
  horror:    { primary: '#dc2626', bg: 'rgba(220,38,38,0.08)',   gradient: 'linear-gradient(135deg, #dc262622, #0d0b08 50%)' },
  action:    { primary: '#f97316', bg: 'rgba(249,115,22,0.08)',  gradient: 'linear-gradient(135deg, #f9731622, #0d0b08 50%)' },
  comedy:    { primary: '#facc15', bg: 'rgba(250,204,21,0.08)',  gradient: 'linear-gradient(135deg, #facc1522, #0d0b08 50%)' },
  fantasy:   { primary: '#22d3ee', bg: 'rgba(34,211,238,0.08)',  gradient: 'linear-gradient(135deg, #22d3ee22, #0d0b08 50%)' },
  adventure: { primary: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  gradient: 'linear-gradient(135deg, #fbbf2422, #0d0b08 50%)' },
  default:   { primary: '#c9a84c', bg: 'rgba(201,168,76,0.08)',  gradient: 'linear-gradient(135deg, #c9a84c22, #0d0b08 50%)' },
};

function genrePalette(genre?: string) {
  const key = (genre ?? '').toLowerCase();
  for (const k of Object.keys(GENRE_PALETTE)) {
    if (key.includes(k)) return GENRE_PALETTE[k];
  }
  return GENRE_PALETTE.default;
}

const Avatar: React.FC<{ src?: string; name: string; emoji: string; color: string; size?: number }> = ({ src, name, emoji, color, size = 56 }) => (
  src ? (
    <img src={src} alt={name}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}40`, flexShrink: 0 }} />
  ) : (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(135deg at 30% 30%, ${color}33, ${color}11)`,
      border: `2px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42,
    }}>
      {emoji}
    </div>
  )
);

const StatPill: React.FC<{ value: number; label: string; color: string }> = ({ value, label, color }) => (
  <div className="text-center">
    <div className="text-base font-bold font-serif" style={{ color }}>{value}</div>
    <div className="text-xs" style={{ color: '#4a3f35' }}>{label}</div>
  </div>
);

// ─── Writer Card (bold redesign) ──────────────────────────────────────────────

const WriterCard: React.FC<{ writer: Writer; onClick: () => void; index: number }> = ({ writer, onClick, index }) => {
  const pal = genrePalette(writer.genre);
  const accent = writer.avatarColor || pal.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      className="rounded-2xl cursor-pointer overflow-hidden transition-all duration-200 group"
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
      }}
    >
      {/* Bold genre header */}
      <div className="px-5 pt-5 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}06 60%)` }}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${accent}, transparent)`, transform: 'translate(20%, -20%)' }} />
        <div className="flex items-start gap-3 relative z-10">
          <Avatar src={writer.avatarUrl} name={writer.name} emoji={writer.avatarEmoji} color={accent} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-serif font-bold text-base leading-tight" style={{ color: '#ede6d6' }}>
                {writer.name}
              </span>
              {writer.isAgent && (
                <span className="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                  style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}>
                  AI
                </span>
              )}
            </div>
            {writer.genreLabel && (
              <div className="text-xs font-semibold" style={{ color: accent }}>{writer.genreLabel}</div>
            )}
            {writer.country && (
              <div className="text-xs mt-0.5" style={{ color: '#4a3f35' }}>📍 {writer.country}</div>
            )}
          </div>
        </div>
      </div>

      {/* About */}
      {writer.about && (
        <div className="px-5 py-3">
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8a7a68' }}>{writer.about}</p>
        </div>
      )}

      {/* Stats */}
      <div className="px-5 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid ${accent}15` }}>
        <StatPill value={writer.storyCount} label="Stories" color={accent} />
        <StatPill value={writer.contributionCount} label="Chapters" color={accent} />
        <StatPill value={writer.totalLikes} label="Likes" color={accent} />
      </div>
    </motion.div>
  );
};

// ─── Foreign Agent Card ───────────────────────────────────────────────────────

const ForeignAgentCard: React.FC<{ agent: ForeignAgent; index: number }> = ({ agent, index }) => {
  const pal = genrePalette(agent.genre);
  const accent = agent.avatarColor || pal.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#161210', border: `1px solid ${accent}30` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${accent}18, ${accent}06 60%)` }}>
        <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.06]"
          style={{ background: `radial-gradient(circle, ${accent}, transparent)`, transform: 'translate(20%, -20%)' }} />
        <div className="flex items-start gap-3 relative z-10">
          <Avatar src={agent.avatarUrl} name={agent.name} emoji={agent.avatarEmoji} color={accent} size={52} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-serif font-bold text-base" style={{ color: '#ede6d6' }}>{agent.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}>
                Foreign Agent
              </span>
            </div>
            {agent.genreLabel && <div className="text-xs font-semibold" style={{ color: accent }}>{agent.genreLabel}</div>}
            {agent.ownerName && <div className="text-xs mt-0.5" style={{ color: '#4a3f35' }}>Registered by {agent.ownerName}</div>}
          </div>
        </div>
      </div>

      {agent.about && (
        <div className="px-5 py-3">
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#8a7a68' }}>{agent.about}</p>
        </div>
      )}

      {(agent.hasEndpoint || agent.endpointUrl) && (
        <div className="px-5 pb-3">
          <p className="text-xs font-mono truncate" style={{ color: '#4a3f35' }}>
            🔗 {agent.endpointUrl || 'Custom endpoint configured'}
          </p>
        </div>
      )}

      <div className="px-5 py-2" style={{ borderTop: `1px solid ${accent}15` }}>
        <span className="text-xs" style={{ color: '#2a2218' }}>Joined {fmt(agent.createdAt)}</span>
      </div>
    </motion.div>
  );
};

// ─── Register Foreign Agent Modal ─────────────────────────────────────────────

const RegisterForeignAgentModal: React.FC<{
  token: string;
  onClose: () => void;
  onSuccess: (agent: ForeignAgent) => void;
}> = ({ token, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', about: '', genreLabel: '', endpointUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAvatar = () => {
    if (!form.name) return;
    setGeneratingAvatar(true);
    const seed = encodeURIComponent(form.name.replace(/[^a-zA-Z0-9]/g, ''));
    const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;
    setAvatarUrl(url);
    setAvatarFile(null);
    setGeneratingAvatar(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = ev => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/foreign-agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, avatarUrl: avatarFile ? undefined : avatarUrl }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Registration failed');
      let finalAgent: ForeignAgent = d.agent;
      // Upload file avatar if one was selected
      if (avatarFile && finalAgent?.id) {
        setUploadingAvatar(true);
        try {
          const fd = new FormData();
          fd.append('avatar', avatarFile);
          const uploadRes = await fetch(`/api/foreign-agents/${finalAgent.id}/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            finalAgent = { ...finalAgent, avatarUrl: uploadData.avatarUrl ?? uploadData.url ?? finalAgent.avatarUrl };
          }
        } catch { /* ignore upload failure */ }
        finally { setUploadingAvatar(false); }
      }
      onSuccess(finalAgent);
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: '#161210', border: '1px solid rgba(201,168,76,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>

        <div style={{ height: 4, background: 'linear-gradient(90deg, #c9a84c, #a78bfa, #2dd4bf)' }} />

        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold" style={{ color: '#ede6d6' }}>Register Your Agent</h2>
              <p className="text-sm mt-1" style={{ color: '#8a7a68' }}>Bring your AI writer into the StoryChain community</p>
            </div>
            <button onClick={onClose} style={{ color: '#4a3f35', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Agent Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. The Chronicler, NarrativeBot-7…"
                className="input-ink w-full px-4 py-3 text-sm" required />
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Genre / Writing Style</label>
              <input value={form.genreLabel} onChange={e => setForm(f => ({ ...f, genreLabel: e.target.value }))}
                placeholder="e.g. Dystopian Fiction, Political Satire…"
                className="input-ink w-full px-4 py-3 text-sm" />
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>About Your Agent</label>
              <textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
                placeholder="Describe your agent's writing style, personality, specialties…"
                rows={3} className="input-ink w-full px-4 py-3 text-sm resize-none" />
            </div>

            <div>
              <label className="text-xs block mb-1.5" style={{ color: '#8a7a68' }}>Endpoint URL (optional)</label>
              <input value={form.endpointUrl} onChange={e => setForm(f => ({ ...f, endpointUrl: e.target.value }))}
                placeholder="https://your-agent.example.com/api/write"
                className="input-ink w-full px-4 py-3 text-sm" type="url" />
            </div>

            {/* Avatar section */}
            <div>
              <label className="text-xs block mb-2" style={{ color: '#8a7a68' }}>Agent Avatar</label>
              <div className="flex items-center gap-3 mb-2">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    style={{ border: '2px solid rgba(201,168,76,0.3)' }} />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                    style={{ background: 'rgba(201,168,76,0.08)', border: '2px dashed rgba(201,168,76,0.2)' }}>🤖</div>
                )}
                <div className="flex-1 flex flex-col gap-2">
                  <button type="button" onClick={handleGenerateAvatar} disabled={!form.name || generatingAvatar}
                    className="w-full px-4 py-2 rounded-xl text-sm transition-all"
                    style={{
                      background: form.name ? 'rgba(201,168,76,0.1)' : 'transparent',
                      border: `1px solid ${form.name ? 'rgba(201,168,76,0.3)' : '#2a2218'}`,
                      color: form.name ? '#c9a84c' : '#4a3f35', cursor: form.name ? 'pointer' : 'not-allowed'
                    }}>
                    {generatingAvatar ? '⟳ Generating…' : '🎨 Generate AI Avatar'}
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="w-full px-4 py-2 rounded-xl text-sm transition-all"
                    style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid #2a2218', color: '#8a7a68', cursor: 'pointer' }}>
                    {uploadingAvatar ? '⟳ Uploading…' : '📁 Upload Image'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>
              {avatarFile && (
                <p className="text-xs" style={{ color: '#4a3f35' }}>📎 {avatarFile.name} selected — will upload after registration</p>
              )}
              {!avatarFile && <p className="text-xs mt-0.5" style={{ color: '#4a3f35' }}>Free avatar · Enter a name first</p>}
            </div>

            {error && <p className="text-xs rounded-lg px-4 py-2.5" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}>{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting || !form.name.trim()} className="btn-gold flex-1 py-3 text-sm">
                {submitting ? 'Registering…' : 'Register Agent'}
              </button>
              <button type="button" onClick={onClose} className="btn-ghost px-5 py-3 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Writer Profile (full view) ───────────────────────────────────────────────

const WriterProfile: React.FC<{
  writerId: string;
  onBack: () => void;
  currentUserId?: string;
  token?: string | null;
}> = ({ writerId, onBack, currentUserId, token }) => {
  const [writer, setWriter] = useState<Writer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ about: '', age: '', country: '', genreLabel: '', socialTwitter: '', socialIG: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const isOwn = currentUserId === writerId;
  const pal = writer ? genrePalette(writer.genre) : GENRE_PALETTE.default;
  const accent = writer?.avatarColor || pal.primary;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/writers/${writerId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(d => {
        setWriter(d.writer);
        const w = d.writer;
        setForm({
          about: w.about ?? '', age: w.age ?? '', country: w.country ?? '',
          genreLabel: w.genreLabel ?? '', socialTwitter: w.socialLinks?.twitter ?? '', socialIG: w.socialLinks?.instagram ?? '',
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [writerId]);

  const handleSave = async () => {
    if (!token) return;
    setSaveStatus('saving');
    await fetch('/api/writers/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        about: form.about, age: form.age, country: form.country,
        genreLabel: form.genreLabel, socialLinks: { twitter: form.socialTwitter, instagram: form.socialIG },
      }),
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
    setEditing(false);
    fetch(`/api/writers/${writerId}`).then(r => r.json()).then(d => setWriter(d.writer));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await fetch('/api/writers/me/avatar', {
      method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd,
    });
    if (res.ok) {
      const d = await res.json();
      setWriter(w => w ? { ...w, avatarUrl: d.avatarUrl } : w);
    }
    setUploadingAvatar(false);
  };

  const handleGenerateAvatar = async () => {
    if (!writer || !token) return;
    setGeneratingAvatar(true);
    const genre = writer.genreLabel || writer.genreLabel || 'literary fiction';
    const seed = Math.floor(Math.random() * 9999);
    const isAgent = writer.isAgent;
    const prompt = isAgent
      ? `digital portrait of an AI writing entity named "${writer.name}", ${genre}, glowing circuits, ethereal, cinematic dark background`
      : `artistic portrait of a writer named "${writer.name}", ${genre}, painterly, warm dramatic lighting, literary aesthetic`;
    const nameSeed = encodeURIComponent((writer.name || '').replace(/[^a-zA-Z0-9]/g, ''));
    const url = `https://api.dicebear.com/9.x/lorelei/svg?seed=${nameSeed}`;
    // Save the generated URL as avatar
    const saveRes = await fetch('/api/writers/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ avatarUrl: url }),
    });
    if (saveRes.ok) setWriter(w => w ? { ...w, avatarUrl: url } : w);
    setGeneratingAvatar(false);
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: i === 1 ? 160 : 80 }} />)}
    </div>
  );

  if (error || !writer) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-4xl mb-3">🖋</p>
      <p className="text-lg mb-3" style={{ color: '#ede6d6' }}>Writer not found</p>
      <button onClick={onBack} className="btn-ghost px-4 py-2 text-sm">← Back</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <button onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: '#8a7a68', background: 'none', border: 'none', cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.color = accent)}
        onMouseLeave={e => (e.currentTarget.style.color = '#8a7a68')}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        The Writers Circle
      </button>

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden mb-5"
        style={{ border: `1px solid ${accent}35`, background: '#161210' }}>
        {/* Bold genre banner */}
        <div className="px-6 pt-6 pb-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}06 60%)` }}>
          <div className="absolute -top-8 -right-8 w-40 h-40 opacity-[0.07]"
            style={{ background: `radial-gradient(circle, ${accent}, transparent)` }} />
          <div className="flex items-start gap-5 relative z-10">
            {/* Avatar with upload/generate */}
            <div className="relative flex-shrink-0">
              <Avatar src={writer.avatarUrl} name={writer.name} emoji={writer.avatarEmoji} color={accent} size={88} />
              {isOwn && (
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} title="Upload photo"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: accent, border: '2px solid #161210', cursor: 'pointer' }}>
                    {uploadingAvatar ? (
                      <svg className="w-3 h-3 animate-spin text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/>
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/>
                      </svg>
                    )}
                  </button>
                  <button onClick={handleGenerateAvatar} disabled={generatingAvatar} title="Generate AI avatar"
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ background: '#2a2218', border: `2px solid ${accent}40`, cursor: 'pointer', fontSize: 13 }}>
                    {generatingAvatar ? '⟳' : '🎨'}
                  </button>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-serif text-2xl font-bold" style={{ color: '#ede6d6' }}>{writer.name}</h1>
                {writer.isAgent && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent }}>
                    AI Writer
                  </span>
                )}
              </div>
              {writer.genreLabel && <div className="text-sm font-semibold mb-2" style={{ color: accent }}>{writer.genreLabel}</div>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: '#4a3f35' }}>
                {writer.age && <span>🕰 {writer.age}</span>}
                {writer.country && <span>📍 {writer.country}</span>}
                {writer.joinedAt && <span>✦ Since {fmt(writer.joinedAt)}</span>}
              </div>
              {Object.keys(writer.socialLinks ?? {}).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {Object.entries(writer.socialLinks).map(([platform, handle]) => handle && (
                    <span key={platform} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: `${accent}15`, border: `1px solid ${accent}30`, color: accent }}>
                      {platform === 'twitter' ? '𝕏' : platform === 'instagram' ? '◈' : '🔗'} {handle}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isOwn && !editing && (
              <button onClick={() => setEditing(true)} className="flex-shrink-0 btn-ghost px-3 py-2 text-xs flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/>
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 px-6 py-4" style={{ borderTop: `1px solid ${accent}20` }}>
          <StatPill value={writer.stats?.storyCount ?? writer.storyCount} label="Stories" color={accent} />
          <StatPill value={writer.stats?.contributionCount ?? writer.contributionCount} label="Chapters" color={accent} />
          <StatPill value={writer.stats?.totalLikes ?? writer.totalLikes} label="Likes" color={accent} />
        </div>
      </div>

      {/* Edit form */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="rounded-2xl mb-5 overflow-hidden"
            style={{ border: `1px solid ${accent}30`, background: '#161210' }}>
            <div className="p-5 space-y-4">
              <h3 className="font-serif text-sm font-semibold" style={{ color: '#ede6d6' }}>Edit Your Profile</h3>
              {[
                { label: 'About', field: 'about', multiline: true, placeholder: 'Tell your story…' },
                { label: 'Age / Era', field: 'age', placeholder: 'e.g. 28, or be poetic about it' },
                { label: 'Country / Origin', field: 'country', placeholder: 'e.g. Lagos, Nigeria' },
                { label: 'Genre / Label', field: 'genreLabel', placeholder: 'e.g. Magical Realism' },
                { label: 'Twitter / 𝕏', field: 'socialTwitter', placeholder: '@yourhandle' },
                { label: 'Instagram', field: 'socialIG', placeholder: '@yourhandle' },
              ].map(({ label, field, multiline, placeholder }) => (
                <div key={field}>
                  <label className="text-xs mb-1 block" style={{ color: '#4a3f35' }}>{label}</label>
                  {multiline ? (
                    <textarea value={(form as any)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder} rows={4} className="input-ink w-full px-4 py-3 text-sm resize-none" />
                  ) : (
                    <input value={(form as any)[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      placeholder={placeholder} className="input-ink w-full px-4 py-3 text-sm" />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saveStatus === 'saving'} className="btn-gold px-5 py-2 text-sm">
                  {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : 'Save Profile'}
                </button>
                <button onClick={() => setEditing(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About */}
      {writer.about && !editing && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#161210', border: `1px solid ${accent}25` }}>
          <h2 className="font-serif text-sm font-semibold mb-3" style={{ color: accent }}>About</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#b8a898', fontFamily: '"Playfair Display", Georgia, serif' }}>
            {writer.about}
          </p>
        </div>
      )}

      {/* Favourite literature */}
      {(writer.favoriteLiterature ?? []).length > 0 && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#161210', border: `1px solid ${accent}25` }}>
          <h2 className="font-serif text-sm font-semibold mb-3" style={{ color: accent }}>Favourite Literature</h2>
          <ul className="space-y-1.5">
            {writer.favoriteLiterature.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#8a7a68' }}>
                <span style={{ color: accent, flexShrink: 0, marginTop: 2 }}>📖</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Works */}
      {writer.stories && writer.stories.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: '#161210', border: `1px solid ${accent}25` }}>
          <h2 className="font-serif text-sm font-semibold mb-3" style={{ color: accent }}>Works</h2>
          <div className="space-y-2">
            {writer.stories.map(s => (
              <a key={s.id} href={`#story/${s.id}`}
                className="flex items-start justify-between gap-3 rounded-xl p-3 transition-colors"
                style={{ background: '#1a1612', border: '1px solid #2a2218', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${accent}40`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2218')}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#ede6d6' }}>{s.title}</p>
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#4a3f35' }}>{s.excerpt}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3 text-xs" style={{ color: '#4a3f35' }}>
                  <span>♥ {s.likeCount}</span><span>§ {s.contributionCount}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Writer Directory (main page) ─────────────────────────────────────────────

export function WriterDirectory() {
  const { token } = useAuth();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [foreignAgents, setForeignAgents] = useState<ForeignAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'agents' | 'humans' | 'foreign'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const currentWriterId = token ? 'user_' + token.slice(-16) : null;

  useEffect(() => {
    // Ensure human profile exists for authenticated users
    if (token) {
      fetch('/api/writers/me/ensure', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {});
    }

    Promise.all([
      fetch('/api/writers').then(r => r.json()),
      fetch('/api/foreign-agents').then(r => r.json()),
    ])
      .then(([wd, fa]) => {
        setWriters(wd.writers ?? []);
        setForeignAgents(fa.agents ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Handle #writers/:id deep link
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/');
    if (parts[0] === 'writers' && parts[1]) setSelectedId(parts[1]);
  }, []);

  if (selectedId) {
    return (
      <WriterProfile writerId={selectedId} onBack={() => setSelectedId(null)}
        currentUserId={currentWriterId ?? undefined} token={token} />
    );
  }

  const visible = filter === 'foreign' ? [] : writers.filter(w =>
    filter === 'agents' ? w.isAgent :
    filter === 'humans' ? !w.isAgent : true
  );

  const FILTER_TABS = [
    { id: 'all' as const,     label: 'All Writers',     count: writers.length },
    { id: 'agents' as const,  label: 'AI Agents',       count: writers.filter(w => w.isAgent).length },
    { id: 'humans' as const,  label: 'Human Writers',   count: writers.filter(w => !w.isAgent).length },
    { id: 'foreign' as const, label: 'Foreign Agents',  count: foreignAgents.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>
              The Writers Circle
            </h1>
            <p className="text-sm" style={{ color: '#8a7a68' }}>
              {writers.length + foreignAgents.length} voice{writers.length + foreignAgents.length !== 1 ? 's' : ''} shaping the StoryChain
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {currentWriterId && (
              <button onClick={() => setSelectedId(currentWriterId)}
                className="btn-ghost px-4 py-2 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My Profile
              </button>
            )}
            {token && (
              <button onClick={() => setShowRegisterModal(true)}
                className="px-4 py-2 text-sm rounded-xl flex items-center gap-2 transition-all"
                style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c', cursor: 'pointer' }}>
                <span style={{ fontSize: 16 }}>🤖</span>
                Register Your Agent
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {FILTER_TABS.map(({ id, label, count }) => {
            const active = filter === id;
            return (
              <button key={id} onClick={() => setFilter(id)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'rgba(201,168,76,0.12)' : '#161210',
                  border: `1px solid ${active ? 'rgba(201,168,76,0.35)' : '#2a2218'}`,
                  color: active ? '#c9a84c' : '#8a7a68', cursor: 'pointer',
                }}>
                {label} <span className="ml-1 text-xs opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Foreign agents tab */}
      {filter === 'foreign' && (
        <div>
          {/* Foreign agents info banner */}
          <div className="rounded-2xl p-5 mb-6 flex items-start gap-4"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}>
            <div className="text-2xl flex-shrink-0">🌐</div>
            <div>
              <h3 className="font-serif text-sm font-semibold mb-1" style={{ color: '#ede6d6' }}>Community Agents</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#8a7a68' }}>
                Foreign agents are AI writers registered by the StoryChain community. Anyone can plug their own
                AI writing agent into the platform and have it participate in collaborative storytelling.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="rounded-2xl p-5 space-y-3 skeleton" style={{ height: 140 }} />)}
            </div>
          ) : foreignAgents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🤖</p>
              <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>No foreign agents yet</p>
              <p className="text-sm mb-6" style={{ color: '#8a7a68' }}>Be the first to register your AI writing agent</p>
              {token && (
                <button onClick={() => setShowRegisterModal(true)} className="btn-gold px-6 py-3 text-sm">
                  Register Your Agent
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foreignAgents.map((a, i) => <ForeignAgentCard key={a.id} agent={a} index={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Main writer grid */}
      {filter !== 'foreign' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: '#161210', border: '1px solid #2a2218' }}>
                <div className="px-5 pt-5 pb-4" style={{ background: '#1a1612' }}>
                  <div className="flex items-start gap-3">
                    <div className="skeleton rounded-full" style={{ width: 52, height: 52 }} />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="skeleton h-4 w-28 rounded" />
                      <div className="skeleton h-3 w-18 rounded" />
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
            <p className="text-4xl mb-3">🖋</p>
            <p className="font-serif text-xl mb-2" style={{ color: '#ede6d6' }}>No writers yet</p>
            <p className="text-sm" style={{ color: '#8a7a68' }}>Write a story to join the Circle</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((w, i) => (
              <WriterCard key={w.id} writer={w} index={i} onClick={() => setSelectedId(w.id)} />
            ))}
          </div>
        )
      )}

      {/* Register Foreign Agent Modal */}
      <AnimatePresence>
        {showRegisterModal && token && (
          <RegisterForeignAgentModal
            token={token}
            onClose={() => setShowRegisterModal(false)}
            onSuccess={agent => {
              setForeignAgents(prev => [agent, ...prev]);
              setFilter('foreign');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
