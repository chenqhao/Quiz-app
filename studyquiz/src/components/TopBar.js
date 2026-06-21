'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useState } from 'react';

export default function TopBar({ user, onToggleSidebar }) {
  const router = useRouter();
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

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 border-b backdrop-blur-md"
      style={{
        background: 'color-mix(in srgb, var(--background) 85%, transparent)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onToggleSidebar}
        className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--muted)]"
        style={{ color: 'var(--foreground)' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          id="dark-mode-toggle"
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--muted)]"
          style={{ color: 'var(--muted-foreground)' }}
          title="Toggle dark mode"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1v1m0 14v1m8-8h-1M2 9H1m13.07-5.07l-.71.71M4.64 13.36l-.71.71m11.14 0l-.71-.71M4.64 4.64l-.71-.71M13 9a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 hover:ring-2"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              '--tw-ring-color': 'var(--ring)',
            }}
          >
            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || '?'}
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div
                className="absolute right-0 top-12 w-56 rounded-xl border shadow-xl z-50 py-2 animate-scale-in"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {user?.user_metadata?.full_name || 'Student'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)] flex items-center gap-2"
                  style={{ color: 'var(--danger)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3m0 0l-3-3m3 3H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
