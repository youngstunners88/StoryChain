// VoiceCallModal — real-time voice conversation with an AI agent or human
// AI agent calls: SpeechRecognition → LLM → TTS loop
// Human-to-human: shows "call connected" and routes to DM (WebRTC planned)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { speak, stop, startListening, getProfileForAgent } from '../services/voiceService';

interface Props {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerEmoji?: string;
  partnerColor?: string;
  isAgent: boolean;
  onClose: () => void;
}

type CallState = 'ringing' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'ended';

export const VoiceCallModal: React.FC<Props> = ({
  partnerId, partnerName, partnerAvatar, partnerEmoji = '🎙️',
  partnerColor = '#c9a84c', isAgent, onClose,
}) => {
  const { fetchWithAuth, penName } = useAuth();
  const [callState, setCallState] = useState<CallState>('ringing');
  const [transcript, setTranscript] = useState('');          // interim STT
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([]);
  const [elapsed, setElapsed] = useState(0);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const convRef = useRef<HTMLDivElement>(null);

  // Auto-answer after 1.5s (simulate ringing)
  useEffect(() => {
    const t = setTimeout(() => setCallState('connected'), 1500);
    return () => clearTimeout(t);
  }, []);

  // Timer
  useEffect(() => {
    if (callState === 'connected' || callState === 'listening' || callState === 'thinking' || callState === 'speaking') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // Auto-scroll transcript
  useEffect(() => {
    if (convRef.current) convRef.current.scrollTop = convRef.current.scrollHeight;
  }, [conversation]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const hangUp = useCallback(() => {
    stopListeningRef.current?.();
    stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setCallState('ended');
    setTimeout(onClose, 800);
  }, [onClose]);

  // Send user speech to agent LLM → TTS response
  const sendToAgent = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
    setCallState('thinking');
    stopListeningRef.current?.();

    setConversation(prev => [...prev, { role: 'user', text: userText }]);

    const history = conversation.map(m => `${m.role === 'user' ? penName ?? 'User' : partnerName}: ${m.text}`).join('\n');

    try {
      const res = await fetchWithAuth('/api/voice/agent-reply', {
        method: 'POST',
        body: JSON.stringify({
          agentId: partnerId,
          agentName: partnerName,
          userMessage: userText,
          history,
        }),
      });
      const data = await res.json() as any;
      const reply = data.reply ?? 'Hmm, let me think about that.';

      setConversation(prev => [...prev, { role: 'agent', text: reply }]);
      setCallState('speaking');

      speak(reply, {
        agentId: partnerId,
        agentName: partnerName,
        onEnd: () => {
          setCallState('listening');
          startListeningLoop();
        },
      });
    } catch {
      setCallState('listening');
      startListeningLoop();
    }
  }, [conversation, fetchWithAuth, partnerId, partnerName, penName]);

  const startListeningLoop = useCallback(() => {
    setTranscript('');
    setCallState('listening');

    const finalBuffer: string[] = [];
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const stop_ = startListening(
      (text, isFinal) => {
        setTranscript(text);
        if (isFinal) {
          finalBuffer.push(text);
          // Send after 1.2s silence
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            const full = finalBuffer.join(' ').trim();
            finalBuffer.length = 0;
            setTranscript('');
            if (full.length > 2) sendToAgent(full);
          }, 1200);
        }
      },
      () => {
        // Recognition ended — restart if still in listening state
        setCallState(s => {
          if (s === 'listening') setTimeout(startListeningLoop, 300);
          return s;
        });
      }
    );

    stopListeningRef.current = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stop_?.();
    };
  }, [sendToAgent]);

  // Start listening when connected (agent calls only)
  useEffect(() => {
    if (callState === 'connected' && isAgent) {
      const t = setTimeout(() => {
        // Agent greets first
        const greeting = `Hello, this is ${partnerName}. What would you like to talk about?`;
        setConversation([{ role: 'agent', text: greeting }]);
        setCallState('speaking');
        speak(greeting, {
          agentId: partnerId,
          agentName: partnerName,
          onEnd: () => {
            setCallState('listening');
            startListeningLoop();
          },
        });
      }, 500);
      return () => clearTimeout(t);
    }
  }, [callState, isAgent, partnerName, partnerId, startListeningLoop]);

  const stateLabel: Record<CallState, string> = {
    ringing: 'Calling…',
    connected: 'Connected',
    listening: 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Speaking…',
    ended: 'Call ended',
  };

  const ringColor = {
    ringing: '#c9a84c',
    connected: '#34d399',
    listening: '#60a5fa',
    thinking: '#a78bfa',
    speaking: partnerColor,
    ended: '#4a3f35',
  }[callState];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 380, borderRadius: 28,
        background: '#0f0d0b', border: `1px solid ${partnerColor}30`,
        boxShadow: `0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px ${partnerColor}15`,
        overflow: 'hidden',
      }}>
        {/* Header bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${partnerColor}, #a78bfa)` }} />

        <div style={{ padding: '28px 24px 24px' }}>
          {/* Avatar + name */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: `3px solid ${ringColor}`,
              boxShadow: `0 0 0 6px ${ringColor}18`,
              margin: '0 auto 12px', overflow: 'hidden', transition: 'border-color 0.4s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `radial-gradient(135deg at 30% 30%, ${partnerColor}33, ${partnerColor}11)`,
              fontSize: 32,
            }}>
              {partnerAvatar
                ? <img src={partnerAvatar} alt={partnerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : partnerEmoji}
            </div>
            <div style={{ color: '#ede6d6', fontWeight: 700, fontSize: 18, fontFamily: 'serif' }}>{partnerName}</div>
            <div style={{ color: ringColor, fontSize: 12, marginTop: 4, transition: 'color 0.4s' }}>
              {stateLabel[callState]} {callState !== 'ringing' && callState !== 'ended' ? `• ${formatTime(elapsed)}` : ''}
            </div>
          </div>

          {/* Conversation transcript */}
          {conversation.length > 0 && (
            <div ref={convRef} style={{
              maxHeight: 180, overflowY: 'auto', marginBottom: 16,
              padding: '10px 12px', borderRadius: 12,
              background: 'rgba(201,168,76,0.04)', border: '1px solid #2a2218',
            }}>
              {conversation.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 8, fontSize: 12, lineHeight: 1.5,
                  color: m.role === 'user' ? '#c9a84c' : '#ede6d6',
                  textAlign: m.role === 'user' ? 'right' : 'left',
                }}>
                  <span style={{ opacity: 0.6, fontSize: 10 }}>{m.role === 'user' ? 'You' : partnerName}: </span>
                  {m.text}
                </div>
              ))}
            </div>
          )}

          {/* Live transcript */}
          {transcript && (
            <div style={{
              fontSize: 12, color: '#60a5fa', fontStyle: 'italic',
              textAlign: 'center', marginBottom: 12, minHeight: 18,
            }}>
              "{transcript}"
            </div>
          )}

          {/* Sound wave animation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24, height: 24, alignItems: 'flex-end' }}>
            {[5, 9, 6, 12, 8, 5, 10].map((h, i) => (
              <div key={i} style={{
                width: 4, borderRadius: 2, background: ringColor,
                height: callState === 'listening' || callState === 'speaking'
                  ? `${h + Math.random() * 4}px` : '4px',
                transition: `height ${0.2 + i * 0.05}s ease-in-out`,
                opacity: callState === 'ringing' || callState === 'ended' ? 0.3 : 1,
              }} />
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            {/* Mute mic (listening state) */}
            {callState === 'listening' && (
              <button
                onClick={() => { stopListeningRef.current?.(); setCallState('connected'); }}
                style={{
                  width: 52, height: 52, borderRadius: '50%', border: '1px solid #2a2218',
                  background: '#1e1a16', color: '#8a7a68', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
                  <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}

            {/* Hang up */}
            <button
              onClick={hangUp}
              style={{
                width: 64, height: 64, borderRadius: '50%', border: 'none',
                background: '#dc2626', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
              }}>
              <svg width={24} height={24} viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C9.6 21 3 14.4 3 6c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
              </svg>
            </button>
          </div>

          {!isAgent && callState === 'connected' && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#4a3f35', marginTop: 12 }}>
              Human-to-human WebRTC coming soon — voice messages available now in DMs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
