// ─── UI Store ─────────────────────────────────────────────────────────────────
// Centralises all routing state, modal visibility, and UI mode.
// Replaces the scattered useState(route) / useState(routeParam) in App.tsx.

import { create } from 'zustand';

export type AppRoute =
  | 'feed'
  | 'story'
  | 'compose'
  | 'writers'
  | 'library'
  | 'book'
  | 'editors'
  | 'messages'
  | 'settings'
  | 'profile'
  | 'publishers'
  | 'token-store';

interface UIState {
  // ── Routing ──────────────────────────────────────────────────────────────
  route: AppRoute;
  param: string | null;   // e.g. storyId, writerId, threadId
  param2: string | null;  // e.g. secondary param

  navigate: (route: AppRoute, param?: string | null, param2?: string | null) => void;
  back: () => void;

  // ── Modals ───────────────────────────────────────────────────────────────
  voiceCallOpen: boolean;
  voiceCallAgentId: string | null;
  earningsPanelOpen: boolean;

  openVoiceCall: (agentId: string) => void;
  closeVoiceCall: () => void;
  toggleEarningsPanel: () => void;

  // ── Notifications badge ──────────────────────────────────────────────────
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  // ── Routing ─────────────────────────────────────────────────────────────
  route: parseHashRoute(),
  param: parseHashParam(1),
  param2: parseHashParam(2),

  navigate: (route, param = null, param2 = null) => {
    const hash = [route, param, param2 ? encodeURIComponent(param2) : null]
      .filter(Boolean)
      .join('/');
    window.location.hash = hash;
    set({ route, param, param2 });
  },

  back: () => {
    window.history.back();
    set({ route: parseHashRoute(), param: parseHashParam(1), param2: parseHashParam(2) });
  },

  // ── Modals ───────────────────────────────────────────────────────────────
  voiceCallOpen: false,
  voiceCallAgentId: null,
  earningsPanelOpen: false,

  openVoiceCall: (agentId) => set({ voiceCallOpen: true, voiceCallAgentId: agentId }),
  closeVoiceCall: () => set({ voiceCallOpen: false, voiceCallAgentId: null }),
  toggleEarningsPanel: () => set(s => ({ earningsPanelOpen: !s.earningsPanelOpen })),

  // ── Notifications ────────────────────────────────────────────────────────
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
}));

// ─── Sync store with browser hash changes ────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    useUIStore.setState({
      route: parseHashRoute(),
      param: parseHashParam(1),
      param2: parseHashParam(2),
    });
  });
}

function getHashParts(): string[] {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
}

function parseHashRoute(): AppRoute {
  const parts = getHashParts();
  const valid: AppRoute[] = [
    'feed','story','compose','writers','library','book','editors',
    'messages','settings','profile','publishers','token-store',
  ];
  return (valid.includes(parts[0] as AppRoute) ? parts[0] : 'feed') as AppRoute;
}

function parseHashParam(index: number): string | null {
  const parts = getHashParts();
  return parts[index] ? decodeURIComponent(parts[index]) : null;
}
