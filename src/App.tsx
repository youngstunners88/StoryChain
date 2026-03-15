// StoryChain App - Main application with routing
import React, { useState, useEffect } from 'react';
import { StoryFeed } from './pages/StoryFeed';
import { StoryView } from './pages/StoryView';
import { UserProfile } from './pages/UserProfile';
import { TokenStore } from './pages/TokenStore';
import { CreateStory } from './pages/CreateStory';
import { Settings } from './pages/Settings';

// Navigation component
const Navigation: React.FC<{ currentRoute: string }> = ({ currentRoute }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { path: 'feed', label: 'Discover', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
    { path: 'create', label: 'Create', icon: 'M12 4.5v15m7.5-7.5h-15' },
    { path: 'tokens', label: 'Tokens', icon: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' },
    { path: 'settings', label: 'Settings', icon: 'M9.594 3.94c.09-.542.556-.94 1.11-.94h2.593c.554 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.555.941-1.11.941h-2.594c-.555 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  const isActive = (path: string) => {
    if (path === 'feed' && (currentRoute === '' || currentRoute === 'feed')) return true;
    return currentRoute === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-between py-2 md:py-4">
          {/* Logo - desktop only */}
          <a href="#feed" className="hidden md:flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-zinc-100">StoryChain</span>
          </a>

          {/* Nav items */}
          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map(({ path, label, icon }) => (
              <a
                key={path}
                href={`#${path}`}
                className={`
                  flex flex-col md:flex-row items-center gap-1 px-3 md:px-4 py-2 rounded-lg transition-colors
                  ${isActive(path)
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <span className="text-xs md:text-sm font-medium">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App component
export const App: React.FC = () => {
  const [route, setRoute] = useState('feed');
  const [routeParam, setRouteParam] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const parts = hash.split('/');
      
      if (parts.length >= 2) {
        setRoute(parts[0]);
        setRouteParam(parts[1]);
      } else {
        setRoute(hash || 'feed');
        setRouteParam(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Render the appropriate page based on route
  const renderPage = () => {
    switch (route) {
      case 'feed':
      case '':
        return <StoryFeed />;
      case 'story':
        return <StoryView />;
      case 'user':
        return <UserProfile />;
      case 'create':
        return <CreateStory />;
      case 'settings':
        return <Settings />;
      case 'tokens':
        return <TokenStore />;
      default:
        return <StoryFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pt-20">
      <Navigation currentRoute={route} />
      <main className="min-h-[calc(100vh-80px)]">
        {renderPage()}
      </main>
    </div>
  );
};

export default App;