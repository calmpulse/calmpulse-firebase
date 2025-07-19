'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactElement,
} from 'react';
import Image from 'next/image';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';
import { Database, Flame, ShieldCheck, TimerReset } from 'lucide-react';

const TOTAL_TIME = 15 * 60; // 15-minute session

/* ---------- types ---------- */
type Card = {
  title: string;
  desc: string;
  icon: ReactElement;
};

export default function Home() {
  /* ---------- state & refs ---------- */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // browser-safe timer type
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  /* ---------- auth ---------- */
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => onAuthStateChanged(auth, u => setUserId(u?.uid ?? null)), []);

  /* ---------- entry modal ---------- */
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('signup');

  /* ---------- Firestore log ---------- */
  const logDone = useCallback(
    async (uid: string | null) => {
      if (!uid) return;
      await addDoc(collection(db, 'sessions'), {
        userId: uid,
        endedAt: serverTimestamp(),
        status: 'completed',
        duration: elapsed,
      });
    },
    [elapsed],
  );

  /* ---------- timer loop ---------- */
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setElapsed(p => {
        if (p >= TOTAL_TIME) {
          if (timerRef.current !== null) clearInterval(timerRef.current);
          audioRef.current?.pause();
          logDone(userId);
          return TOTAL_TIME;
        }
        return p + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isPlaying, userId, logDone]);

  /* ---------- controls ---------- */
  const play = async () => {
    if (!audioRef.current) return;

    if (elapsed === TOTAL_TIME || elapsed === 0) {
      audioRef.current.currentTime = 0;
      setElapsed(0);
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);

      userId &&
        addDoc(collection(db, 'sessions'), {
          userId,
          startedAt: serverTimestamp(),
          status: 'started',
        });
    } catch (e) {
      // autoplay blocked etc.
      console.error(e);
      setIsPlaying(false);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const dash = 314 - (314 * elapsed) / TOTAL_TIME; // circle progress

  /* ---------- feature cards ---------- */
  const cards: Card[] = [
    {
      title: '15 Minutes to Reset',
      desc: 'Reconnect to the present — at work, at home, wherever you are. Just hit start, breathe, and feel the shift.',
      icon: <TimerReset size={48} stroke="#FB7185" fill="none" />,
    },
    {
      title: 'Clinically Proven Calm',
      desc: '8 weeks of meditation can reduce anxiety by 30 % and double your sleep quality. It’s not magic — it’s science.',
      icon: <Database size={48} stroke="#8B5CF6" fill="none" />,
    },
    {
      title: 'Daily Streak',
      desc: 'Meditate daily, grow your streak, and unlock surprise boosts along the way. Build consistency — and see what happens.',
      icon: <Flame size={48} stroke="#FB923C" fill="#FFECDD" style={{ marginTop: 0 }} />,
    },
    {
      title: 'Powered by People',
      desc: 'CalmPulse is free and independent. A small coffee keeps us going — and keeps the experience distraction-free.',
      icon: <ShieldCheck size={48} stroke="#2E7D32" fill="#C8E6C9" />,
    },
  ];

  /* ---------- UI ---------- */
  return (
    <>
      <AuthHeader onShowModal={m => { setModalMode(m); setShowModal(true); }} />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <Image src="/logo.svg" alt="CalmPulse logo" width={80} height={80} priority />
        <h1>CalmPulse</h1>
        <p className="tagline">Breathe. Relax. Focus. Take 15 minutes just for yourself.</p>

        <div className="ring">
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
              strokeDashoffset={dash}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
        </div>

        <div className="controls">
          <button className="btn primary" onClick={play} disabled={isPlaying}>
            Start
          </button>
          <button className="btn" onClick={pause} disabled={!isPlaying}>
            Pause
          </button>
        </div>

        <span className="arrow-bounce">↓</span>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section className="features">
        <h2 className="features-title">What Makes CalmPulse Different?</h2>
        <div className="grid">
          {cards.map(({ title, desc, icon }) => (
            <article key={title} className="card">
              <div className="thumb">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>

        <a
          className="coffee"
          href="https://www.buymeacoffee.com/calmpulse"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
            alt=""
            width={18}
            height={18}
          />
          Buy me a coffee
        </a>

        <footer>CalmPulse © {new Date().getFullYear()}</footer>
      </section>

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .btn {
          background: #fff;
          color: #000;
          border: 2px solid #000;
          border-radius: 999px;
          padding: 0.55rem 1.4rem;
          font: 500 1rem Poppins;
          cursor: pointer;
        }
        .btn.primary {
          background: #000;
          color: #fff;
        }
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8rem 1rem 4rem;
          font-family: Poppins;
          background: #f9f9f9;
          text-align: center;
        }
        h1 {
          font-size: 2.4rem;
          margin: 1rem 0 0.45rem;
        }
        .tagline {
          font-size: 1.12rem;
          margin-bottom: 2rem;
        }
        .ring {
          margin-bottom: 2.2rem;
        }
        .controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 4.7rem;
        }
        .arrow-bounce {
          font-size: 2rem;
          animation: bounce 2s infinite;
          margin-bottom: 4rem;
        }
        @keyframes bounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(8px);
          }
        }
        .features {
          font-family: Poppins;
          background: #f9f9f9;
          text-align: center;
          padding: 0 1rem 5rem;
        }
        .features-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin-bottom: 4rem;
        }
        .grid {
          max-width: 1150px;
          margin: 0 auto;
          display: grid;
          gap: 2.4rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          position: relative;
        }
        .card {
          padding: 0 1rem;
          position: relative;
          transition: all 0.3s ease;
        }
        .card:hover .thumb {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }
        .card:hover svg {
          stroke: #ffd700;
        }
        .thumb {
          width: 100%;
          height: 130px;
          background: #e9f0ff;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          margin-bottom: 1.1rem;
          transition: all 0.3s ease;
        }
        h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin: 0.7rem 0 0.5rem;
        }
        p {
          font-size: 0.99rem;
          line-height: 1.45;
          color: #555;
          margin: 0;
        }
        .coffee {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #ffdd00;
          color: #000;
          font: 600 0.95rem Poppins;
          padding: 0.6rem 1.55rem;
          border-radius: 15px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          margin-top: 4rem;
        }
        footer {
          margin-top: 3rem;
          font-size: 0.9rem;
          color: #666;
        }
      `}</style>

      {/* audio */}
      <audio ref={audioRef} src="/audio/Meditation_07_06.mp3" preload="auto" />
    </>
  );
}


