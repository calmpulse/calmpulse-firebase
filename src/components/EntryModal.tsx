'use client';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function EntryModal({
  mode = 'signup',
  onClose,
}: {
  mode?: 'signup' | 'login';
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<'signup' | 'login'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* ────────────────────────── UX helpers ────────────────────────── */
  useEffect(() => {
    setTimeout(() => {
      (modalRef.current?.querySelector('input') as HTMLElement | null)?.focus();
    }, 90);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  /* ────────────────────────── Auth handler ───────────────────────── */
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (currentMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        /* ✅ immediately close modal & stop spinner */
        onClose();
        setLoading(false);

        /* 🔄 run profile + Firestore write in background */
        void updateProfile(cred.user, {
          displayName: `${firstName} ${lastName}`,
        });
        const safeNickname = nickname.trim().slice(0, 60);
        void setDoc(doc(db, 'users', cred.user.uid), {
          nickname: safeNickname || null,
          firstName,
          lastName,
          email,
          createdAt: new Date(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
        setLoading(false);
      }
    } catch (err) {
      // type-guard for FirebaseError without using `any`
      const code = (err as { code?: string }).code;
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Incorrect email or password.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unexpected error');
      }
      setLoading(false);
    }
  };

  /* ────────────────────────── JSX ────────────────────────── */
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  return (
    <div
      onClick={closeOnBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: isVisible ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        transition: 'background .4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
      }}
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 18,
          width: '94%',
          maxWidth: 380,
          padding: '2rem 1.7rem 1.3rem',
          boxShadow: isVisible ? '0 20px 60px rgba(0,0,0,.15)' : '0 10px 34px rgba(0,0,0,.1)',
          position: 'relative',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* × close */}
        <button
          aria-label="Close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 0,
            fontSize: 24,
            color: '#888',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.color = '#111';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#888';
          }}
        >
          ×
        </button>

        <h2 style={{ fontWeight: 700, fontSize: '1.45rem', textAlign: 'center', marginBottom: 22, color: '#111' }}>
          {currentMode === 'signup' ? 'Create your account' : 'Login to CalmPulse'}
        </h2>

        {/* ─── form ─── */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {currentMode === 'signup' && (
            <>
              <input
                placeholder="Nickname (public in Community Hub)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 9, minWidth: 0 }}>
                <input
                  required
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  style={inputStyle}
                />
                <input
                  required
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <input
            type="email"
            required
            autoComplete="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            required
            autoComplete={currentMode === 'signup' ? 'new-password' : 'current-password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />

          {error && (
            <div style={{ color: '#dc2626', fontSize: '.95rem', textAlign: 'center' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 2,
              width: '100%',
              border: 'none',
              borderRadius: 8,
              padding: '.7rem 0',
              fontWeight: 500,
              fontSize: '1rem',
              background: loading ? '#d1d5db' : '#111',
              color: '#fff',
              cursor: loading ? 'default' : 'pointer',
              transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#333';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#111';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
            onMouseDown={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onMouseUp={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {loading
              ? 'Loading…'
              : currentMode === 'signup'
                ? 'Subscribe'
                : 'Login'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setCurrentMode(currentMode === 'signup' ? 'login' : 'signup')}
          style={{
            display: 'block',
            margin: '.85rem auto 0',
            background: 'none',
            border: 0,
            color: '#667eea',
            textDecoration: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'color .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#764ba2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#667eea';
          }}
        >
          {currentMode === 'signup'
            ? 'Already have an account? Login'
            : 'No account? Subscribe'}
        </button>
      </div>

    </div>
  );
}

/* common input style */
const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: '1.5px solid #eee',
  borderRadius: 9,
  padding: '.68rem .97rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  background: '#fcfcfc',
  transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};

      {/* Input focus styles */}
      <style>{`
        input:focus {
          outline: none;
          border-color: #111 !important;
          background: #fff !important;
          box-shadow: 0 0 0 3px rgba(0,0,0,.05) !important;
        }
      `}</style>
