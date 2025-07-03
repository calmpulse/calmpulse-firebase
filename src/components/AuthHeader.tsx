'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function AuthHeader({ onShowModal }: { onShowModal: (mode: 'signup' | 'login') => void }) {
  const [user, setUser] = useState<any>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async user => {
      setUser(user);
      if (user) {
        // Fetch lastName from Firestore if logged in
        const docRef = doc(db, 'users', user.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setLastName(snap.data().lastName || null);
        else setLastName(null);
      } else {
        setLastName(null); // Reset lastName when logged out!
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    // Optionally clear any state if needed, but useEffect will handle it
  };

  // Only show avatar if logged in and lastName exists
  const initial = lastName ? lastName[0].toUpperCase() : '';

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
      {(!user || !lastName) ? (
        <>
          <button
            onClick={() => onShowModal('signup')}
            style={{
              background: 'none',
              border: 'none',
              color: '#111',
              fontSize: '1.02rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              letterSpacing: 0.1,
            }}
          >
            Subscribe
          </button>
          <button
            onClick={() => onShowModal('login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#111',
              fontSize: '1.02rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              letterSpacing: 0.1,
            }}
          >
            Login
          </button>
        </>
      ) : (
        <>
          <div
            title={lastName || ''}
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
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: '#111',
              fontSize: '1.02rem',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              letterSpacing: 0.1,
              marginLeft: 2,
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
