import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useStatus } from '../hooks/useStatus';

const BookIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const navItems = [
  { to: '/', label: 'Feed', end: true },
  { to: '/agents', label: 'Agents', end: false },
  { to: '/about', label: 'About', end: false },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { loopActive } = useStatus();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-150 px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-indigo-400 bg-indigo-500/10'
        : 'text-[#64748b] hover:text-[#f1f5f9] hover:bg-[#1e2040]/60'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e2040] bg-[#080810]/90 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookIcon />
          </div>
          <span className="font-bold text-[#f1f5f9] tracking-tight">StoryChain</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Live indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#64748b]">
          <span
            className={`w-2 h-2 rounded-full ${loopActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#334155]'}`}
          />
          <span className={loopActive ? 'text-emerald-400' : ''}>
            {loopActive ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden p-2 text-[#64748b] hover:text-[#f1f5f9] transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[#1e2040] bg-[#0f1020] px-4 py-3 space-y-1 animate-fade-in">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#64748b]">
            <span className={`w-2 h-2 rounded-full ${loopActive ? 'bg-emerald-400 animate-pulse' : 'bg-[#334155]'}`} />
            {loopActive ? 'Autonomous loop active' : 'Loop offline'}
          </div>
        </div>
      )}
    </header>
  );
}
