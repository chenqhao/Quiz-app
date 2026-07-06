'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFullName(user.user_metadata?.full_name || '');
        setDisplayName(user.user_metadata?.display_name || '');
        setAvatarUrl(user.user_metadata?.avatar_url || '');

        // Load friend code from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('friend_code')
          .eq('id', user.id)
          .single();
        setFriendCode(profile?.friend_code || '');
      }
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      showMessage('Please select an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('Image must be under 2MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      // Store directly as {userId}.{ext} in the avatars bucket (no subfolder)
      const filePath = `${user.id}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('Avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting
      const { data: { publicUrl } } = supabase.storage
        .from('Avatars')
        .getPublicUrl(filePath);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: urlWithCacheBust },
      });

      if (updateError) throw updateError;

      setAvatarUrl(urlWithCacheBust);
      showMessage('Profile picture updated!');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showMessage(`Failed to upload picture: ${err.message || 'Make sure the "avatars" storage bucket exists and is public.'}`, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: '' },
      });
      if (error) throw error;
      setAvatarUrl('');
      showMessage('Profile picture removed.');
    } catch (err) {
      console.error('Remove avatar error:', err);
      showMessage('Failed to remove picture.', 'error');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          display_name: displayName.trim(),
        },
      });

      if (error) throw error;
      showMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Save profile error:', err);
      showMessage('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
        <div className="h-48 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  const initials = fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Manage your profile and account preferences.
        </p>
      </div>

      {/* Toast Message */}
      {message && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium animate-scale-in flex items-center gap-2"
          style={{
            background: message.type === 'error'
              ? 'color-mix(in srgb, var(--danger) 12%, transparent)'
              : 'color-mix(in srgb, var(--success) 12%, transparent)',
            color: message.type === 'error' ? 'var(--danger)' : 'var(--success)',
            border: `1px solid ${message.type === 'error' ? 'var(--danger)' : 'var(--success)'}`,
          }}
        >
          <span>{message.type === 'error' ? '⚠️' : '✓'}</span>
          {message.text}
        </div>
      )}

      {/* Profile Picture Section */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Profile Picture
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>
          Upload a photo to personalize your account. Max 2MB.
        </p>

        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative group">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden border-2 transition-all duration-300"
              style={{
                borderColor: 'var(--border)',
                background: avatarUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold" style={{ color: 'var(--primary-foreground)' }}>
                  {initials}
                </span>
              )}
            </div>
            {/* Upload overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              style={{
                background: 'rgba(0,0,0,0.5)',
              }}
              disabled={uploadingAvatar}
            >
              {uploadingAvatar ? (
                <div
                  className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'white', borderTopColor: 'transparent' }}
                />
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          {/* Upload Actions */}
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 cursor-pointer"
              style={{
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
            </button>
            {avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                className="block px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--muted)] cursor-pointer"
                style={{ color: 'var(--danger)' }}
              >
                Remove Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Profile Information
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>
          Update your personal details.
        </p>

        <div className="space-y-5">
          {/* Full Name */}
          <div>
            <label
              htmlFor="full-name"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Full Name
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none"
              style={{
                background: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-semibold mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Display Name
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
              This is how you&apos;ll appear across the app.
            </p>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Choose a display name"
              className="w-full px-4 py-2.5 rounded-xl border text-sm transition-all duration-200 outline-none"
              style={{
                background: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: 'var(--foreground)' }}
            >
              Email
            </label>
            <div
              className="w-full px-4 py-2.5 rounded-xl border text-sm flex items-center gap-2"
              style={{
                background: 'var(--muted)',
                borderColor: 'var(--border)',
                color: 'var(--muted-foreground)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="12" height="10" rx="2" />
                <path d="M2 5l6 4 6-4" />
              </svg>
              {user?.email}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              id="save-profile"
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 disabled:opacity-50 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                color: 'var(--primary-foreground)',
              }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: 'currentColor', borderTopColor: 'transparent' }}
                  />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Friend Code Section */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Your Friend Code
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
          Share this unique code so others can add you as a friend.
        </p>
        <div className="flex items-center gap-3">
          <div
            className="px-6 py-3 rounded-xl text-xl font-mono font-bold tracking-widest"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), color-mix(in srgb, var(--secondary) 10%, transparent))',
              color: 'var(--primary)',
              border: '2px dashed var(--primary)',
            }}
          >
            {friendCode || 'Loading...'}
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(friendCode);
              setCodeCopied(true);
              setTimeout(() => setCodeCopied(false), 2000);
            }}
            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${codeCopied ? 'copy-flash' : ''}`}
            style={{
              background: codeCopied ? 'var(--success)' : 'var(--primary)',
              color: codeCopied ? 'var(--success-foreground)' : 'var(--primary-foreground)',
            }}
            disabled={!friendCode}
          >
            {codeCopied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Theme Preferences Section */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Preferences
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>
          Customize the interface theme style.
        </p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Theme Mode</p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Switch between light and dark modes.</p>
          </div>
          <button
            onClick={() => {
              document.documentElement.classList.toggle('dark');
              const isDark = document.documentElement.classList.contains('dark');
              localStorage.setItem('theme', isDark ? 'dark' : 'light');
              // Trigger state refresh for rendering component if needed
              setMessage({ text: `Theme changed to ${isDark ? 'Dark' : 'Light'} Mode`, type: 'success' });
              setTimeout(() => setMessage(null), 2000);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--muted)] flex items-center gap-2 cursor-pointer border"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--card)',
              color: 'var(--foreground)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            Toggle Theme
          </button>
        </div>
      </div>

      {/* Account Section */}
      <div
        className="rounded-2xl border p-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--foreground)' }}>
          Account
        </h2>
        <p className="text-xs mb-5" style={{ color: 'var(--muted-foreground)' }}>
          Manage your account settings.
        </p>

        <button
          id="sign-out"
          onClick={handleLogout}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 flex items-center gap-2 cursor-pointer"
          style={{
            background: 'color-mix(in srgb, var(--danger) 12%, transparent)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3m0 0l-3-3m3 3H6" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
