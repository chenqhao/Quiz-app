'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({ subjects: 0, courses: 0, questions: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [weakUnits, setWeakUnits] = useState([]);
  const [jumpBackItems, setJumpBackItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [subjectsRes, coursesRes, questionsRes, quizzesRes] = await Promise.all([
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('*').order('completed_at', { ascending: false }).limit(5),
      ]);

      setStats({
        subjects: subjectsRes.count || 0,
        courses: coursesRes.count || 0,
        questions: questionsRes.count || 0,
      });

      setRecentQuizzes(quizzesRes.data || []);

      // Load weak units — units with lowest average scores
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('unit_id, score, total_questions')
        .not('unit_id', 'is', null);

      if (attempts && attempts.length > 0) {
        const unitScores = {};
        attempts.forEach((a) => {
          if (!unitScores[a.unit_id]) unitScores[a.unit_id] = { total: 0, correct: 0, count: 0 };
          unitScores[a.unit_id].total += a.total_questions;
          unitScores[a.unit_id].correct += a.score;
          unitScores[a.unit_id].count += 1;
        });

        const weakIds = Object.entries(unitScores)
          .map(([id, s]) => ({ id, avg: s.total > 0 ? (s.correct / s.total) * 100 : 0 }))
          .sort((a, b) => a.avg - b.avg)
          .slice(0, 3);

        if (weakIds.length > 0) {
          const { data: units } = await supabase
            .from('units')
            .select('id, title, course_id, courses(name, course_code)')
            .in('id', weakIds.map((w) => w.id));

          setWeakUnits(
            weakIds.map((w) => {
              const unit = units?.find((u) => u.id === w.id);
              return { ...w, title: unit?.title, courseName: unit?.courses?.course_code || unit?.courses?.name };
            }).filter((w) => w.title)
          );
        }
      }

      // Quick Jump Back — most recently viewed subjects/courses
      const { data: recentSubjects } = await supabase
        .from('subjects')
        .select('id, name, color, icon')
        .order('updated_at', { ascending: false })
        .limit(4);

      if (recentSubjects && recentSubjects.length > 0) {
        setJumpBackItems(recentSubjects.map(s => ({
          id: s.id,
          title: s.name,
          color: s.color || 'var(--primary)',
          href: `/subjects`,
          type: 'subject',
        })));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Subjects',
      value: stats.subjects,
      color: 'var(--primary)',
      href: '/subjects',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
    },
    {
      label: 'Courses',
      value: stats.courses,
      color: 'var(--secondary)',
      href: '/subjects',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      label: 'Questions',
      value: stats.questions,
      color: 'var(--accent)',
      href: '/review',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      label: 'Quizzes Taken',
      value: recentQuizzes.length,
      color: 'var(--success)',
      href: '/review',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 rounded-2xl animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 rounded-2xl animate-shimmer" />
          <div className="h-64 rounded-2xl animate-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header — Apple clean */}
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Welcome back! Here&apos;s your study overview.
        </p>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            href={card.href || '#'}
            key={card.label}
            className={`bento-card bento-card-interactive cursor-pointer animate-fade-in stagger-${i + 1}`}
            style={{ opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${card.color} 10%, transparent)`,
                  color: card.color,
                }}
              >
                {card.icon}
              </div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              {card.value}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions — Bento style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/subjects"
          className="bento-card bento-card-interactive flex items-center gap-4 cursor-pointer"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Add Subject</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Create a new study subject</p>
          </div>
        </Link>
        <Link
          href="/generate"
          className="bento-card bento-card-interactive flex items-center gap-4 cursor-pointer"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--secondary), var(--accent))', color: '#fff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Generate with AI</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Create questions from notes</p>
          </div>
        </Link>
        <Link
          href="/review"
          className="bento-card bento-card-interactive flex items-center gap-4 cursor-pointer"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--success)', color: '#fff' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Review Questions</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Study your saved questions</p>
          </div>
        </Link>
      </div>

      {/* Quick Jump Back */}
      {jumpBackItems.length > 0 && (
        <div className="animate-fade-in">
          <h2 className="section-header mb-4">Quick Jump Back</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {jumpBackItems.map((item, i) => (
              <Link
                key={item.id}
                href={item.href}
                className={`bento-card bento-card-interactive cursor-pointer flex items-center gap-3 animate-fade-in stagger-${i + 1}`}
                style={{
                  padding: '16px',
                  opacity: 0,
                  animationFillMode: 'forwards',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom grid — Recent Quizzes + Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Quizzes */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Recent Quizzes
            </h2>
            {recentQuizzes.length > 0 && (
              <Link
                href="/review"
                className="text-xs font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--primary)' }}
              >
                See All
              </Link>
            )}
          </div>
          {recentQuizzes.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No quizzes taken yet. Start your first quiz!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuizzes.map((quiz) => {
                const percentage = Math.round((quiz.score / quiz.total_questions) * 100);
                const isGood = percentage >= 70;
                return (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl transition-colors"
                    style={{ background: 'var(--muted)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `color-mix(in srgb, ${isGood ? 'var(--success)' : 'var(--danger)'} 12%, transparent)`,
                          color: isGood ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {percentage}%
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                          {quiz.scope} quiz
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(quiz.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold" style={{ color: isGood ? 'var(--success)' : 'var(--danger)' }}>
                      {quiz.score}/{quiz.total_questions}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Needs Attention */}
        <div className="bento-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
              Needs Attention
            </h2>
            {weakUnits.length > 0 && (
              <Link
                href="/review"
                className="text-xs font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--danger)' }}
              >
                Study Now
              </Link>
            )}
          </div>
          {weakUnits.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Take some quizzes to see which units need more study.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {weakUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3.5 rounded-2xl"
                  style={{ background: 'var(--muted)' }}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{unit.title}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{unit.courseName}</p>
                    </div>
                    <span
                      className="text-sm font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        color: unit.avg < 50 ? 'var(--danger)' : 'var(--warning)',
                        background: `color-mix(in srgb, ${unit.avg < 50 ? 'var(--danger)' : 'var(--warning)'} 10%, transparent)`,
                      }}
                    >
                      {Math.round(unit.avg)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${unit.avg}%`,
                        background: unit.avg < 50
                          ? 'var(--danger)'
                          : 'var(--warning)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
