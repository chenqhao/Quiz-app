'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function Sidebar({ user, onCollapse }) {
  const pathname = usePathname();
  const supabase = createClient();
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [collapsed, setCollapsed] = useState(false);

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
    { href: '/generate', icon: '✨', label: 'AI Generate' },
    { href: '/review', icon: '🔄', label: 'Review' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        style={{ display: collapsed ? 'none' : 'block' }}
        onClick={() => { setCollapsed(true); onCollapse?.(true); }}
      />

      <aside
        className={`fixed top-0 left-0 h-full z-50 lg:z-30 lg:sticky lg:top-0 flex flex-col border-r transition-all duration-300 ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[72px]' : 'translate-x-0 w-[280px]'
        }`}
        style={{
          background: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
          height: '100vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <span className="text-lg">🎓</span>
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">StudyQuiz</span>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); onCollapse?.(!collapsed); }}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--sidebar-accent)]"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {collapsed ? (
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href) ? '' : 'hover:bg-[var(--sidebar-accent)]'
              }`}
              style={{
                background: isActive(item.href) ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                color: isActive(item.href) ? 'var(--primary)' : 'var(--sidebar-foreground)',
              }}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}

          {/* Subject Tree */}
          {!collapsed && subjects.length > 0 && (
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
        </nav>

        {/* User Section */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 px-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--sidebar-foreground)' }}>
                  {user?.user_metadata?.full_name || 'Student'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--muted-foreground)' }}>
                  {user?.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
