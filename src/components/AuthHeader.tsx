'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthHeader({
  onShowModal,
}: {
  onShowModal: (mode: 'signup' | 'login') => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [initial, setInitial] = useState<string | null>(null);

  /* ───────── listen for auth state ───────── */
  useEffect(() => {
    return onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);

      if (!currentUser) {
        setInitial(null);
        return;
      }

      /* 1️⃣  show instant initial (displayName → last name → email) */
      const instantLetter =
        currentUser.displayName?.split(' ').pop()?.[0] ??
        currentUser.email?.[0] ??
        '';
      setInitial(instantLetter.toUpperCase());

      /* 2️⃣  fetch Firestore profile in the background */
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        const ln = (snap.data()?.lastName as string | undefined)?.[0];
        if (ln) setInitial(ln.toUpperCase());
      } catch {
        /* network issues are ignored – we already have an initial */
      }
    });
  }, []);

  /* ───────── logout ───────── */
  const handleLogout = () => {
    void signOut(auth);
  };

  /* ───────── UI ───────── */
  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontFamily: 'Poppins, sans-serif',
        zIndex: 200,
      }}
    >
      {!user ? (
        <>
          <button onClick={() => onShowModal('signup')} style={linkStyle}>
            Subscribe
          </button>
          <button onClick={() => onShowModal('login')} style={{ ...linkStyle, marginLeft: 18 }}>
            Login
          </button>
        </>
      ) : (
        <>
          <div
            title={initial ?? ''}
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
            }}
          >
            {initial}
          </div>
          <button onClick={handleLogout} style={{ ...linkStyle, marginLeft: 2 }}>
            Logout
          </button>
        </>
      )}
    </div>
  );
}

/* shared button style */
const linkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#111',
  fontSize: '1.02rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: 0,
  letterSpacing: 0.1,
};
