'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

// SVG icon components
const icons = {
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  library: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  studyGroups: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  notifications: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  plus: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  flashcards: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <path d="M6 2v2" />
      <path d="M22 8v10a2 2 0 0 1-2 2H8" />
    </svg>
  ),
  studyGuides: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  practiceTests: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  expertSolutions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  dot: (
    <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
      <circle cx="3" cy="3" r="3" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
};

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [collapsed, setCollapsed] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setCollapsed(JSON.parse(saved));
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next));
      return next;
    });
  };

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
      setUnreadCount(count || 0);
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

  // Main navigation items
  const mainNav = [
    { href: '/', icon: icons.home, label: 'Home' },
    { href: '/subjects', icon: icons.library, label: 'Your Classes' },
    { href: '/friends', icon: icons.studyGroups, label: 'Friends' },
    { href: '/inbox', icon: icons.notifications, label: 'Notifications', badge: unreadCount },
  ];

  // Start here items
  const startHere = [
    { href: '/generate', icon: icons.flashcards, label: 'Flashcards' },
    { href: '/review', icon: icons.studyGuides, label: 'Study Guides' },
    { href: '/leaderboard', icon: icons.practiceTests, label: 'Practice Tests' },
    { href: '/settings', icon: icons.expertSolutions, label: 'Expert Solutions' },
  ];

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <aside
      className="sidebar-container"
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
        transition: 'width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94), min-width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        overflow: 'hidden',
        zIndex: 30,
      }}
    >
      {/* Top: Hamburger + Logo */}
      <div
        className="flex items-center gap-2 px-3 py-3"
        style={{
          height: 'var(--topbar-height)',
          borderBottom: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Hamburger toggle */}
        <button
          onClick={toggleCollapsed}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:bg-[var(--sidebar-accent)] active:scale-95 cursor-pointer flex-shrink-0"
          style={{ color: 'var(--sidebar-foreground)' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {icons.menu}
        </button>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'thin' }}>
        {/* Main nav section */}
        <div className="px-2 space-y-0.5">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer relative"
              style={{
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive(item.href) ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
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
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {item.badge > 0 && (
                <span
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold badge-pulse"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    position: collapsed ? 'absolute' : 'static',
                    top: collapsed ? '4px' : undefined,
                    right: collapsed ? '4px' : undefined,
                    fontSize: collapsed ? '9px' : undefined,
                    minWidth: collapsed ? '14px' : undefined,
                    height: collapsed ? '14px' : undefined,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3" style={{ borderTop: '1px solid var(--sidebar-border)' }} />

        {/* Your classes section */}
        {!collapsed && (
          <div className="px-4 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Your classes
            </p>
          </div>
        )}

        <div className="px-2 space-y-0.5">
          {/* New class button */}
          <Link
            href="/subjects"
            className="sidebar-nav-item flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
            style={{
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--sidebar-foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--sidebar-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title={collapsed ? 'New class' : undefined}
          >
            <span className="flex-shrink-0" style={{ opacity: 0.7 }}>
              {icons.plus}
            </span>
            {!collapsed && <span className="flex-1 truncate">New class</span>}
          </Link>

          {/* Subject list (classes) */}
          {!collapsed && subjects.map((subject) => (
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

        {/* Divider */}
        <div className="mx-3 my-3" style={{ borderTop: '1px solid var(--sidebar-border)' }} />

        {/* Start here section */}
        {!collapsed && (
          <div className="px-4 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
              Start here
            </p>
          </div>
        )}

        <div className="px-2 space-y-0.5">
          {startHere.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="sidebar-nav-item flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
              style={{
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive(item.href) ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
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
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0" style={{ opacity: isActive(item.href) ? 1 : 0.7 }}>
                {item.icon}
              </span>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        {!collapsed ? (
          <p className="text-xs px-1" style={{ color: 'var(--muted-foreground)' }}>
            Quizzard
          </p>
        ) : (
          <div className="flex justify-center">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--primary)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
