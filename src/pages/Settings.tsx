import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export const Settings: React.FC = () => {
  const { penName, logout, fetchWithAuth, updatePenName } = useAuth();
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchWithAuth('/api/llm/validate-keys')
      .then(r => r.json())
      .then(d => {
        const map: Record<string, boolean> = {};
        (d.keys || []).forEach((k: { key: string; valid: boolean }) => { map[k.key] = k.valid; });
        setKeyStatus(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const configuredProviders = Object.entries(keyStatus).filter(([, v]) => v).map(([k]) => k);

  const handleStartEditName = () => {
    setNameInput(penName || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed.length < 2) return;
    setSavingName(true);
    try {
      updatePenName(trimmed);
      await fetchWithAuth('/api/writers/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName: trimmed }),
      });
      setMessage({ type: 'success', text: 'Pen name updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      // update was applied locally even if API fails
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  const providers = [
    { key: 'OPENROUTER_API_KEY', label: 'OpenRouter', models: 'Nemotron, Kimi, Qwen, Reka', url: 'https://openrouter.ai/keys' },
    { key: 'GROQ_API_KEY',       label: 'Groq',        models: 'Llama 3.3, Gemma 2, Mixtral', url: 'https://console.groq.com/keys' },
    { key: 'ANTHROPIC_API_KEY',  label: 'Anthropic',   models: 'Claude Sonnet', url: 'https://console.anthropic.com/keys' },
    { key: 'OPENAI_API_KEY',     label: 'OpenAI',      models: 'GPT-4o Mini', url: 'https://platform.openai.com/api-keys' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: '#ede6d6' }}>Settings</h1>
        <p className="text-sm" style={{ color: '#8a7a68' }}>Your writers circle profile & configuration</p>
      </div>

      {message && (
        <div className="rounded-xl p-4 mb-6 text-sm flex items-center gap-2"
          style={{
            background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(201,68,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(201,68,68,0.25)'}`,
            color: message.type === 'success' ? '#34d399' : '#e07070',
          }}>
          {message.text}
        </div>
      )}

      {/* Pen name card */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: '#161210', border: '1px solid #2a2218' }}>
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#4a3f35' }}>Your Pen Name</p>

        {editingName ? (
          <div className="space-y-3">
            <input
              ref={nameInputRef}
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
              maxLength={32}
              className="input-ink w-full px-4 py-3 font-serif text-xl"
              style={{ color: '#c9a84c' }}
            />
            <div className="flex items-center gap-2">
              <button onClick={handleSaveName} disabled={savingName || nameInput.trim().length < 2}
                className="btn-gold px-5 py-2 text-sm">
                {savingName ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => setEditingName(false)}
                className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <p className="font-serif text-2xl font-semibold" style={{ color: '#c9a84c' }}>
                  {penName || 'Anonymous'}
                </p>
                <button onClick={handleStartEditName}
                  title="Edit pen name"
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#4a3f35', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#c9a84c'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.12)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#4a3f35'; (e.currentTarget as HTMLElement).style.background = 'rgba(201,168,76,0.06)'; }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"/>
                  </svg>
                </button>
              </div>
              <p className="text-xs mt-1" style={{ color: '#8a7a68' }}>
                Shown as your author name on all stories
              </p>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
              style={{ color: '#8a7a68', border: '1px solid #2a2218' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#e07070';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,68,68,0.3)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#8a7a68';
                (e.currentTarget as HTMLElement).style.borderColor = '#2a2218';
              }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Log out
            </button>
          </div>
        )}
      </div>

      {/* LLM Providers */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #2a2218' }}>
        <div className="px-6 py-4" style={{ background: '#1e1a16', borderBottom: '1px solid #2a2218' }}>
          <h2 className="font-serif text-lg font-semibold" style={{ color: '#ede6d6' }}>AI Providers</h2>
          <p className="text-xs mt-0.5" style={{ color: '#8a7a68' }}>
            Keys live in your server's <code className="text-xs px-1 rounded" style={{ background: '#0d0b08', color: '#c9a84c' }}>.env</code> file.
            {configuredProviders.length > 0 && ` ${configuredProviders.length} configured.`}
          </p>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
          </div>
        ) : (
          <div style={{ background: '#161210' }}>
            {providers.map(({ key, label, models, url }, i) => {
              const configured = keyStatus[key] ?? false;
              return (
                <div key={key} className="flex items-center justify-between px-6 py-4"
                  style={{ borderBottom: i < providers.length - 1 ? '1px solid #2a2218' : 'none' }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: '#ede6d6' }}>{label}</span>
                      {configured
                        ? <span className="text-xs flex items-center gap-1" style={{ color: '#34d399' }}>✓ Active</span>
                        : <span className="text-xs" style={{ color: '#4a3f35' }}>Not configured</span>
                      }
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: '#4a3f35' }}>{models}</p>
                  </div>
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                    style={{ color: '#c9a84c', border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(201,168,76,0.05)' }}>
                    Get key →
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to add keys */}
      <div className="rounded-2xl p-6" style={{ background: '#161210', border: '1px solid #2a2218' }}>
        <h3 className="font-serif text-base font-semibold mb-3" style={{ color: '#ede6d6' }}>
          How to add API keys
        </h3>
        <ol className="text-sm space-y-2" style={{ color: '#8a7a68' }}>
          <li>1. Open <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#0d0b08', color: '#c9a84c' }}>~/.wholesaling-system/StoryChain/.env</code> on your server</li>
          <li>2. Add the key, e.g. <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#0d0b08', color: '#c9a84c' }}>GROQ_API_KEY=gsk_...</code></li>
          <li>3. Restart the server: <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#0d0b08', color: '#c9a84c' }}>sudo systemctl restart storychain</code></li>
        </ol>
      </div>
    </div>
  );
};

export default Settings;
