'use client';

import Image from 'next/image';
import Head from 'next/head';
import { useRef, useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';

export const dynamic = 'force-static'; // rendu statique

const TOTAL_TIME = 15 * 60; // 15 min

export default function Home() {
  /* ---------- state ---------- */
  const audioRef   = useRef<HTMLAudioElement>(null);
  const timerRef   = useRef<NodeJS.Timeout | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed,   setElapsed]   = useState(0);
  const [userId,    setUserId]    = useState<string | null>(null);

  /* ---------- modal ---------- */
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [modalMode,      setModalMode]      = useState<'signup' | 'login'>('signup');
  const [isClient,       setIsClient]       = useState(false);
  useEffect(() => setIsClient(true), []);

  /* ---------- auth listener ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUserId(u ? u.uid : null));
    return unsub;
  }, []);

  /* ---------- log completed ---------- */
  const logCompleted = useCallback(async (uid: string | null) => {
    if (!uid) return;
    await addDoc(collection(db, 'sessions'), {
      userId: uid,
      endedAt: serverTimestamp(),
      status: 'completed',
      duration: elapsed,
    });
  }, [elapsed]);

  /* ---------- timer ---------- */
  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev >= TOTAL_TIME) {
          clearInterval(timerRef.current!);
          audioRef.current?.pause();
          logCompleted(userId);
          return TOTAL_TIME;
        }
        return prev + 1;
      });
    }, 1000);
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [isPlaying, userId, logCompleted]);

  /* ---------- controls ---------- */
  const playAudio = async () => {
    if (!audioRef.current) return;
    if (elapsed === TOTAL_TIME || elapsed === 0) {
      audioRef.current.currentTime = 0;
      setElapsed(0);
    }
    await audioRef.current.play();
    setIsPlaying(true);
    if (userId) {
      await addDoc(collection(db, 'sessions'), {
        userId,
        startedAt: serverTimestamp(),
        status: 'started',
      });
    }
  };
  const pauseAudio = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const progress = 314 - (314 * elapsed) / TOTAL_TIME;

  /* ---------- JSX ---------- */
  return (
    <>
      <Head>
        <link rel="canonical" href="https://www.calmpulsedaily.com/" />
      </Head>

      <AuthHeader onShowModal={m => { setModalMode(m); setShowEntryModal(true); }} />

      {isClient && showEntryModal && (
        <EntryModal mode={modalMode} onClose={() => setShowEntryModal(false)} />
      )}

      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9f9f9',
          padding: '2rem 1rem',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Image src="/logo.svg" alt="CalmPulse Logo" width={80} height={80} />
        <h1 style={{ marginTop: '0.5rem', fontSize: '2.2rem' }}>CalmPulse</h1>

        {/* tagline courte */}
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', textAlign: 'center' }}>
          Breathe. Relax. Focus. Take 15 minutes just for yourself.
        </p>

        {/* breathing ring */}
        <div style={{ marginBottom: '2rem' }}>
          <svg width="120" height="120">
            <circle r="50" cx="60" cy="60" stroke="#eee" strokeWidth="10" fill="none" />
            <circle
              r="50"
              cx="60"
              cy="60"
              stroke="#FFD700"
              strokeWidth="10"
              fill="none"
              strokeDasharray="314"
              strokeDashoffset={progress}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </div>

        {/* controls */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
          <button onClick={playAudio}  disabled={isPlaying} style={buttonStyle(true)}>Start</button>
          <button onClick={pauseAudio} disabled={!isPlaying} style={buttonStyle(false)}>Pause</button>
        </div>

        {/* paragraphe SEO déplacé en bas */}
        <section style={{ maxWidth: 640, textAlign: 'center', margin: '0 0 2.2rem' }}>
          <p style={{ fontSize: '1rem', lineHeight: 1.55 }}>
            CalmPulse propose une séance audio guidée de pleine conscience de 15&nbsp;minutes
            que vous pouvez lancer d’un simple clic. Respirez, relâchez la tension et
            recentrez-vous&nbsp;: au bureau, à la maison ou avant de dormir.
            Créez un compte gratuit pour suivre vos séries et progresser dans la durée.
          </p>
        </section>

        <audio ref={audioRef} src="/audio/Meditation_07_06.mp3" preload="auto" />

        {/* buy me a coffee */}
        <div style={{ marginBottom: '0.5rem' }}>
          <a
            href="https://www.buymeacoffee.com/calmpulse"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FFDD00',
              color: '#000',
              fontWeight: 600,
              padding: '0.5rem 1.25rem',
              borderRadius: '15px',
              textDecoration: 'none',
              fontSize: '0.85rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              gap: '0.5rem',
            }}
          >
            <Image
              src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
              alt="Buy me a coffee"
              width={18}
              height={18}
            />
            Buy me a coffee
          </a>
        </div>

        <footer style={{ fontSize: '0.9rem', color: '#666' }}>
          CalmPulse © {new Date().getFullYear()}
        </footer>
      </main>
    </>
  );
}

function buttonStyle(primary: boolean): React.CSSProperties {
  return {
    backgroundColor: primary ? '#000' : '#fff',
    color: primary ? '#fff' : '#000',
    border: '2px solid #000',
    padding: '0.5rem 1.25rem',
    borderRadius: '999px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
  };
}

