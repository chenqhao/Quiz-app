'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { TypeBadge, DifficultyBadge } from '@/components/ui/Badge';

export default function ActiveQuizPage({ params }) {
  const { quizId } = use(params);
  const supabase = createClient();
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    const qIds = JSON.parse(sessionStorage.getItem(`quiz-${quizId}`) || '[]');
    if (qIds.length === 0) {
      router.push('/quiz/start');
      return;
    }

    const { data } = await supabase
      .from('questions')
      .select('*')
      .in('id', qIds);

    // Maintain the shuffled order from sessionStorage
    const ordered = qIds.map(id => data?.find(q => q.id === id)).filter(Boolean);
    setQuestions(ordered);
    setLoading(false);
  };

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Grade each answer
      const results = [];
      for (const q of questions) {
        const userAnswer = answers[q.id] || '';
        let isCorrect = false;
        let feedback = null;

        if (q.type === 'multiple_choice') {
          isCorrect = userAnswer === q.correct_answer;
        } else if (userAnswer.trim()) {
          // Grade written answers via API
          try {
            const res = await fetch('/api/quiz/grade', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                question: q.question_text,
                sampleAnswer: q.correct_answer,
                userAnswer,
              }),
            });
            if (res.ok) {
              const grading = await res.json();
              isCorrect = grading.is_correct;
              feedback = grading.feedback;
            }
          } catch {
            feedback = 'Could not grade automatically. Needs manual review.';
          }
        }

        results.push({
          quiz_attempt_id: quizId,
          question_id: q.id,
          user_answer: userAnswer || null,
          is_correct: isCorrect,
          ai_feedback: feedback,
        });
      }

      // Save answers
      await supabase.from('quiz_answers').insert(results);

      // Update score
      const score = results.filter(r => r.is_correct).length;
      await supabase.from('quiz_attempts').update({
        score,
        total_questions: questions.length,
      }).eq('id', quizId);

      // Clean up sessionStorage
      sessionStorage.removeItem(`quiz-${quizId}`);

      router.push(`/quiz/${quizId}/results`);
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-2 w-full rounded-full mb-8 animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p style={{ color: 'var(--muted-foreground)' }}>No questions found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
        </div>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border p-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex gap-2 mb-4">
          <TypeBadge type={currentQ.type} />
          <DifficultyBadge difficulty={currentQ.difficulty} />
        </div>

        <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
          {currentQ.question_text}
        </h2>

        {currentQ.type === 'multiple_choice' ? (
          <div className="space-y-3">
            {currentQ.choices?.map((choice, ci) => (
              <button
                key={ci}
                onClick={() => setAnswers({ ...answers, [currentQ.id]: choice })}
                className="w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: answers[currentQ.id] === choice ? 'var(--primary)' : 'var(--border)',
                  background: answers[currentQ.id] === choice ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'var(--muted)',
                  color: answers[currentQ.id] === choice ? 'var(--primary)' : 'var(--foreground)',
                  boxShadow: answers[currentQ.id] === choice ? '0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)' : 'none',
                }}
              >
                <span className="font-bold mr-3" style={{ color: 'var(--muted-foreground)' }}>{String.fromCharCode(65 + ci)}.</span>
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[currentQ.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y"
            style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border disabled:opacity-30"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          ← Previous
        </button>

        {/* Question dots */}
        <div className="hidden sm:flex gap-1.5 flex-wrap justify-center max-w-xs">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i === currentIndex
                  ? 'var(--primary)'
                  : answers[q.id]
                    ? 'var(--success)'
                    : 'var(--border)',
              }}
            />
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex(currentIndex + 1)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover-lift"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Next →
          </button>
        ) : (
          <button
            id="submit-quiz-btn"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover-lift disabled:opacity-50"
            style={{ background: submitting ? 'var(--muted)' : 'var(--success)', color: submitting ? 'var(--muted-foreground)' : '#fff' }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-t-transparent" style={{ animation: 'spin 1s linear infinite' }} />
                Grading...
              </span>
            ) : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
}
