'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'var(--background)' }}>
      {/* Mesh Gradient Background */}
      <div className="mesh-gradient-bg">
        <div className="mesh-gradient-orb-1" />
        <div className="mesh-gradient-orb-2" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'var(--primary-foreground)',
              boxShadow: 'var(--shadow-lg), inset 0 0.5px 0 0 rgba(255,255,255,0.4)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
            </svg>
          </div>
          <h1 className="type-title1 font-bold mb-2">Welcome back</h1>
          <p className="type-body" style={{ color: 'var(--muted-foreground)' }}>Sign in to your Quizzard account</p>
        </div>

        <div className="auth-glass-card rounded-[32px] p-8 sm:p-10 shadow-2xl">
          {error && (
            <div
              className="p-4 mb-6 rounded-2xl type-footnote text-center"
              style={{
                background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                color: 'var(--danger)',
                border: '0.5px solid color-mix(in srgb, var(--danger) 30%, transparent)'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="type-footnote font-medium px-1" style={{ color: 'var(--foreground)' }}>Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3"
                placeholder="you@university.edu"
              />
            </div>
            <div className="space-y-1.5">
              <label className="type-footnote font-medium px-1" style={{ color: 'var(--foreground)' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3"
                placeholder="••••••••"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl type-callout font-semibold transition-all duration-300 hover-lift depth-press"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 14px 0 color-mix(in srgb, var(--primary) 40%, transparent)',
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center type-subhead" style={{ color: 'var(--muted-foreground)' }}>
          Don't have an account?{' '}
          <Link href="/signup" className="font-semibold transition-colors hover:underline" style={{ color: 'var(--primary)' }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
