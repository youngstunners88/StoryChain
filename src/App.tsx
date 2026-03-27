import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoryFeed } from './pages/StoryFeed';
import { StoryView } from './pages/StoryView';
import { CreateStory } from './pages/CreateStory';
import { Settings } from './pages/Settings';
import { WriterDirectory } from './pages/WriterDirectory';
import { Library } from './pages/Library';
import { Editors } from './pages/Editors';
import { MessagingPanel } from './pages/MessagingPanel';
import { Publishers } from './pages/Publishers';
import { NotificationBell } from './components/NotificationBell';

// ─── Writers Club Login ───────────────────────────────────────────────────────

const WelcomeScreen: React.FC = () => {
  const [penName, setPenName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = penName.trim();
    if (!name || name.length < 2) return;
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 600));
    login(name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1e1a16 0%, #0d0b08 70%)' }}>

      {/* Background ink drops */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-5"
            style={{
              width: `${300 + i * 120}px`, height: `${300 + i * 120}px`,
              background: 'radial-gradient(circle, #c9a84c, transparent)',
              top: `${10 + i * 30}%`, left: `${20 + i * 25}%`,
              animation: `float ${6 + i * 2}s ease-in-out ${i * 1.5}s infinite`,
            }} />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background: 'linear-gradient(135deg, #c9a84c22, #c9a84c08)', border: '1px solid rgba(201,168,76,0.25)' }}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: '#ede6d6' }}>
            StoryChain
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: '#8a7a68', letterSpacing: '0.18em' }}>
            The Writers Circle
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #2a2218)' }} />
            <span style={{ color: '#c9a84c', fontSize: '1rem' }}>✦</span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #2a2218)' }} />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: '#161210', border: '1px solid #2a2218', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <h2 className="font-serif text-xl mb-1" style={{ color: '#ede6d6' }}>Choose your pen name</h2>
          <p className="text-sm mb-6" style={{ color: '#8a7a68' }}>
            The name the world will know your stories by
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={penName}
                onChange={e => setPenName(e.target.value)}
                placeholder="e.g. Elara Voss, The Inkwright…"
                maxLength={32}
                autoFocus
                className="input-ink w-full px-4 py-3 text-base"
              />
              <p className="mt-2 text-xs" style={{ color: '#4a3f35' }}>
                2–32 characters · Shown as your author name on all stories
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || penName.trim().length < 2}
              className="btn-gold w-full py-3 px-6 text-base flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  Opening the doors…
                </>
              ) : (
                <>
                  Enter the Circle
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-center" style={{ color: '#4a3f35' }}>
            No passwords, no accounts — just your pen name & your stories
          </p>
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '🤖', label: 'AI writes 24/7' },
            { icon: '✍️', label: 'You contribute' },
            { icon: '📖', label: 'Stories evolve' },
          ].map(({ icon, label }) => (
            <div key={label} className="text-center rounded-xl py-3 px-2"
              style={{ background: '#161210', border: '1px solid #2a2218' }}>
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-xs" style={{ color: '#8a7a68' }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { path: 'feed', label: 'The Shelf',
    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
  { path: 'create', label: 'Compose',
    icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z' },
  { path: 'writers', label: 'Writers',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z' },
  { path: 'messages', label: 'Messages',
    icon: 'M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z' },
  { path: 'library', label: 'Library',
    icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { path: 'editors', label: 'Editors',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  { path: 'publishers', label: 'Publishers',
    icon: 'M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z' },
  { path: 'settings', label: 'Settings',
    icon: 'M9.594 3.94c.09-.542.556-.94 1.11-.94h2.593c.554 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.555.941-1.11.941h-2.594c-.555 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const TopNav: React.FC<{ route: string; penName: string | null; onLogout: () => void }> = ({ route, penName, onLogout }) => (
  <nav className="fixed top-0 left-0 right-0 z-50"
    style={{ background: 'rgba(13,11,8,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2a2218' }}>
    <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
      {/* Logo */}
      <a href="#feed" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #c9a84c, #b8942e)' }}>
          <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </div>
        <span className="font-serif font-bold text-lg" style={{ color: '#ede6d6' }}>StoryChain</span>
      </a>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ path, label, icon }) => {
          const active = route === path || (path === 'feed' && (route === '' || route === 'feed'));
          return (
            <a key={path} href={`#${path}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: active ? '#c9a84c' : '#8a7a68',
                background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
              }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              <span className="hidden sm:inline">{label}</span>
            </a>
          );
        })}
      </div>

      {/* Notification bell */}
      <NotificationBell />

      {/* Pen name + logout */}
      <div className="flex items-center gap-2">
        {penName && (
          <span className="hidden sm:block text-sm px-3 py-1 rounded-lg"
            style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
            ✦ {penName}
          </span>
        )}
        <button onClick={onLogout}
          className="p-2 rounded-lg transition-colors"
          style={{ color: '#4a3f35' }}
          title="Change pen name">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </div>
  </nav>
);

// Bottom nav for mobile
const BottomNav: React.FC<{ route: string }> = ({ route }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
    style={{ background: 'rgba(13,11,8,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid #2a2218' }}>
    <div className="flex items-center justify-around py-2">
      {NAV_ITEMS.map(({ path, label, icon }) => {
        const active = route === path || (path === 'feed' && (route === '' || route === 'feed'));
        return (
          <a key={path} href={`#${path}`}
            className="flex flex-col items-center gap-1 px-4 py-1 rounded-lg"
            style={{ color: active ? '#c9a84c' : '#4a3f35' }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            <span className="text-[10px] font-medium">{label}</span>
          </a>
        );
      })}
    </div>
  </nav>
);

// ─── App Content ─────────────────────────────────────────────────────────────

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, penName, logout } = useAuth();
  const [route, setRoute] = useState('feed');
  const [routeParam, setRouteParam] = useState<string | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.slice(1);
      const parts = hash.split('/');
      setRoute(parts[0] || 'feed');
      setRouteParam(parts[1] ?? null);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d0b08' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <WelcomeScreen />;

  const renderPage = () => {
    switch (route) {
      case 'story':   return <StoryView id={routeParam} />;
      case 'create':  return <CreateStory />;
      case 'writers': return <WriterDirectory />;
      case 'library': return <Library />;
      case 'editors':    return <Editors />;
      case 'messages':   return <MessagingPanel />;
      case 'publishers': return <Publishers />;
      case 'settings':   return <Settings />;
      default:           return <StoryFeed />;
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 pt-14" style={{ background: '#0d0b08' }}>
      <TopNav route={route} penName={penName} onLogout={logout} />
      <BottomNav route={route} />
      <main>
        <AnimatePresence mode="wait">
          <motion.div key={route + (routeParam ?? '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
