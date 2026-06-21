'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function Sidebar({ user, collapsed, mobileOpen, onToggleCollapse, onMobileClose }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadSubjects();
  }, []);

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

  const navItems = [
    { href: '/', icon: '🏠', label: 'Dashboard' },
    { href: '/subjects', icon: '📚', label: 'Subjects' },
    { href: '/calendar', icon: '🗓️', label: 'Calendar' },
    { href: '/generate', icon: '✨', label: 'AI Generate' },
    { href: '/review', icon: '🔄', label: 'Review' },
    { href: '/settings', icon: '⚙️', label: 'Settings' },
  ];

  // On desktop (lg+): toggle collapse. On mobile: close sidebar.
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches) {
      onToggleCollapse?.();
    } else {
      onMobileClose?.();
    }
  };

  return (
    <>
      {/* Mobile Overlay - only rendered when mobile sidebar is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 lg:z-30 lg:sticky lg:top-0 flex flex-col border-r transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-[280px] ${collapsed ? 'lg:w-[72px]' : ''}`}
        style={{
          background: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
          height: '100vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            onClick={handleToggle}
            className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 cursor-pointer transition-transform duration-200 hover:scale-110"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="text-lg">🎓</span>
          </button>
          <span className={`text-lg font-bold gradient-text ${collapsed ? 'lg:hidden' : ''}`}>StudyQuiz</span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive(item.href) ? '' : 'hover:bg-[var(--sidebar-accent)]'
                }`}
              style={{
                background: isActive(item.href) ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                color: isActive(item.href) ? 'var(--primary)' : 'var(--sidebar-foreground)',
              }}
              onClick={() => onMobileClose?.()}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </Link>
          ))}

          {/* Subject Tree - hidden on desktop when collapsed, always visible on mobile */}
          <div className={collapsed ? 'lg:hidden' : ''}>
            {subjects.length > 0 && (
              <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  My Subjects
                </p>
                {subjects.map((subject) => (
                  <div key={subject.id} className="mb-1">
                    <button
                      onClick={() => toggleExpand(subject.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--sidebar-accent)]"
                      style={{ color: 'var(--sidebar-foreground)' }}
                    >
                      <span className="flex-shrink-0">{subject.icon || '📚'}</span>
                      <span className="truncate flex-1 text-left font-medium">{subject.name}</span>
                      <svg
                        width="12" height="12" viewBox="0 0 12 12" fill="none"
                        className={`transition-transform duration-200 flex-shrink-0 ${expanded[subject.id] ? 'rotate-90' : ''}`}
                      >
                        <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>

                    {expanded[subject.id] && subject.courses?.map((course) => (
                      <div key={course.id} className="ml-4">
                        <Link
                          href={`/subjects/${subject.id}/courses/${course.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-[var(--sidebar-accent)]"
                          style={{
                            color: pathname.includes(course.id)
                              ? 'var(--primary)'
                              : 'var(--muted-foreground)',
                          }}
                          onClick={() => onMobileClose?.()}
                        >
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: subject.color || 'var(--primary)' }} />
                          <span className="truncate">{course.course_code || course.name}</span>
                        </Link>
                        {pathname.includes(course.id) && course.units?.map((unit) => (
                          <Link
                            key={unit.id}
                            href={`/subjects/${subject.id}/courses/${course.id}/units/${unit.id}`}
                            className="flex items-center gap-2 ml-4 px-3 py-1 rounded-lg text-xs transition-colors hover:bg-[var(--sidebar-accent)]"
                            style={{
                              color: pathname.includes(unit.id)
                                ? 'var(--primary)'
                                : 'var(--muted-foreground)',
                            }}
                            onClick={() => onMobileClose?.()}
                          >
                            <span>○</span>
                            <span className="truncate">{unit.title}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
