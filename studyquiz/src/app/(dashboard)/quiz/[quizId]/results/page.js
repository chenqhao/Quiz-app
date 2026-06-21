'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { TypeBadge, DifficultyBadge } from '@/components/ui/Badge';

export default function QuizResultsPage({ params }) {
  const { quizId } = use(params);
  const supabase = createClient();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadResults(); }, [quizId]);

  const loadResults = async () => {
    const [attemptRes, answersRes] = await Promise.all([
      supabase.from('quiz_attempts').select('*').eq('id', quizId).single(),
      supabase.from('quiz_answers').select('*, questions(*)').eq('quiz_attempt_id', quizId).order('created_at'),
    ]);
    setAttempt(attemptRes.data);
    setAnswers(answersRes.data || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto"><div className="h-48 rounded-2xl animate-shimmer mb-6" /><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}</div></div>;
  }

  if (!attempt) {
    return <div className="text-center py-16"><p style={{ color: 'var(--muted-foreground)' }}>Quiz not found.</p></div>;
  }

  const pct = attempt.total_questions > 0 ? Math.round((attempt.score / attempt.total_questions) * 100) : 0;
  const correct = answers.filter(a => a.is_correct).length;
  const incorrect = answers.filter(a => !a.is_correct && a.user_answer).length;
  const unanswered = answers.filter(a => !a.user_answer).length;
  const needsReview = answers.filter(a => !a.is_correct);

  // Animated circle for score
  const circumference = 2 * Math.PI * 56;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Score Card */}
      <div className="rounded-2xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="inline-block relative mb-6">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="56" fill="none" stroke="var(--border)" strokeWidth="10" />
            <circle
              cx="70" cy="70" r="56" fill="none"
              stroke={pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>{pct}%</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {pct >= 80 ? '🎉 Excellent!' : pct >= 60 ? '👍 Good job!' : pct >= 40 ? '📚 Keep studying!' : '💪 Don\'t give up!'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          You scored {attempt.score} out of {attempt.total_questions}
        </p>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{correct}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{incorrect}</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Incorrect</p>
          </div>
          {unanswered > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: 'var(--muted-foreground)' }}>{unanswered}</p>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Skipped</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <Link href="/quiz/start" className="px-5 py-2.5 rounded-xl text-sm font-semibold hover-lift" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          Take Another Quiz
        </Link>
        <Link href="/" className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover-lift" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
          Back to Dashboard
        </Link>
      </div>

      {/* Answer Review */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>Question Review</h2>
        <div className="space-y-4">
          {answers.map((answer, i) => {
            const q = answer.questions;
            if (!q) return null;

            return (
              <div
                key={answer.id}
                className={`rounded-2xl border p-5 animate-fade-in stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: 'var(--card)',
                  borderColor: answer.is_correct ? 'var(--success)' : 'var(--danger)',
                  borderLeftWidth: '4px',
                  opacity: 0,
                  animationFillMode: 'forwards',
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm" style={{
                    background: answer.is_correct ? 'color-mix(in srgb, var(--success) 15%, transparent)' : 'color-mix(in srgb, var(--danger) 15%, transparent)',
                    color: answer.is_correct ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {answer.is_correct ? '✓' : '✗'}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2">
                      <TypeBadge type={q.type} />
                      <DifficultyBadge difficulty={q.difficulty} />
                    </div>
                    <p className="text-sm font-medium mb-3" style={{ color: 'var(--foreground)' }}>
                      {i + 1}. {q.question_text}
                    </p>

                    {/* MC choices */}
                    {q.type === 'multiple_choice' && q.choices && (
                      <div className="space-y-1.5 mb-3">
                        {q.choices.map((choice, ci) => {
                          const isUserChoice = answer.user_answer === choice;
                          const isCorrectChoice = q.correct_answer === choice;
                          return (
                            <div key={ci} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{
                              background: isCorrectChoice
                                ? 'color-mix(in srgb, var(--success) 10%, transparent)'
                                : isUserChoice
                                  ? 'color-mix(in srgb, var(--danger) 10%, transparent)'
                                  : 'var(--muted)',
                              color: isCorrectChoice ? 'var(--success)' : isUserChoice ? 'var(--danger)' : 'var(--muted-foreground)',
                              fontWeight: isCorrectChoice || isUserChoice ? '600' : '400',
                            }}>
                              <span>{String.fromCharCode(65 + ci)}.</span>
                              <span>{choice}</span>
                              {isCorrectChoice && <span className="ml-auto">✓ Correct</span>}
                              {isUserChoice && !isCorrectChoice && <span className="ml-auto">✗ Your answer</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Written answer comparison */}
                    {q.type === 'written' && (
                      <div className="space-y-2 mb-3">
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>Your Answer:</p>
                          <p className="text-xs p-2 rounded-lg" style={{ background: 'var(--muted)', color: answer.user_answer ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                            {answer.user_answer || '(no answer)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--success)' }}>Sample Answer:</p>
                          <p className="text-xs p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--success) 5%, transparent)', color: 'var(--foreground)' }}>
                            {q.correct_answer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI Feedback */}
                    {answer.ai_feedback && (
                      <div className="p-3 rounded-lg mb-2" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>🤖 AI Feedback</p>
                        <p className="text-xs" style={{ color: 'var(--foreground)' }}>{answer.ai_feedback}</p>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted-foreground)' }}>💡 Explanation</p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Questions to Review */}
      {needsReview.length > 0 && (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            📝 Questions to Review ({needsReview.length})
          </h2>
          <div className="space-y-2">
            {needsReview.map((a, i) => (
              <div key={a.id} className="p-3 rounded-xl text-sm" style={{ background: 'var(--muted)', color: 'var(--foreground)' }}>
                {a.questions?.question_text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
