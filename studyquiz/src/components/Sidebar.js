'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

// SVG icon components for clean Apple aesthetic
const icons = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  book: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  sparkles: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  ),
  refresh: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  inbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  dot: (
    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
      <circle cx="3" cy="3" r="3" />
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function Sidebar({ user, isOpen, onClose }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [unreadMail, setUnreadMail] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('quiz_mail')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadMail(count || 0);
    } catch (e) {
      // quiz_mail table may not exist yet
    }
  };

  const loadSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select(`
        id, name, icon, color,
        courses (id, name, course_code,
          units (id, title)
        )
      `)
      .order('created_at', { ascending: true });
    setSubjects(data || []);
  };

  // Listen for custom events to refresh sidebar
  useEffect(() => {
    const handler = () => loadSubjects();
    window.addEventListener('sidebar-refresh', handler);
    return () => window.removeEventListener('sidebar-refresh', handler);
  }, []);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path) => pathname === path;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose?.();
    }, 280);
  }, [onClose]);

  const handleNavClick = () => {
    handleClose();
  };

  const navItems = [
    { href: '/', icon: icons.home, label: 'Dashboard' },
    { href: '/subjects', icon: icons.book, label: 'Subjects' },
    { href: '/calendar', icon: icons.calendar, label: 'Calendar' },
    { href: '/generate', icon: icons.sparkles, label: 'AI Generate' },
    { href: '/review', icon: icons.refresh, label: 'Review' },
    { href: '/friends', icon: icons.users, label: 'Friends' },
    { href: '/leaderboard', icon: icons.trophy, label: 'Leaderboard' },
    { href: '/inbox', icon: icons.inbox, label: 'Inbox', badge: unreadMail },
    { href: '/settings', icon: icons.settings, label: 'Settings' },
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 z-40 ${isClosing ? '' : 'library-overlay'}`}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: isClosing ? 0 : 1,
          transition: isClosing ? 'opacity 0.25s ease' : undefined,
        }}
        onClick={handleClose}
      />

      {/* Library Panel */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col w-[300px] ${isClosing ? 'library-panel-closing' : 'library-panel'}`}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          boxShadow: '8px 0 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <span className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Your Library</span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[var(--sidebar-accent)] active:scale-95 cursor-pointer"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {icons.close}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                background: isActive(item.href) ? 'color-mix(in srgb, var(--primary) 10%, transparent)' : undefined,
                color: isActive(item.href) ? 'var(--primary)' : 'var(--sidebar-foreground)',
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'var(--sidebar-accent)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.href)) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              onClick={handleNavClick}
            >
              <span className="flex-shrink-0" style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold badge-pulse"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {/* Subject Tree */}
          {subjects.length > 0 && (
            <div className="pt-4 mt-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                My Subjects
              </p>
              {subjects.map((subject) => (
                <div key={subject.id} className="mb-0.5">
                  <button
                    onClick={() => toggleExpand(subject.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--sidebar-accent)] cursor-pointer"
                    style={{ color: 'var(--sidebar-foreground)' }}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: subject.color || 'var(--primary)' }}
                    />
                    <span className="truncate flex-1 text-left font-medium">{subject.name}</span>
                    <span className={`transition-transform duration-200 flex-shrink-0 ${expanded[subject.id] ? 'rotate-90' : ''}`} style={{ color: 'var(--muted-foreground)' }}>
                      {icons.chevron}
                    </span>
                  </button>

                  {expanded[subject.id] && subject.courses?.map((course) => (
                    <div key={course.id} className="ml-4">
                      <Link
                        href={`/subjects/${subject.id}/courses/${course.id}`}
                        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--sidebar-accent)] cursor-pointer"
                        style={{
                          color: pathname.includes(course.id)
                            ? 'var(--primary)'
                            : 'var(--muted-foreground)',
                        }}
                        onClick={handleNavClick}
                      >
                        <span style={{ color: subject.color || 'var(--primary)', opacity: 0.6 }}>{icons.dot}</span>
                        <span className="truncate">{course.course_code || course.name}</span>
                      </Link>
                      {pathname.includes(course.id) && course.units?.map((unit) => (
                        <Link
                          key={unit.id}
                          href={`/subjects/${subject.id}/courses/${course.id}/units/${unit.id}`}
                          className="flex items-center gap-2 ml-5 px-3 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--sidebar-accent)] cursor-pointer"
                          style={{
                            color: pathname.includes(unit.id)
                              ? 'var(--primary)'
                              : 'var(--muted-foreground)',
                          }}
                          onClick={handleNavClick}
                        >
                          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--muted-foreground)' }} />
                          <span className="truncate">{unit.title}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Quizzard
          </p>
        </div>
      </aside>
    </>
  );
}
