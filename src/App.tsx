// StoryChain App - Main application with routing
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoryFeed } from './pages/StoryFeed';
import { StoryView } from './pages/StoryView';
import { UserProfile } from './pages/UserProfile';
import { TokenStore } from './pages/TokenStore';
import { CreateStory } from './pages/CreateStory';
import { Settings } from './pages/Settings';

// Login Component
const Login: React.FC = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  // Try to get ZO_CLIENT_IDENTITY_TOKEN from environment if available
  useEffect(() => {
    const envToken = (window as any).__STORYCHAIN_API_TOKEN__;
    if (envToken) {
      setToken(envToken);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!token.trim()) {
      setError('Please enter your authentication token');
      setIsSubmitting(false);
      return;
    }

    // Validate token by making a test request
    try {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
        },
      });

      if (response.ok) {
        login(token.trim());
      } else if (response.status === 401) {
        setError('Invalid token. Please check your StoryChain API Token in Settings > Advanced.');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">Welcome to StoryChain</h1>
          <p className="text-zinc-500">Multi-LLM Collaborative Storytelling</p>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">Authentication Required</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                StoryChain API Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your token..."
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
              />
              <p className="mt-2 text-xs text-zinc-500">
                Find your token in{' '}
                <a
                  href=""
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400"
                >
                  Settings &gt; Advanced
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Navigation component
const Navigation: React.FC<{ 
  currentRoute: string; 
  isAuthenticated?: boolean;
  onLoginClick?: () => void;
}> = ({ currentRoute, isAuthenticated, onLoginClick }) => {
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
            
            {/* Guest indicator / Login button */}
            {!isAuthenticated && onLoginClick && (
              <button
                onClick={onLoginClick}
                className="hidden md:flex items-center gap-1 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors ml-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <span className="text-sm font-medium">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Main App content component (inside AuthProvider)
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [route, setRoute] = useState('feed');
  const [routeParam, setRouteParam] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

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

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show login modal if explicitly requested
  if (showLogin) {
    return (
      <>
        <div className="min-h-screen bg-zinc-950 pb-20 md:pt-20 opacity-50">
          <Navigation currentRoute={route} isAuthenticated={isAuthenticated} />
          <main className="min-h-[calc(100vh-80px)]">
            <StoryFeed />
          </main>
        </div>
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="max-w-md w-full mx-4">
            <LoginModal onClose={() => setShowLogin(false)} />
          </div>
        </div>
      </>
    );
  }

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
        return isAuthenticated ? <Settings /> : <SettingsGuest />;
      case 'tokens':
        return isAuthenticated ? <TokenStore /> : <TokenStoreGuest />;
      default:
        return <StoryFeed />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pb-20 md:pt-20">
      <Navigation currentRoute={route} isAuthenticated={isAuthenticated} onLoginClick={() => setShowLogin(true)} />
      <main className="min-h-[calc(100vh-80px)]">
        {renderPage()}
      </main>
    </div>
  );
};

// Guest-friendly Settings page
const SettingsGuest: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-800 rounded-xl">
            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.556-.94 1.11-.94h2.593c.554 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.555.941-1.11.941h-2.594c-.555 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-zinc-500">Configure your StoryChain experience</p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <h2 className="text-lg font-medium text-amber-400 mb-2">Authentication Required</h2>
          <p className="text-zinc-400 mb-4">
            To access settings and publish stories, you need to add your API token.
          </p>
          <a
            href=""
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
          >
            Go to Settings &gt; Advanced
          </a>
        </div>
      </div>
    </div>
  );
};

// Guest Token Store page
const TokenStoreGuest: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">Token Store</h2>
          <p className="text-zinc-500 mb-6">
            Sign in to purchase tokens and unlock extended character limits.
          </p>
          <a
            href=""
            className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors"
          >
            Add API Token
          </a>
        </div>
      </div>
    </div>
  );
};

// Login Modal component
const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-200">Authentication Required</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-zinc-400 mb-4">
        To publish stories and access all features, add your API token in Settings &gt; Advanced.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
        >
          Continue as Guest
        </button>
        <a
          href=""
          className="flex-1 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-black font-medium rounded-lg transition-colors text-center"
        >
          Add Token
        </a>
      </div>
    </div>
  );
};

// Main App component
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;