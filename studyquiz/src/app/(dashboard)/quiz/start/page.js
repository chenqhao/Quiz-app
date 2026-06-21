'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useSearchParams, useRouter } from 'next/navigation';

function QuizStartContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [units, setUnits] = useState([]);
  const [scope, setScope] = useState(searchParams.get('scope') || 'unit');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subjectId') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('courseId') || '');
  const [selectedUnit, setSelectedUnit] = useState(searchParams.get('unitId') || '');
  const [questionCount, setQuestionCount] = useState(10);
  const [availableCount, setAvailableCount] = useState(0);
  const [starting, setStarting] = useState(false);

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => {
    if (selectedSubject) loadCourses(selectedSubject);
    else { setCourses([]); setSelectedCourse(''); }
  }, [selectedSubject]);
  useEffect(() => {
    if (selectedCourse) loadUnits(selectedCourse);
    else { setUnits([]); setSelectedUnit(''); }
  }, [selectedCourse]);
  useEffect(() => { countQuestions(); }, [scope, selectedSubject, selectedCourse, selectedUnit]);

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name').order('name');
    setSubjects(data || []);
  };
  const loadCourses = async (sid) => {
    const { data } = await supabase.from('courses').select('id, name, course_code').eq('subject_id', sid).order('name');
    setCourses(data || []);
  };
  const loadUnits = async (cid) => {
    const { data } = await supabase.from('units').select('id, title').eq('course_id', cid).order('sort_order');
    setUnits(data || []);
  };

  const countQuestions = async () => {
    let query = supabase.from('questions').select('id', { count: 'exact', head: true });
    if (scope === 'unit' && selectedUnit) {
      query = query.eq('unit_id', selectedUnit);
    } else if (scope === 'course' && selectedCourse) {
      const { data: unitIds } = await supabase.from('units').select('id').eq('course_id', selectedCourse);
      if (unitIds?.length) query = query.in('unit_id', unitIds.map(u => u.id));
      else { setAvailableCount(0); return; }
    } else if (scope === 'subject' && selectedSubject) {
      const { data: courseIds } = await supabase.from('courses').select('id').eq('subject_id', selectedSubject);
      if (courseIds?.length) {
        const { data: unitIds } = await supabase.from('units').select('id').in('course_id', courseIds.map(c => c.id));
        if (unitIds?.length) query = query.in('unit_id', unitIds.map(u => u.id));
        else { setAvailableCount(0); return; }
      } else { setAvailableCount(0); return; }
    } else { setAvailableCount(0); return; }
    const { count } = await query;
    setAvailableCount(count || 0);
  };

  const startQuiz = async () => {
    setStarting(true);
    // Fetch question IDs
    let query = supabase.from('questions').select('id');
    if (scope === 'unit') query = query.eq('unit_id', selectedUnit);
    else if (scope === 'course') {
      const { data: unitIds } = await supabase.from('units').select('id').eq('course_id', selectedCourse);
      query = query.in('unit_id', unitIds.map(u => u.id));
    } else {
      const { data: courseIds } = await supabase.from('courses').select('id').eq('subject_id', selectedSubject);
      const { data: unitIds } = await supabase.from('units').select('id').in('course_id', courseIds.map(c => c.id));
      query = query.in('unit_id', unitIds.map(u => u.id));
    }
    const { data: allQs } = await query;
    if (!allQs?.length) { setStarting(false); return; }

    // Shuffle and limit
    const shuffled = allQs.sort(() => Math.random() - 0.5).slice(0, questionCount);
    const qIds = shuffled.map(q => q.id);

    // Create quiz attempt
    const { data: { user } } = await supabase.auth.getUser();
    const { data: attempt } = await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      subject_id: selectedSubject || null,
      course_id: selectedCourse || null,
      unit_id: selectedUnit || null,
      scope,
      score: 0,
      total_questions: qIds.length,
    }).select().single();

    // Store question IDs in sessionStorage for the quiz page
    sessionStorage.setItem(`quiz-${attempt.id}`, JSON.stringify(qIds));
    router.push(`/quiz/${attempt.id}`);
  };

  const isReady = () => {
    if (scope === 'unit') return !!selectedUnit;
    if (scope === 'course') return !!selectedCourse;
    return !!selectedSubject;
  };

  const selectStyle = { background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
          <span className="text-3xl">🎯</span>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Start a Quiz</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Configure your quiz and test your knowledge</p>
      </div>

      <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {/* Scope */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Quiz Scope</label>
          <div className="flex rounded-xl p-1" style={{ background: 'var(--muted)' }}>
            {['unit', 'course', 'subject'].map((s) => (
              <button key={s} onClick={() => setScope(s)} className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all" style={{
                background: scope === s ? 'var(--card)' : 'transparent',
                color: scope === s ? 'var(--foreground)' : 'var(--muted-foreground)',
                boxShadow: scope === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Selectors */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Subject</label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={selectStyle}>
            <option value="">Select subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {(scope === 'course' || scope === 'unit') && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={selectStyle} disabled={!selectedSubject}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.course_code || c.name}</option>)}
            </select>
          </div>
        )}

        {scope === 'unit' && (
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Unit</label>
            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none" style={selectStyle} disabled={!selectedCourse}>
              <option value="">Select unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
            </select>
          </div>
        )}

        {/* Question Count */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Number of Questions
            <span className="font-normal ml-2" style={{ color: 'var(--muted-foreground)' }}>({availableCount} available)</span>
          </label>
          <div className="flex items-center gap-4">
            <input type="range" min="1" max={Math.max(availableCount, 1)} value={Math.min(questionCount, availableCount || 1)} onChange={(e) => setQuestionCount(Number(e.target.value))} className="flex-1 accent-[var(--primary)]" />
            <span className="text-lg font-bold w-10 text-center" style={{ color: 'var(--foreground)' }}>{Math.min(questionCount, availableCount || 0)}</span>
          </div>
        </div>
      </div>

      <button
        id="start-quiz-btn"
        onClick={startQuiz}
        disabled={starting || !isReady() || availableCount === 0}
        className="w-full py-4 rounded-2xl text-base font-bold transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: starting ? 'var(--muted)' : 'linear-gradient(135deg, var(--primary), var(--secondary))', color: starting ? 'var(--muted-foreground)' : '#fff' }}
      >
        {starting ? 'Starting...' : availableCount === 0 ? 'No questions available' : `Start Quiz (${Math.min(questionCount, availableCount)} questions)`}
      </button>
    </div>
  );
}

export default function QuizStartPage() {
  return (
    <Suspense fallback={<div className="h-10 w-64 mx-auto rounded-lg animate-shimmer" />}>
      <QuizStartContent />
    </Suspense>
  );
}
