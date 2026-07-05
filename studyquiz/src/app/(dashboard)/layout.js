'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{
              borderColor: 'var(--primary)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Library overlay panel — no permanent sidebar */}
      <Sidebar
        user={user}
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
      />

      {/* Full-width content */}
      <div className="flex flex-col min-h-screen">
        <TopBar
          user={user}
          onToggleLibrary={() => setLibraryOpen(prev => !prev)}
          libraryOpen={libraryOpen}
        />
        <main className="flex-1 px-5 lg:px-10 py-6 lg:py-8 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
