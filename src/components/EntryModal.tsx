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
        void setDoc(doc(db, 'users', cred.user.uid), {
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
  return (
    <div
      onClick={closeOnBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,.17)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
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
          boxShadow: '0 10px 34px rgba(0,0,0,.17)',
          position: 'relative',
          animation: 'modalIn .18s cubic-bezier(.2,1.6,.55,1)',
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
            fontSize: 22,
            color: '#888',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        <h2 style={{ fontWeight: 700, fontSize: '1.45rem', textAlign: 'center', marginBottom: 22 }}>
          {currentMode === 'signup' ? 'Create your account' : 'Login to CalmPulse'}
        </h2>

        {/* ─── form ─── */}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {currentMode === 'signup' && (
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
              border: 0,
              borderRadius: 9999,
              padding: '.68rem 0',
              fontWeight: 600,
              fontSize: '1.06rem',
              background: loading ? '#555' : '#111',
              color: '#fff',
              cursor: loading ? 'default' : 'pointer',
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
            color: '#1e60d4',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {currentMode === 'signup'
            ? 'Already have an account? Login'
            : 'No account? Subscribe'}
        </button>
      </div>

      {/* pop-in animation */}
      <style>{`
        @keyframes modalIn {
          0% { transform: translateY(28px) scale(.97); opacity: .58 }
          100% { transform: none; opacity: 1 }
        }
      `}</style>
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
};
