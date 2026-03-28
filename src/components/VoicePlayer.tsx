// VoicePlayer — persistent mini-player bar + per-segment speak button
// Renders a sticky bottom bar when audio is active, with volume/mute controls

import React, { useState, useEffect, useCallback } from 'react';
import {
  speak, stop, isSpeaking, setVolume, setMuted,
  getVolume, getMuted, loadVoicePrefs,
} from '../services/voiceService';

// ─── Global state (module-level so it's shared across all instances) ──────────

let _listeners: Array<() => void> = [];
function notify() { _listeners.forEach(fn => fn()); }

export function subscribeVoice(fn: () => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(f => f !== fn); };
}

export interface NowPlaying {
  text: string;
  label: string;
  agentId?: string;
  agentName?: string;
}

let _nowPlaying: NowPlaying | null = null;
let _playing = false;

export function playSegment(np: NowPlaying) {
  _nowPlaying = np;
  _playing = true;
  notify();
  speak(np.text, {
    agentId: np.agentId,
    agentName: np.agentName,
    onEnd: () => { _playing = false; _nowPlaying = null; notify(); },
    onError: () => { _playing = false; _nowPlaying = null; notify(); },
  });
}

export function stopPlayback() {
  stop();
  _playing = false;
  _nowPlaying = null;
  notify();
}

// ─── Speak Button — inline per segment/message ───────────────────────────────

interface SpeakButtonProps {
  text: string;
  label?: string;
  agentId?: string;
  agentName?: string;
  size?: 'sm' | 'md';
  color?: string;
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text, label = 'Listen', agentId, agentName, size = 'sm', color = '#c9a84c',
}) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const unsub = subscribeVoice(() => {
      setActive(_playing && _nowPlaying?.text === text);
    });
    return unsub;
  }, [text]);

  const toggle = () => {
    if (active) {
      stopPlayback();
    } else {
      playSegment({ text, label, agentId, agentName });
    }
  };

  const sz = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  const iconSz = size === 'sm' ? 14 : 16;

  return (
    <button
      onClick={toggle}
      title={active ? 'Stop' : label}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', border: `1px solid ${color}40`,
        background: active ? `${color}25` : `${color}10`,
        color: active ? color : `${color}99`,
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      }}
      className={sz}
    >
      {active ? (
        // Stop icon
        <svg width={iconSz} height={iconSz} viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      ) : (
        // Speaker / play icon
        <svg width={iconSz} height={iconSz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" strokeOpacity="0.5" />
        </svg>
      )}
    </button>
  );
};

// ─── Persistent Volume Bar ────────────────────────────────────────────────────

export const VoiceBar: React.FC = () => {
  const [nowPlaying, setNowPlaying] = useState<NowPlaying | null>(null);
  const [playing, setPlaying]       = useState(false);
  const [volume, setVol]            = useState(getVolume());
  const [muted, setMut]             = useState(getMuted());

  useEffect(() => {
    loadVoicePrefs();
    setVol(getVolume());
    setMut(getMuted());
    const unsub = subscribeVoice(() => {
      setNowPlaying(_nowPlaying);
      setPlaying(_playing);
    });
    return unsub;
  }, []);

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVol(v);
    setVolume(v);
    if (v > 0 && muted) { setMuted(false); setMut(false); }
  };

  const handleMute = () => {
    const next = !muted;
    setMut(next);
    setMuted(next);
  };

  if (!playing && !nowPlaying) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)',
        zIndex: 50, display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 18px', borderRadius: 40,
        background: 'rgba(22,18,16,0.96)', border: '1px solid rgba(201,168,76,0.25)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* Equaliser animation */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
        {[3, 5, 4, 6, 3].map((h, i) => (
          <div key={i} style={{
            width: 3, background: '#c9a84c', borderRadius: 2,
            height: playing ? `${h * 2 + 4}px` : '4px',
            transition: `height ${0.3 + i * 0.07}s ease-in-out`,
            animation: playing ? `eq-bounce ${0.5 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          }} />
        ))}
      </div>

      {/* Label */}
      <span style={{
        fontSize: 12, color: '#ede6d6', maxWidth: 160,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {nowPlaying?.agentName ?? nowPlaying?.label ?? 'Playing…'}
      </span>

      {/* Stop */}
      <button onClick={stopPlayback} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#8a7a68', display: 'flex', padding: 2,
      }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
      </button>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: '#2a2218' }} />

      {/* Mute */}
      <button onClick={handleMute} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: muted ? '#e07070' : '#8a7a68', display: 'flex',
      }}>
        {muted ? (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
          </svg>
        )}
      </button>

      {/* Volume slider */}
      <input
        type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
        onChange={handleVolume}
        style={{ width: 80, accentColor: '#c9a84c', cursor: 'pointer' }}
      />
    </div>
  );
};
