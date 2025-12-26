'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { auth, db, firebaseProjectId } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { toLocalDay } from '@/lib/streak';
import { Users, Sparkles } from 'lucide-react';
import { formatFirestoreErrorForUi, isFirestoreApiDisabledError } from '@/lib/firestoreError';

/* ==================================================================== */
/*                               PAGE                                   */
/* ==================================================================== */
const TOTAL_TIME = 60 * 15;

type Completion = {
  id: string;
  userId: string;
  name: string;
  endedAt?: Timestamp;
  day: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  duration: number;
};

export default function CommunityHubPage() {
  const [user, setUser] = useState<User | null>(null);
  const [viewerNickname, setViewerNickname] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('login');
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [firestoreApiDisabled, setFirestoreApiDisabled] = useState(false);
  const [todayCompletions, setTodayCompletions] = useState<Completion[]>([]);
  const [countToday, setCountToday] = useState(0);
  const [countMonth, setCountMonth] = useState(0);
  const [countAllTime, setCountAllTime] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const loadNick = async () => {
      if (!user) {
        setViewerNickname(null);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const nick = snap.exists() ? (snap.data() as { nickname?: string | null }).nickname : null;
        const safe = (nick ?? '').toString().trim().slice(0, 60);
        setViewerNickname(safe || null);
      } catch {
        setViewerNickname(null);
      }
    };
    void loadNick();
  }, [user]);

  const day = useMemo(() => toLocalDay(new Date()), []);
  const month = useMemo(() => day.slice(0, 7), [day]);

  useEffect(() => {
    let alive = true;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setFirestoreError(null);
        setFirestoreApiDisabled(false);

        const col = collection(db, 'communityCompletions');
        const listQ = query(
          col,
          where('day', '==', day),
          where('duration', '==', TOTAL_TIME),
          orderBy('endedAt', 'desc'),
        );

        const [listSnap, todayCountSnap, monthCountSnap, allTimeCountSnap] = await Promise.all([
          getDocs(listQ),
          getCountFromServer(query(col, where('day', '==', day), where('duration', '==', TOTAL_TIME))),
          getCountFromServer(query(col, where('month', '==', month), where('duration', '==', TOTAL_TIME))),
          getCountFromServer(query(col, where('duration', '==', TOTAL_TIME))),
        ]);

        if (!alive) return;

        const list: Completion[] = listSnap.docs.map((d) => {
          const data = d.data() as Omit<Completion, 'id'>;
          return { id: d.id, ...data };
        });

        setTodayCompletions(list);
        setCountToday(todayCountSnap.data().count);
        setCountMonth(monthCountSnap.data().count);
        setCountAllTime(allTimeCountSnap.data().count);
      } catch (e) {
        if (!alive) return;
        setFirestoreError(formatFirestoreErrorForUi(e));
        setFirestoreApiDisabled(isFirestoreApiDisabledError(e));
        setTodayCompletions([]);
        setCountToday(0);
        setCountMonth(0);
        setCountAllTime(0);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [day, month]);

  /* ================================================================= */
  /*                           RENDER                                  */
  /* ================================================================= */
  return (
    <>
      {/* Structured Data - WebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Community Hub - CalmPulseDaily',
            description:
              'See who completed the full 15-minute CalmPulseDaily meditation today, plus daily, monthly, and all-time totals.',
            url: 'https://www.calmpulsedaily.com/community-hub',
          }),
        }}
      />
      
      <AuthHeader onShowModal={(m) => { setModalMode(m); setShowModal(true); }} />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}

      <main
        className="community-main"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%)',
          fontFamily: 'Poppins',
          padding: '7rem 1rem 4rem',
        }}
      >
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>
          {firestoreError && (
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '12px 14px',
                borderRadius: 14,
                background: '#fff',
                border: firestoreApiDisabled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(0,0,0,.08)',
                boxShadow: '0 10px 30px rgba(0,0,0,.05)',
                color: '#111',
              }}
            >
              <div style={{ fontWeight: 850, marginBottom: 6 }}>
                Firestore issue (project:{' '}
                <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {firebaseProjectId}
                </span>
                )
              </div>
              <div style={{ color: '#444', lineHeight: 1.35 }}>{firestoreError}</div>
              {firestoreApiDisabled && (
                <div style={{ marginTop: 10, fontSize: '.9rem', color: '#555' }}>
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
          )}

          <div
            className="community-header"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1.25rem',
              flexWrap: 'wrap',
              marginBottom: '2rem',
            }}
          >
            <div style={{ minWidth: 280, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Users size={28} stroke="#667eea" />
                <h1 style={{ fontSize: '2.6rem', margin: 0 }}>Community Hub</h1>
              </div>
              <p style={{ fontSize: '1.05rem', color: '#555', maxWidth: '720px', margin: '.6rem 0 0' }}>
                Today’s <strong>full 15‑minute</strong> completions — one by one.
              </p>

              <div
                style={{
                  marginTop: '1rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 999,
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,.06)',
                  boxShadow: '0 2px 8px rgba(0,0,0,.04)',
                }}
              >
                <span style={{ fontSize: '.9rem', color: '#111', fontWeight: 650 }}>
                  {user
                    ? `Viewing as ${viewerNickname || user.displayName || user.email?.split('@')[0] || 'Member'}`
                    : 'Viewing as Guest'}
                </span>
                {!user && (
                  <button
                    onClick={() => {
                      setModalMode('login');
                      setShowModal(true);
                    }}
                    style={{
                      border: '1.5px solid #111',
                      background: 'transparent',
                      color: '#111',
                      borderRadius: 999,
                      padding: '7px 12px',
                      fontWeight: 650,
                      fontSize: '.9rem',
                      cursor: 'pointer',
                      transition: 'all .2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#111';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#111';
                    }}
                  >
                    Log in to appear here
                  </button>
                )}
              </div>
            </div>

            <TotalsCard loading={loading} today={countToday} monthCount={countMonth} allTime={countAllTime} />
          </div>

          {loading ? (
            <div className="community-loading" style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
              Loading community activity…
            </div>
          ) : todayCompletions.length === 0 ? (
            <div
              className="community-empty"
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: '#666',
                background: '#fff',
                borderRadius: 18,
                border: '1px solid rgba(0,0,0,.06)',
                boxShadow: '0 2px 8px rgba(0,0,0,.04)',
              }}
            >
              No full sessions logged yet today.
              <div style={{ marginTop: 10, fontSize: '.95rem' }}>
                Finish the 15 minutes on <strong>Home</strong> to show up here.
              </div>
            </div>
          ) : (
            <div
              className="community-grid"
              style={{
                display: 'grid',
                gap: '1.25rem',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              }}
            >
              {todayCompletions.map((c) => {
                const t = c.endedAt?.toDate();
                const timeLabel = t ? t.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) : 'Just now';
                return <CompletionCard key={c.id} name={c.name || 'Anonymous'} timeLabel={timeLabel} />;
              })}
            </div>
          )}
        </div>

        <footer className="community-footer" style={{ marginTop: '5rem', textAlign: 'center', fontSize: '.9rem', color: '#777' }}>
          CalmPulseDaily © {new Date().getFullYear()}
        </footer>
      </main>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .community-main {
          position: relative;
        }
        .community-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .community-header {
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fadeInUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards;
        }
        .community-header h1 {
          opacity: 0;
          animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
        }
        .community-header p {
          opacity: 0;
          animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards;
        }
        .community-grid {
          position: relative;
          z-index: 1;
        }
        .totals-card{
          opacity: 0;
          animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.22s forwards;
        }
        .completion-card {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .community-loading,
        .community-empty{
          opacity: 0;
          animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.22s forwards;
        }
        .community-footer{
          opacity: 0;
          animation: fadeIn 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
        }

        @media (prefers-reduced-motion: reduce){
          .community-header,
          .community-header h1,
          .community-header p,
          .totals-card,
          .completion-card,
          .community-loading,
          .community-empty,
          .community-footer{
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </>
  );
}

/* ==================================================================== */
/*                           COMPONENTS                                 */
/* ==================================================================== */

function TotalsCard({
  loading,
  today,
  monthCount,
  allTime,
}: {
  loading: boolean;
  today: number;
  monthCount: number;
  allTime: number;
}) {
  return (
    <div
      className="totals-card"
      style={{
        minWidth: 260,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 10px 30px rgba(0,0,0,.06)',
        padding: '1.15rem 1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 25% 10%, rgba(102,126,234,0.12) 0%, transparent 55%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Sparkles size={18} stroke="#667eea" />
          <span style={{ fontWeight: 800, color: '#111' }}>Totals</span>
        </div>
        <StatRow label="Today" value={loading ? '—' : today.toString()} />
        <StatRow label="This month" value={loading ? '—' : monthCount.toString()} />
        <StatRow label="All time" value={loading ? '—' : allTime.toString()} />
        <div style={{ marginTop: 10, fontSize: '.82rem', color: '#777' }}>
          Full 15‑minute completions only.
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        padding: '6px 0',
      }}
    >
      <span style={{ color: '#666', fontSize: '.92rem', fontWeight: 650 }}>{label}</span>
      <span style={{ color: '#111', fontSize: '1.15rem', fontWeight: 850 }}>{value}</span>
    </div>
  );
}

const CompletionCard = ({ name, timeLabel }: { name: string; timeLabel: string }) => (
  <div
    className="completion-card"
    style={{
      background: '#fff',
      borderRadius: '18px',
      padding: '1.25rem',
      border: '1px solid rgba(0,0,0,.06)',
      boxShadow: '0 8px 20px rgba(0,0,0,.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      transition: 'all .25s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.05)';
    }}
  >
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontWeight: 850,
          color: '#111',
          fontSize: '1.05rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {name}
      </div>
      <div style={{ marginTop: 6, color: '#666', fontSize: '.92rem' }}>
        Completed the full 15 minutes
      </div>
    </div>
    <div
      style={{
        flexShrink: 0,
        padding: '8px 12px',
        borderRadius: 999,
        background: 'rgba(102,126,234,0.10)',
        color: '#334155',
        border: '1px solid rgba(102,126,234,0.18)',
        fontWeight: 750,
        fontSize: '.9rem',
      }}
    >
      {timeLabel}
    </div>
  </div>
);

