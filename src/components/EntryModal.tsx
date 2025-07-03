'use client';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
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

  // ESC and focus
  useEffect(() => {
    setTimeout(() => {
      const firstInput = modalRef.current?.querySelector('input');
      (firstInput as HTMLElement)?.focus();
    }, 100);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Close when clicking outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (currentMode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: `${firstName} ${lastName}`,
          });
          await setDoc(doc(db, 'users', cred.user.uid), {
            firstName,
            lastName,
            email,
            createdAt: new Date(),
          });
        }
      } else if (currentMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Incorrect email or password.");
      } else {
        setError(err.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.17)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        transition: 'background 0.15s',
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: '#fff',
          borderRadius: 18,
          maxWidth: 380,
          width: '94%',
          padding: '2.1rem 1.7rem 1.3rem 1.7rem',
          boxShadow: '0 10px 36px 0 rgba(16,16,16,0.17)',
          position: 'relative',
          animation: 'modalIn .17s cubic-bezier(.2,1.6,.55,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: '#888',
            cursor: 'pointer',
            fontWeight: 400,
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseOver={e => ((e.target as HTMLButtonElement).style.color = '#222')}
          onMouseOut={e => ((e.target as HTMLButtonElement).style.color = '#888')}
        >
          ×
        </button>
        <h2
          style={{
            fontSize: '1.44rem',
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 22,
            marginTop: 2,
            letterSpacing: '0.01em',
          }}
        >
          {currentMode === 'signup' ? 'Create your account' : 'Login to CalmPulse'}
        </h2>
        <form
          onSubmit={handleAuth}
          lang="en"
          style={{ display: 'flex', flexDirection: 'column', gap: 13 }}
        >
          {currentMode === 'signup' && (
            <div style={{ display: 'flex', gap: 9, minWidth: 0 }}>
              <input
                type="text"
                placeholder="First name"
                style={inputStyle}
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                autoFocus
              />
              <input
                type="text"
                placeholder="Last name"
                style={inputStyle}
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
              />
            </div>
          )}
          <input
            type="email"
            placeholder="Email"
            style={inputStyle}
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus={currentMode !== 'signup'}
            inputMode="email"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && (
            <div style={{ color: '#dc2626', fontSize: '0.95rem', textAlign: 'center', marginTop: 2 }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 2,
              width: '100%',
              background: '#111',
              color: '#fff',
              border: 'none',
              borderRadius: 900,
              padding: '0.68rem 0',
              fontFamily: 'inherit',
              fontWeight: 600,
              fontSize: '1.07rem',
              cursor: 'pointer',
              boxShadow: loading ? '0 0 0 1px #bbb' : undefined,
              opacity: loading ? 0.8 : 1,
              transition: 'background 0.2s, opacity 0.2s',
            }}
          >
            {loading
              ? 'Loading...'
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
            margin: '0.85rem auto 0 auto',
            color: '#1e60d4',
            background: 'none',
            border: 'none',
            fontSize: '1rem',
            textDecoration: 'underline',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {currentMode === 'signup'
            ? 'Already have an account? Login'
            : "No account? Subscribe"}
        </button>
      </div>
      {/* Pop-in animation */}
      <style>{`
        @keyframes modalIn {
          0% { transform: translateY(30px) scale(.98); opacity: 0.6; }
          100% { transform: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: '1.5px solid #eee',
  borderRadius: 9,
  fontSize: '1.01rem',
  fontFamily: 'inherit',
  padding: '0.68rem 0.97rem',
  background: '#fcfcfc',
  outline: 'none',
  fontWeight: 500,
  boxSizing: 'border-box',
};
