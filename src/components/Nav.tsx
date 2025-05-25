'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Calendar, Timer, BarChart2, LucideIcon, Menu, X, ChevronDown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/Spinner';

interface NavItemProps {
  href: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

function NavItem({ href, title, subtitle, icon: Icon }: NavItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  // Normalize paths by removing trailing slashes
  const normalize = (str: string) => str.replace(/\/+$/, '');
  const normalizedPath = normalize(pathname);
  const normalizedHref = normalize(href);
  const isActive = normalizedPath === normalizedHref;
  const showIcon = href === '/' || href === '/pomodoro' || href === '/profile';

  const handleClick = async (e: React.MouseEvent) => {
    if (isActive) return; // Prevent loading if already on page
    e.preventDefault();
    setIsLoading(true);
    try {
      await router.push(href);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Spinner size={32} message={`Loading ${title.toLowerCase()}...`} />
        </div>
      )}
      <Link 
        href={href}
        onClick={handleClick}
        className={`flex flex-col items-start group relative transition-all duration-200 px-3 py-3 rounded-xl whitespace-nowrap` + (isActive ? ' shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 bg-white/5' : '')}
      >
        <div className="flex items-center gap-2 min-w-0">
          {showIcon && <Icon size={17} className={isActive ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-gray-400 group-hover:text-mint-400 transition-colors'} />}
          <span className={`font-medium transition-colors text-[15px] truncate ${isActive ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-white group-hover:text-mint-400'}`}>{title}</span>
        </div>
        <div className={`absolute -bottom-1 left-3 h-1 rounded-full blur-sm transition-all duration-300 ${isActive ? 'w-3/4 bg-purple-300/70' : 'w-0 group-hover:w-3/4 bg-mint-400/60'}`} />
      </Link>
    </>
  );
}

function MonthlyOverviewNavLink() {
  const pathname = usePathname();
  // Normalize paths
  const normalize = (str: string) => str.replace(/\/+$|\/+(?=\/)/g, '');
  const normalizedPath = normalize(pathname);
  const normalizedHref = '/stats';
  const isActive = normalizedPath === normalizedHref;
  return (
    <Link
      href="/stats"
      className={`flex flex-col items-start group relative transition-all duration-200 px-3 py-3 rounded-xl whitespace-nowrap
        ${isActive ? 'shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 bg-white/5' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <BarChart2 size={17} className={isActive ? 'text-purple-400 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-gray-400 group-hover:text-mint-400 transition-colors'} />
        <span className={`font-medium transition-colors text-[15px] truncate ${isActive ? 'text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]' : 'text-white group-hover:text-mint-400'}`}>Monthly Analytics</span>
      </div>
      <div className={`absolute -bottom-1 left-3 h-1 rounded-full blur-sm transition-all duration-300 ${isActive ? 'w-3/4 bg-purple-300/70' : 'w-0 group-hover:w-3/4 bg-mint-400/60'}`} />
    </Link>
  );
}

const PLANNER_ITEMS = [
  { href: '/daily', label: 'Daily Tasks', icon: User },
  { href: '/planner', label: 'Weekly Planner', icon: Calendar },
  { href: '/monthly-planner', label: 'Monthly Planner', icon: Calendar },
];
const ANALYTICS_ITEMS = [
  { href: '/stats', label: 'Monthly Analytics', icon: BarChart2 },
];

export default function Nav() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Close analytics dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.analytics-dropdown')) {
        setAnalyticsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-md pt-4 border-b border-white/10 shadow-lg shadow-black/5 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-6">
        {/* Logo */}
        <Link href="/" className="flex items-center z-20 font-sans">
          <img src="/logo.png" alt="FocusQuest" className="h-16 w-auto" />
        </Link>

        {/* Hamburger (mobile only) */}
        <button
          className="md:hidden flex items-center justify-center p-2 rounded-lg text-white hover:bg-white/10 transition font-sans z-[101]"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(v => !v)}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Nav Links (desktop) */}
        <div className="hidden md:flex items-center gap-2 font-sans">
          {/* Home - Always accessible */}
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold transition-all duration-200 whitespace-nowrap ${
              pathname === '/' ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:text-mint-400'
            }`}
          >
            <Home size={18} className={pathname === '/' ? 'text-purple-400' : 'text-gray-400'} />
            Home
          </Link>

          {/* Planner Items - Only for logged in users, grayed out for guests */}
          {user ? (
            PLANNER_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold transition-all duration-200 whitespace-nowrap ${
                pathname === item.href ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:text-mint-400'
              }`}
            >
              {item.label}
            </Link>
            ))
          ) : (
            PLANNER_ITEMS.map(item => (
              <div
                key={item.href}
                className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold text-gray-500 cursor-not-allowed"
              >
                {item.label}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Sign in to unlock this feature and sync your progress across devices.
                </div>
              </div>
            ))
          )}

          {/* Pomodoro - Always accessible */}
          <Link
            href="/pomodoro"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold transition-all duration-200 whitespace-nowrap ${
              pathname === '/pomodoro' ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:text-mint-400'
            }`}
          >
            <Timer size={18} className={pathname === '/pomodoro' ? 'text-purple-400' : 'text-gray-400'} />
            Pomodoro
          </Link>

          {/* Profile Link or Sign In */}
          {user ? (
          <Link
            href="/profile"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold transition-all duration-200 whitespace-nowrap ${
                (pathname === '/profile' || pathname === '/weekly-analytics' || pathname === '/stats')
                  ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300'
                  : 'text-white hover:text-mint-400'
            }`}
          >
              <User size={18} className={(pathname === '/profile' || pathname === '/weekly-analytics' || pathname === '/stats') ? 'text-purple-400' : 'text-gray-400'} />
            Profile
          </Link>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[17px] font-semibold transition-all duration-200 whitespace-nowrap text-white hover:text-mint-400`}
            >
              <User size={18} className="text-gray-400 group-hover:text-mint-400 transition-colors" />
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 h-screen w-full bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {mobileMenuOpen && (
          <div 
            className="fixed inset-y-0 right-0 w-80 h-screen overflow-y-auto bg-gray-900/95 backdrop-blur-md border-l border-white/10 shadow-lg shadow-black/5 z-50"
            onClick={e => e.stopPropagation()}
          >
            {/* Menu content */}
            <div className="flex flex-col min-h-screen">
              <div className="flex-1 px-4 py-24 space-y-2">
                <Link
                  href="/"
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 text-[17px] font-semibold ${
                    pathname === '/' ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home size={18} className={pathname === '/' ? 'text-purple-400' : 'text-gray-400'} />
                  <span className="font-semibold">Home</span>
                </Link>

                {/* Planner Items - Only for logged in users, grayed out for guests */}
                {user ? (
                  PLANNER_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 text-[17px] font-semibold ${
                      pathname === item.href ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:bg-white/10'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="font-semibold">{item.label}</span>
                  </Link>
                  ))
                ) : (
                  PLANNER_ITEMS.map(item => (
                    <div
                      key={item.href}
                      className="group relative flex items-center gap-2 px-3 py-3 rounded-xl text-[17px] font-semibold text-gray-500 cursor-not-allowed"
                    >
                      <span className="font-semibold">{item.label}</span>
                      <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        Sign in to unlock this feature and sync your progress across devices.
                      </div>
                    </div>
                  ))
                )}

                <Link
                  href="/pomodoro"
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 text-[17px] font-semibold ${
                    pathname === '/pomodoro' ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Timer size={18} className={pathname === '/pomodoro' ? 'text-purple-400' : 'text-gray-400'} />
                  <span className="font-semibold">Pomodoro</span>
                </Link>

                {/* Profile Link in Mobile Menu */}
                {user ? (
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 text-[17px] font-semibold ${
                    pathname === '/profile' ? 'bg-white/5 shadow-[0_0_16px_4px_rgba(168,85,247,0.7)] shadow-purple-500/70 text-purple-300' : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User size={18} className={pathname === '/profile' ? 'text-purple-400' : 'text-gray-400'} />
                  <span className="font-semibold">Profile</span>
                </Link>
                ) : (
                  <Link
                    href="/login"
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all duration-200 text-[17px] font-semibold text-white hover:bg-white/10`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={18} className="text-gray-400 group-hover:text-mint-400" />
                    <span className="font-semibold">Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}