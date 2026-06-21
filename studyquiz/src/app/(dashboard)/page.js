'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({ subjects: 0, courses: 0, questions: 0 });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [weakUnits, setWeakUnits] = useState([]);
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
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Subjects', value: stats.subjects, icon: '📚', color: 'var(--primary)', href: '/subjects' },
    { label: 'Courses', value: stats.courses, icon: '📖', color: 'var(--secondary)', href: '/subjects' },
    { label: 'Questions', value: stats.questions, icon: '❓', color: 'var(--accent)', href: '/review' },
    { label: 'Quizzes Taken', value: recentQuizzes.length, icon: '✅', color: 'var(--success)', href: '/review' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg animate-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Welcome back! Here&apos;s your study overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            href={card.href || '#'}
            key={card.label}
            className={`block rounded-2xl p-5 border hover-lift transition-all duration-300 animate-fade-in stagger-${i + 1}`}
            style={{ background: 'var(--card)', borderColor: 'var(--border)', opacity: 0, animationFillMode: 'forwards' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${card.color} 12%, transparent)` }}
              >
                <span className="text-lg font-bold" style={{ color: card.color }}>{card.value}</span>
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/subjects"
          className="rounded-2xl p-5 border hover-lift transition-all flex items-center gap-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center gradient-primary">
            <span className="text-xl">➕</span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Add Subject</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Create a new study subject</p>
          </div>
        </Link>
        <Link
          href="/generate"
          className="rounded-2xl p-5 border hover-lift transition-all flex items-center gap-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--secondary))' }}>
            <span className="text-xl">✨</span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Generate with AI</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Create questions from notes</p>
          </div>
        </Link>
        <Link
          href="/review"
          className="rounded-2xl p-5 border hover-lift transition-all flex items-center gap-4"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--success), #059669)' }}>
            <span className="text-xl">🔄</span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Review Questions</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Study your saved questions</p>
          </div>
        </Link>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quizzes */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>Recent Quizzes</h2>
          {recentQuizzes.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
              No quizzes taken yet. Start your first quiz!
            </p>
          ) : (
            <div className="space-y-3">
              {recentQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'var(--muted)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {quiz.scope} quiz
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {new Date(quiz.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: quiz.score / quiz.total_questions >= 0.7 ? 'var(--success)' : 'var(--danger)' }}>
                      {quiz.score}/{quiz.total_questions}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {Math.round((quiz.score / quiz.total_questions) * 100)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weakest Units */}
        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>Needs Attention</h2>
          {weakUnits.length === 0 ? (
            <p className="text-sm py-4" style={{ color: 'var(--muted-foreground)' }}>
              Take some quizzes to see which units need more study.
            </p>
          ) : (
            <div className="space-y-3">
              {weakUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-3 rounded-xl"
                  style={{ background: 'var(--muted)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{unit.title}</p>
                      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{unit.courseName}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--danger)' }}>{Math.round(unit.avg)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${unit.avg}%`, background: unit.avg < 50 ? 'var(--danger)' : 'var(--warning)' }}
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
