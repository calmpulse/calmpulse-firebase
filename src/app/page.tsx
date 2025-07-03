'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';

const TOTAL_TIME = 15 * 60; // 15 minutes

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Pour la modale
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('signup');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return () => unsubscribe();
  }, []);

  const logSessionCompleted = useCallback(async (uid: string | null) => {
    if (!uid) return;
    await addDoc(collection(db, 'sessions'), {
      userId: uid,
      endedAt: serverTimestamp(),
      status: 'completed',
      duration: elapsed,
    });
  }, [elapsed]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= TOTAL_TIME) {
            clearInterval(timerRef.current!);
            audioRef.current?.pause();
            logSessionCompleted(userId);
            return TOTAL_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, userId, logSessionCompleted]);

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

  return (
    <>
      {/* Header minimal en haut à droite */}
      <AuthHeader onShowModal={(mode) => {
        setModalMode(mode);
        setShowEntryModal(true);
      }} />

      {/* Modale authentification */}
      {isClient && showEntryModal && (
        <EntryModal
          mode={modalMode}
          onClose={() => setShowEntryModal(false)}
        />
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
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem', textAlign: 'center' }}>
          Breathe. Relax. Focus. Take 15 minutes just for yourself.
        </p>

        {/* 🟡 Breathing Ring */}
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '6rem' }}>
          <button onClick={playAudio} disabled={isPlaying} style={buttonStyle(true)}>
            Start
          </button>
          <button onClick={pauseAudio} disabled={!isPlaying} style={buttonStyle(false)}>
            Pause
          </button>
        </div>
        <audio ref={audioRef} src="/audio/Meditation_07_06.mp3" preload="auto" />
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

function buttonStyle(primary: boolean) {
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

