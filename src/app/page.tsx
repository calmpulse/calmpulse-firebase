'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactElement,
} from 'react';
import Image from 'next/image';
import { auth, db, firebaseProjectId } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';
import WelcomeModal from '@/components/WelcomeModal';
import { Database, Flame, ShieldCheck, TimerReset } from 'lucide-react';
import { toLocalDay } from '@/lib/streak';
import { findMeditationURL } from '@/lib/findMeditation';
import { formatFirestoreErrorForUi, isFirestoreApiDisabledError } from '@/lib/firestoreError';

const TOTAL_TIME = 60 * 15;
const siteUrl = 'https://www.calmpulsedaily.com';

/* ---------- helper : id unique jour+user ---------- */
const dailyDocId = (uid: string, d = new Date()) => `${uid}_${toLocalDay(d)}`;
const monthKeyFromDay = (day: string) => day.slice(0, 7); // YYYY-MM

/* ---------- types ---------- */
type Card = { title: string; desc: string; icon: ReactElement };

export default function Home() {
  /* ---------- refs & state ---------- */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  /* --- audio dynamique --- */
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState(false);

  /** auth */
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid ?? null);
      setAuthChecked(true); // Mark auth as checked after first callback
    });
    return unsub;
  }, []);

  /* ---- charge la méditation du jour (avec fallback) ----*/
  useEffect(() => {
    (async () => {
      try {
        const url = await findMeditationURL(); // calendrier global (Lun=001..Dim=007)
        if (url) setAudioURL(url);
        else setLoadErr(true);
      } catch {
        setLoadErr(true);
      }
    })();
  }, []);

  /* ---- injecte l'URL dans l'élément audio ---- */
  useEffect(() => {
    if (!audioRef.current || !audioURL) return;
    audioRef.current.src = audioURL;
    audioRef.current.load();
    // console.log('[Audio] src set:', audioURL);
  }, [audioURL]);

  /* ---- écouter les erreurs UNIQUEMENT après que l'URL existe ---- */
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !audioURL) return;

    const onErr = () => {
      // console.error('[Audio] element error after URL set:', el.error);
      setLoadErr(true);
    };
    const onLoaded = () => {
      // console.log('[Audio] loadedmetadata:', el.duration);
    };
    const onCanPlay = () => {
      // console.log('[Audio] canplay');
    };

    el.addEventListener('error', onErr);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('canplay', onCanPlay);

    return () => {
      el.removeEventListener('error', onErr);
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('canplay', onCanPlay);
    };
  }, [audioURL]);

  /** modal */
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('signup');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [firestoreApiDisabled, setFirestoreApiDisabled] = useState(false);

  /* -------- show welcome modal for non-logged-in users -------- */
  useEffect(() => {
    // Only show modal after auth state has been checked
    if (!authChecked) {
      setShowWelcomeModal(false);
      return;
    }

    // Show welcome modal only if user is not logged in
    if (!userId) {
      // Small delay to ensure smooth page load
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    } else {
      // Hide welcome modal if user is logged in
      setShowWelcomeModal(false);
    }
  }, [userId, authChecked]);

  /* ---------- Firestore log (fin de session) ---------- */
  const logDone = useCallback(
    async (uid: string | null, duration: number) => {
      if (!uid) return;
      const day = toLocalDay(new Date()); // Use same timezone logic as reading
      const month = monthKeyFromDay(day);

      try {
        await setDoc(
          doc(db, 'sessions', dailyDocId(uid)),
          {
            userId: uid,
            endedAt: serverTimestamp(),
            status: 'completed',
            duration,
            day, // Explicitly save the day for consistent reading
          },
          { merge: true },
        );

        // Prefer a private "nickname" from the user's profile for public Community Hub display
        let hubName = '';
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          const maybe = snap.exists() ? (snap.data() as { nickname?: string | null }).nickname : null;
          hubName = (maybe ?? '').toString().trim().slice(0, 60);
        } catch {
          // ignore, fallback below
        }
        const safeHubName = hubName || 'Anonymous';

        // Public completion entry for Community Hub (one per user per day)
        await setDoc(
          doc(db, 'communityCompletions', dailyDocId(uid)),
          {
            userId: uid,
            name: safeHubName,
            endedAt: serverTimestamp(),
            duration,
            day,
            month,
          },
          { merge: true },
        );
      } catch (e) {
        console.error('Firestore logDone failed:', e);
        setFirestoreError(formatFirestoreErrorForUi(e));
        setFirestoreApiDisabled(isFirestoreApiDisabledError(e));
      }

      // Invalidate cache so progress page updates immediately
      const cacheKey = `days_${uid}`;
      sessionStorage.removeItem(cacheKey);
    },
    [],
  );

  /* ---------- timer loop ---------- */
  useEffect(() => {
    if (!isPlaying) return;

    timerRef.current = setInterval(() => {
      setElapsed((p) => {
        if (p >= TOTAL_TIME) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          audioRef.current?.pause();
          logDone(userId, TOTAL_TIME);
          return TOTAL_TIME;
        }
        return p + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [isPlaying, userId, logDone]);

  /* ---------- controls ---------- */
  const play = async () => {
    if (!audioURL || !audioRef.current) return;
    if (elapsed === TOTAL_TIME || elapsed === 0) {
      audioRef.current.currentTime = 0;
      setElapsed(0);
    }
    setIsPlaying(true);
    audioRef.current.play().catch(() => {
      // play() peut être rejeté si interaction manquante ; l'utilisateur peut recliquer
      setIsPlaying(false);
    });

    if (userId) {
      setDoc(
        doc(db, 'sessions', dailyDocId(userId)),
        { userId, startedAt: serverTimestamp(), status: 'started' },
        { merge: true },
      ).catch((e) => {
        console.error('Firestore start session failed:', e);
        setFirestoreError(formatFirestoreErrorForUi(e));
        setFirestoreApiDisabled(isFirestoreApiDisabledError(e));
      });
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const dash = 314 - (314 * elapsed) / TOTAL_TIME;

  /* ---------- feature cards ---------- */
  const cards: Card[] = [
    {
      title: '15 Minutes to Reset',
      desc: 'Reconnect to the present - at work, at home, wherever you are. Just hit start, breathe, and feel the shift.',
      icon: <TimerReset size={48} stroke="#FB7185" fill="none" />,
    },
    {
      title: 'Clinically Proven Calm',
      desc: '8 weeks of meditation can reduce anxiety by 30% and double your sleep quality. It\'s not magic - it\'s science.',
      icon: <Database size={48} stroke="#8B5CF6" fill="none" />,
    },
    {
      title: 'Daily Streak',
      desc: 'Meditate daily, grow your streak, and unlock surprise boosts along the way. Build consistency - and see what happens.',
      icon: <Flame size={48} stroke="#FB923C" fill="#FFECDD" style={{ marginTop: 0 }} />,
    },
    {
      title: 'Powered by People',
      desc: 'CalmPulse is free and independent. A small coffee keeps us going - and keeps the experience distraction-free.',
      icon: <ShieldCheck size={48} stroke="#2E7D32" fill="#C8E6C9" />,
    },
  ];

  /* ---------- UI ---------- */
  return (
    <>
      {/* Structured Data - SoftwareApplication */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'CalmPulseDaily',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'Web Browser',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            description: 'Free daily meditation app with 15-minute guided sessions for mindfulness, anxiety relief, and better sleep.',
            featureList: [
              'Daily 15-minute guided meditation',
              'Meditation streak tracking',
              'Progress monitoring',
              'Free meditation sessions',
              'Anxiety and stress relief',
            ],
          }),
        }}
      />
      
      <AuthHeader onShowModal={(m) => { setModalMode(m); setShowModal(true); }} />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}
      {showWelcomeModal && (
        <WelcomeModal
          onSubscribe={() => {
            setShowWelcomeModal(false);
            setModalMode('signup');
            setShowModal(true);
          }}
          onLogin={() => {
            setShowWelcomeModal(false);
            setModalMode('login');
            setShowModal(true);
          }}
          onContinue={() => {
            setShowWelcomeModal(false);
          }}
        />
      )}

      {firestoreError && (
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 16,
            maxWidth: 920,
            margin: '0 auto',
            zIndex: 300,
            borderRadius: 16,
            background: '#fff',
            border: firestoreApiDisabled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0,0,0,.10)',
            boxShadow: '0 18px 55px rgba(0,0,0,.18)',
            padding: '12px 14px',
            fontFamily: 'Poppins',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 850, color: '#111' }}>
                Firestore issue (project:{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{firebaseProjectId}</span>)
              </div>
              <div style={{ marginTop: 4, color: '#444', lineHeight: 1.35 }}>{firestoreError}</div>
              {firestoreApiDisabled && (
                <div style={{ marginTop: 8, fontSize: '.9rem', color: '#555' }}>
                  Enable it here:{' '}
                  <a
                    href={`https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=${firebaseProjectId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#667eea', fontWeight: 750, textDecoration: 'none' }}
                  >
                    Cloud Firestore API
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => setFirestoreError(null)}
              style={{
                flexShrink: 0,
                border: '1px solid rgba(0,0,0,.18)',
                background: 'transparent',
                borderRadius: 999,
                padding: '8px 12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ---------- HERO ---------- */}
      <section 
        className="hero"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8rem 1rem 4rem',
          fontFamily: 'Poppins',
          background: 'linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%)',
          textAlign: 'center',
          position: 'relative',
          width: '100%',
          margin: 0,
        }}
      >
        <div 
          className="hero-content"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div 
            className="logo-wrapper"
            style={{
              display: 'inline-block',
              width: '80px',
              height: '80px',
              margin: '0 auto',
            }}
          >
            <Image 
              src="/logo.svg" 
              alt="CalmPulseDaily - Free Meditation App Logo" 
              width={80} 
              height={80} 
              priority 
            />
          </div>
          <h1 style={{
            fontSize: '2.4rem',
            margin: '1rem 0 .45rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            width: '100%',
            textAlign: 'center',
          }}>CalmPulse</h1>
          <p 
            className="tagline"
            style={{
              fontSize: '1.12rem',
              marginBottom: '2rem',
              color: '#666',
              fontWeight: 300,
              letterSpacing: '0.01em',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Breathe. Relax. Focus. Take 15 minutes just for yourself.
          </p>

          <div 
            className="ring"
            style={{
              margin: '0 auto 2.2rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <svg width="120" height="120" aria-label="Meditation timer progress">
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

          <div 
            className="controls"
            style={{
              display: 'flex',
              gap: '1rem',
              margin: '0 auto 4.7rem',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
            }}
          >
            <button className="btn primary" onClick={play} disabled={isPlaying || !audioURL} aria-label="Start meditation session">
            Start
          </button>
            <button className="btn" onClick={pause} disabled={!isPlaying} aria-label="Pause meditation session">
            Pause
          </button>
        </div>

          <span className="arrow-bounce" aria-hidden="true">↓</span>
        </div>
      </section>

      {/* ---------- FEATURES ---------- */}
      <section 
        className="features"
        style={{
          fontFamily: 'Poppins',
          background: 'linear-gradient(180deg, #f9f9f9 0%, #fafafa 100%)',
          textAlign: 'center',
          padding: '0 1rem 5rem',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <h2 className="features-title">What Makes CalmPulseDaily Different?</h2>
        <div className="grid">
          {cards.map(({ title, desc, icon }) => (
            <article key={title} className="card">
              <div className="thumb" aria-hidden="true">{icon}</div>
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
          aria-label="Support CalmPulse on Buy Me a Coffee"
        >
          <Image
            src="https://cdn.buymeacoffee.com/buttons/bmc-new-btn-logo.svg"
            alt="Buy Me a Coffee logo"
            width={18}
            height={18}
          />
          Buy me a coffee
        </a>

        <footer>CalmPulseDaily © {new Date().getFullYear()}</footer>
      </section>

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .btn,
        .btn.primary{
          background:#fff;
          color:#000;
          border:2px solid #000;
          border-radius:999px;
          padding:.55rem 1.4rem;
          font:500 1rem Poppins;
          cursor:pointer;
          min-width:110px;
          text-align:center;
          transition:all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          will-change:transform;
          position:relative;
          overflow:hidden;
        }
        .btn.test{
          border-style:dashed;
          opacity:.9;
        }
        .btn::before,
        .btn.primary::before{
          content:'';
          position:absolute;
          top:50%;
          left:50%;
          width:0;
          height:0;
          border-radius:50%;
          background:rgba(255,255,255,.1);
          transform:translate(-50%, -50%);
          transition:width .6s ease, height .6s ease;
        }
        .btn:hover::before,
        .btn.primary:hover::before{
          width:300px;
          height:300px;
        }
        .btn.primary{
          background:#000;
          color:#fff;
        }
        .btn:hover:not(:disabled),
        .btn.primary:hover:not(:disabled){
          transform:translateY(-2px);
          box-shadow:0 12px 30px rgba(0,0,0,.12);
        }
        .btn:disabled{
          opacity:0.4;
          cursor:not-allowed;
        }

        .hero{
          min-height:100vh;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          padding:8rem 1rem 4rem;
          font-family:Poppins;
          background:linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%);
          text-align:center;
          position:relative;
          width:100%;
          margin:0;
        }
        .hero::before{
          content:'';
          position:absolute;
          top:0;
          left:0;
          right:0;
          bottom:0;
          background:radial-gradient(circle at 50% 50%, rgba(255,215,0,0.03) 0%, transparent 70%);
          pointer-events:none;
        }
        .hero-content{
          position:relative;
          z-index:1;
          width:100%;
          max-width:100%;
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
          opacity:0;
          animation:fadeInUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
        }
        @keyframes fadeInUp{
          from{
            opacity:0;
            transform:translateY(20px);
          }
          to{
            opacity:1;
            transform:translateY(0);
          }
        }
        .logo-wrapper{
          display:inline-block;
          transition:transform .6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity:1;
          width:80px;
          height:80px;
          margin:0 auto;
        }
        @keyframes fadeIn{
          to{opacity:1;}
        }
        .logo-wrapper:hover{
          transform:scale(1.05);
        }
        h1{
          font-size:2.4rem;
          margin:1rem 0 .45rem;
          font-weight:600;
          letter-spacing:-0.02em;
          opacity:0;
          width:100%;
          text-align:center;
          animation:fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.25s forwards;
        }
        .tagline{
          font-size:1.12rem;
          margin-bottom:2rem;
          color:#666;
          font-weight:300;
          letter-spacing:0.01em;
          opacity:0;
          width:100%;
          text-align:center;
          animation:fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.35s forwards;
        }
        .ring{
          margin:0 auto 2.2rem;
          opacity:0;
          transition:transform .6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          display:flex;
          justify-content:center;
          align-items:center;
          animation:fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.45s forwards;
        }
        .ring:hover{
          transform:scale(1.02);
        }
        .controls{
          display:flex;
          gap:1rem;
          margin:0 auto 4.7rem;
          opacity:0;
          justify-content:center;
          align-items:center;
          width:100%;
          animation:fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.55s forwards;
        }
        .arrow-bounce{
          font-size:2rem;
          opacity:0;
          animation:
            fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.65s forwards,
            bounce 3s cubic-bezier(0.4, 0, 0.6, 1) 0.65s infinite;
          margin-bottom:4rem;
          transition:opacity .3s ease;
        }
        .arrow-bounce:hover{
          opacity:0.7;
        }
        @keyframes bounce{
          0%,100%{transform:translateY(0);}
          50%   {transform:translateY(6px);}
        }

        /* -------- FEATURES -------- */
        .features{
          font-family:Poppins;
          background:linear-gradient(180deg, #f9f9f9 0%, #fafafa 100%);
          text-align:center;
          padding:0 1rem 5rem;
          position:relative;
          width:100%;
          max-width:100%;
        }
        .features-title{
          font-size:1.8rem;
          font-weight:600;
          margin-bottom:4rem;
          letter-spacing:-0.01em;
          color:#1a1a1a;
          opacity:0;
          animation:fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
        }
        .grid{
          max-width:1150px;
          margin:0 auto;
          display:grid;
          gap:2.4rem;
          grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
          position:relative;
        }
        .card{
          padding:0 1rem;
          position:relative;
          transition:all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          opacity:0;
          animation:fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .card:nth-child(1){animation-delay:0.1s;}
        .card:nth-child(2){animation-delay:0.2s;}
        .card:nth-child(3){animation-delay:0.3s;}
        .card:nth-child(4){animation-delay:0.4s;}
        .card:hover{
          transform:translateY(-5px);
        }
        .card:hover .thumb{
          transform:scale(1.03) translateY(-2px);
          box-shadow:0 15px 35px rgba(0,0,0,.08);
        }
        .card:hover svg{
          stroke:#ffd700;
          transform:scale(1.05);
          transition:all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .thumb{
          width:100%;
          height:130px;
          background:linear-gradient(135deg, #f0f4ff 0%, #e9f0ff 100%);
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:3rem;
          margin-bottom:1.1rem;
          transition:all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position:relative;
          overflow:hidden;
        }
        .thumb::after{
          content:'';
          position:absolute;
          top:0;
          left:-100%;
          width:100%;
          height:100%;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
          transition:left .8s ease;
        }
        .card:hover .thumb::after{
          left:100%;
        }
        h3{
          font-size:1.15rem;
          font-weight:600;
          margin:.7rem 0 .5rem;
          letter-spacing:-0.01em;
          transition:color .3s ease;
        }
        .card:hover h3{
          color:#000;
        }
        p{
          font-size:.99rem;
          line-height:1.6;
          color:#666;
          margin:0;
          transition:opacity .3s ease;
        }
        .card:hover p{
          opacity:0.9;
        }
        .coffee{
          display:inline-flex;
          align-items:center;
          gap:.45rem;
          background:#ffdd00;
          color:#000;
          font:600 .95rem Poppins;
          padding:.6rem 1.55rem;
          border-radius:15px;
          box-shadow:0 4px 12px rgba(0,0,0,.08);
          border: 2px solid rgba(0,0,0,0.14);
          text-decoration:none;
          margin-top:4rem;
          transition:all .4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position:relative;
          overflow:hidden;
          opacity:0;
          animation:fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.35s forwards;
        }
        .coffee::before{
          content:'';
          position:absolute;
          top:0;
          left:-100%;
          width:100%;
          height:100%;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
          transition:left .6s ease;
        }
        .coffee:hover::before{
          left:100%;
        }
        .coffee:hover{
          transform:translateY(-2px);
          box-shadow:0 8px 20px rgba(0,0,0,.12);
        }
        footer{
          margin-top:3rem;
          font-size:.9rem;
          color:#999;
          font-weight:300;
          letter-spacing:0.02em;
          opacity:0;
          animation:fadeIn 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.45s forwards;
        }

        @media (prefers-reduced-motion: reduce){
          .hero-content,
          h1,
          .tagline,
          .ring,
          .controls,
          .arrow-bounce,
          .features-title,
          .card,
          .coffee,
          footer{
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* message si aucune piste trouvée */}
      {loadErr && (
        <p style={{ color: '#e11d48', textAlign: 'center', marginTop: '2rem' }}>
          Désolé, aucune méditation n'est disponible pour le moment.
        </p>
      )}

      {/* lecteur audio unique (src injecté via useEffect) */}
      <audio ref={audioRef} preload="auto" />
    </>
  );
}
