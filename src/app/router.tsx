// ─── Centralised Router ───────────────────────────────────────────────────────
// ALL route→component mappings live here. Pages are thin containers;
// business logic lives in feature stores and hooks.
// Swap `useUIStore` hash-router for React Router v7 when ready for SSR/deep-links.

import React, { Suspense, lazy } from 'react';
import { useUIStore } from '../store/uiStore.js';

// ── Lazy-loaded pages (code split per route) ─────────────────────────────────
const StoryFeed      = lazy(() => import('../pages/StoryFeed.js').then(m => ({ default: m.StoryFeed })));
const StoryView      = lazy(() => import('../pages/StoryView.js').then(m => ({ default: m.StoryView })));
const CreateStory    = lazy(() => import('../pages/CreateStory.js').then(m => ({ default: m.CreateStory })));
const WriterDirectory = lazy(() => import('../pages/WriterDirectory.js').then(m => ({ default: m.WriterDirectory })));
const Library        = lazy(() => import('../pages/Library.js').then(m => ({ default: m.Library })));
const Editors        = lazy(() => import('../pages/Editors.js').then(m => ({ default: m.Editors })));
const MessagingPanel = lazy(() => import('../pages/MessagingPanel.js').then(m => ({ default: m.MessagingPanel })));
const Settings       = lazy(() => import('../pages/Settings.js').then(m => ({ default: m.Settings })));
const Publishers     = lazy(() => import('../pages/Publishers.js').then(m => ({ default: m.Publishers })));

// ── Route definitions — single source of truth ───────────────────────────────
// route: hash segment | component: lazy page | params: what param/param2 carry

export const ROUTES = [
  { route: 'feed',       label: 'The Shelf',  icon: 'BookOpen',  nav: true  },
  { route: 'compose',    label: 'Compose',    icon: 'PenLine',   nav: true  },
  { route: 'writers',    label: 'Writers',    icon: 'Users',     nav: true  },
  { route: 'library',    label: 'Library',    icon: 'Library',   nav: true  },
  { route: 'editors',    label: 'Editors',    icon: 'Edit3',     nav: false },
  { route: 'messages',   label: 'Messages',   icon: 'MessageCircle', nav: false },
  { route: 'settings',   label: 'Settings',   icon: 'Settings',  nav: true  },
  { route: 'story',      label: 'Story',      icon: null,        nav: false },
  { route: 'book',       label: 'Book',       icon: null,        nav: false },
  { route: 'publishers', label: 'Publishers', icon: null,        nav: false },
] as const;

// ── Router component ─────────────────────────────────────────────────────────

export function AppRouter() {
  const { route, param, param2 } = useUIStore();

  return (
    <Suspense fallback={<RouteLoading />}>
      {route === 'feed'       && <StoryFeed />}
      {route === 'story'      && <StoryView id={param} />}
      {route === 'compose'    && <CreateStory />}
      {route === 'writers'    && <WriterDirectory />}
      {route === 'library'    && <Library />}
      {route === 'book'       && <StoryView id={param} />}
      {route === 'editors'    && <Editors />}
      {route === 'messages'   && <MessagingPanel initialPartnerId={param ?? undefined} initialPartnerName={param2 ?? undefined} />}
      {route === 'settings'   && <Settings />}
      {route === 'publishers' && <Publishers />}
    </Suspense>
  );
}

function RouteLoading() {
  return (
    <div className="flex items-center justify-center h-64 opacity-40">
      <div className="animate-pulse text-indigo-400 text-sm">Loading...</div>
    </div>
  );
}
