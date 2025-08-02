'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';

export default function AuthHeader({
  onShowModal,
}: {
  onShowModal: (mode: 'signup' | 'login') => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [initial, setInitial] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  /* listen auth */
  useEffect(
    () =>
      onAuthStateChanged(auth, async (cu) => {
        setUser(cu);
        setShowLogout(false);
        if (!cu) {
          setInitial(null);
          return;
        }
        const letter =
          cu.displayName?.split(' ').pop()?.[0] ?? cu.email?.[0] ?? '';
        setInitial(letter.toUpperCase());
        try {
          const snap = await getDoc(doc(db, 'users', cu.uid));
          const ln = (snap.data()?.lastName as string | undefined)?.[0];
          if (ln) setInitial(ln.toUpperCase());
        } catch {}
      }),
    []
  );

  /* click-outside to close logout dropdown */
  useEffect(() => {
    const handle = (e: MouseEvent) =>
      showLogout &&
      avatarRef.current &&
      !avatarRef.current.contains(e.target as Node) &&
      setShowLogout(false);
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showLogout]);

  const handleLogout = () => void signOut(auth);

  return (
    <header
      style={{
        position: 'absolute',
        top: 24,
        left: 32,
        right: 32,
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'Poppins, sans-serif',
        zIndex: 200,
      }}
    >
      {/* bloc gauche */}
      <nav style={{ display: 'flex', gap: 32 }}>
        <Link href="/" style={linkStyle}>
          Home
        </Link>
        <Link
          href="/progress"
          style={linkStyle}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              onShowModal('login');
            }
          }}
        >
          Progress
        </Link>
      </nav>

      {/* bloc droit */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        {!user ? (
          <button
            onClick={() => onShowModal('login')}
            style={{ ...linkStyle, fontWeight: 700 }} // même style, juste bold
          >
            Log&nbsp;In
          </button>
        ) : (
          <div
            ref={avatarRef}
            title="Account"
            onClick={() => setShowLogout((p) => !p)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#111',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '1.12rem',
              userSelect: 'none',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            {initial}
            {showLogout && (
              <button
                onClick={handleLogout}
                style={{
                  position: 'absolute',
                  top: 42,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: '.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 8px rgba(0,0,0,.08)',
                }}
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* shared link/button style */
const linkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#111',
  fontSize: '1.02rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: 0,
  letterSpacing: 0.1,
  textDecoration: 'none',
};


