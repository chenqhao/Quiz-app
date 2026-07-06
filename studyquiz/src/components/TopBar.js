'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TopBar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  const [pageTitle, setPageTitle] = useState('Loading...');

  useEffect(() => {
    const fetchTitle = async () => {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length === 0) {
        setPageTitle('Home');
        return;
      }

      const lastSegment = segments[segments.length - 1];

      // UUID check
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(lastSegment)) {
        let table = '';
        let column = '';
        if (segments[segments.length - 2] === 'subjects') { table = 'subjects'; column = 'name'; }
        else if (segments[segments.length - 2] === 'courses') { table = 'courses'; column = 'name'; }
        else if (segments[segments.length - 2] === 'units') { table = 'units'; column = 'title'; }
        if (table) {
          try {
            const { data } = await supabase.from(table).select(column).eq('id', lastSegment).single();
            if (data) {
              setPageTitle(data[column]);
              return;
            }
          } catch (err) {
            console.error('Error fetching title for topbar:', err);
          }
        }
      }

      setPageTitle(lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1));
    };

    fetchTitle();
  }, [pathname, supabase]);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-5 lg:px-3 glass-heavy border-b"
      style={{
        height: 'var(--topbar-height)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Left section: Logo + Page breadcrumb */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
          style={{ background: 'var(--primary)' }}
          title="Go to Home"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
          </svg>
        </Link>
        <span className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>{pageTitle}</span>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1.5">
        {/* Dark mode toggle */}
        <button
          id="dark-mode-toggle"
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[var(--muted)] active:scale-95 cursor-pointer"
          style={{ color: 'var(--muted-foreground)' }}
          title="Toggle dark mode"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>

        {/* User avatar menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 hover:ring-2 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: '#ffffff',
              '--tw-ring-color': 'var(--ring)',
              '--tw-ring-offset-width': '2px',
              '--tw-ring-offset-color': 'var(--background)',
            }}
          >
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || '?'}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-12 w-56 rounded-2xl border shadow-xl z-50 py-1.5 animate-scale-in overflow-hidden"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {user?.user_metadata?.full_name || 'Student'}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)] flex items-center gap-2.5 cursor-pointer"
                  style={{ color: 'var(--foreground)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>
                <div className="border-t my-1" style={{ borderColor: 'var(--border)' }} />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)] flex items-center gap-2.5 cursor-pointer"
                  style={{ color: 'var(--danger)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
