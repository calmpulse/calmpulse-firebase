'use client';

import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  toLocalDay,        // YYYY-MM-DD Europe/Paris
  weekDays,           // tableau Mon-Sun de la semaine ISO courante
  streakStats,        // current / longest
} from '@/lib/streak';

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

import AuthHeader  from '@/components/AuthHeader';
import EntryModal  from '@/components/EntryModal';
import { Flame, Calendar, TrendingUp, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';

/* ---------- CONSTANTES UI ---------- */
const ACCENT = '#FB923C';
const INK = '#111';
/* plage minimale des requêtes : 1 janv 2025, midi UTC (= 13/14 h Paris) */
const FROM   = new Date(Date.UTC(2025, 0, 1, 12));

/* ==================================================================== */
/*                               PAGE                                   */
/* ==================================================================== */
export default function ProgressPage() {
  /* -------- état -------- */
  const [user,       setUser]       = useState<User | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [modalMode,  setModalMode]  = useState<'signup' | 'login'>('login');
  const [view,       setView]       = useState<'week' | 'month'>('week');
  const [loading,    setLoading]    = useState(true);
  const [days,       setDays]       = useState<string[]>([]);     // YYYY-MM-DD
  /* mois courant = 1ᵉʳ jour du mois à 12 h UTC ⇒ pas de dérive DST */
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12));
  });

  const weekRef  = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  /* -------- listen to auth state changes -------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setDays([]);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  /* -------- fetch Firestore (avec cache sessionStorage user-specific) -------- */
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }

    // Cache key is user-specific
    const cacheKey = `days_${uid}`;
    const cached = sessionStorage.getItem(cacheKey);
    let hasCachedData = false;
    
    // Show cached data immediately for instant UI
    if (cached) {
      try {
        const cachedDays = JSON.parse(cached);
        setDays(cachedDays);
        hasCachedData = true;
        setLoading(false); // Show UI immediately with cached data
      } catch {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch fresh data in background (or immediately if no cache)
    (async () => {
      try {
        const snap = await getDocs(
          query(
            collection(db, 'sessions'),
            where('userId',  '==', uid),
            where('status',  '==', 'completed'),
            where('endedAt', '>=', Timestamp.fromDate(FROM)),
            orderBy('endedAt', 'asc'),
          ),
        );

        const all = snap.docs.map(d => {
          const data = d.data();
          // Use explicit 'day' field if available, otherwise calculate from endedAt
          if (data.day && typeof data.day === 'string') {
            return data.day;
          }
          // Fallback to calculating from endedAt timestamp
          if (data.endedAt) {
            return toLocalDay((data.endedAt as Timestamp).toDate());
          }
          return null;
        }).filter((day): day is string => day !== null); // Remove any nulls and ensure type safety
        
        // Ensure unique days (in case of duplicates)
        const uniqueDays = Array.from(new Set(all)).sort();
        setDays(uniqueDays);
        sessionStorage.setItem(cacheKey, JSON.stringify(uniqueDays));
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        // Only set loading to false if we didn't have cached data
        if (!hasCachedData) {
          setLoading(false);
        }
      }
    })();
  }, [user]);

  /* -------- scroll auto lorsqu’on change de vue -------- */
  useEffect(() => {
    if (view === 'week'  && weekRef.current)
      weekRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (view === 'month' && monthRef.current)
      monthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [view]);

  /* -------- redirections / spinners -------- */
  if (!user) {
    return (
      <>
        <AuthHeader onShowModal={(m) => { setModalMode(m); setShowModal(true); }} />
        {showModal && (
          <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />
        )}
        <FullPageCenter>Please log in to view your progress.</FullPageCenter>
      </>
    );
  }

  // Show loading only if we have no cached data and are still fetching
  if (loading && days.length === 0) {
    return (
      <>
        <AuthHeader onShowModal={(m) => { setModalMode(m); setShowModal(true); }} />
        {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}
        <FullPageCenter>Loading…</FullPageCenter>
      </>
    );
  }

  /* -------- métriques -------- */
  const { current, longest } = streakStats(days);
  const total  = days.length;
  const week   = weekDays();

  /* -------- données Month -------- */
  const y = monthCursor.getUTCFullYear();
  const m = monthCursor.getUTCMonth();           // 0-based
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();

  /* tableau des dates du mois, toutes à 12 h UTC */
  const monthDates = Array.from({ length: daysInMonth }, (_, i) =>
    new Date(Date.UTC(y, m, i + 1, 12)),
  );

  const blanks     = (monthDates[0].getUTCDay() + 6) % 7; // aligner lundi
  const todayUTC   = new Date();
  const canPrev    = monthCursor.getTime() > FROM.getTime();
  const canNext =
    monthCursor.getUTCFullYear() < todayUTC.getUTCFullYear() ||
    monthCursor.getUTCMonth()    < todayUTC.getUTCMonth();

  /* navigation mois – toujours 12 h UTC */
  const prevMonth = () =>
    setMonthCursor(d =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1, 12)),
    );
  const nextMonth = () =>
    setMonthCursor(d =>
      new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 12)),
    );

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
            name: 'Your Progress - Track Your Meditation Streak',
            description: 'Track your daily meditation progress, build streaks, and monitor your mindfulness journey.',
            url: 'https://www.calmpulsedaily.com/progress',
          }),
        }}
      />
      
      <AuthHeader onShowModal={(m) => { setModalMode(m); setShowModal(true); }} />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}

      <main
        className="progress-main"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%)',
          fontFamily: 'Poppins',
          padding: '7rem 1rem 2rem',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        <div className="wrap" style={{ maxWidth: 1050, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* ---- header ---- */}
          <div className="progress-header" style={{ marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <BarChart3 size={26} stroke={ACCENT} />
                  <h1 style={{ fontSize: '2.4rem', margin: 0, color: INK, letterSpacing: -0.4 }}>
                    Your Progress
                  </h1>
                </div>
                <p style={{ fontSize: '1.03rem', color: '#555', margin: '.55rem 0 0', maxWidth: 720 }}>
                  Calm, consistent, and measurable — your streak and sessions, at a glance.
                </p>
              </div>

              <div
                style={{
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
                <span style={{ fontSize: '.92rem', color: '#111', fontWeight: 700 }}>
                  Viewing as {user.displayName || user.email?.split('@')[0] || 'Member'}
                </span>
              </div>
            </div>
          </div>

          {/* ---- stat cards ---- */}
          <MetricGrid className="metrics-grid">
            <Metric
              label="Current streak"
              value={current}
              note="days"
              icon={<Flame size={20} stroke={ACCENT} />}
              className="metric-card metric-0"
              tone="orange"
            />
            <Metric
              label="Longest streak"
              value={longest}
              note="days"
              icon={<TrendingUp size={20} stroke={ACCENT} />}
              className="metric-card metric-1"
              tone="orangeSoft"
            />
            <Metric
              label="Total sessions"
              value={total}
              note="completed"
              icon={<Calendar size={20} stroke={ACCENT} />}
              className="metric-card metric-2"
              tone="neutral"
            />
          </MetricGrid>

          {/* ---- toggle ---- */}
          <div className="progress-toggle">
            <Toggle>
              {(['week', 'month'] as const).map(v => (
                <ToggleBtn
                  key={v}
                  active={view === v}
                  onClick={() => setView(v)}
                >
                  {v === 'week' ? 'This week' : 'This month'}
                </ToggleBtn>
              ))}
            </Toggle>
          </div>

          {/* ---- WEEK VIEW ---- */}
          {view === 'week' && (
            <CalendarCard title="This week" innerRef={weekRef}>
              <WeekGrid>
                {week.map(d => (
                  <Day
                    key={d}
                    label={new Date(d).toLocaleDateString('en', { weekday: 'short' })}
                    filled={days.includes(d)}
                    size={30}
                    variant="week"
                  />
                ))}
              </WeekGrid>
            </CalendarCard>
          )}

          {/* ---- MONTH VIEW ---- */}
          {view === 'month' && (
            <CalendarCard
              innerRef={monthRef}
              title={monthCursor.toLocaleDateString('en', {
                month: 'long',
                year: 'numeric',
                timeZone: 'Europe/Paris',
              })}
              controls={
                <>
                  <NavBtn disabled={!canPrev} onClick={prevMonth}>
                    <ChevronLeft size={20} />
                  </NavBtn>
                  <NavBtn disabled={!canNext} onClick={nextMonth}>
                    <ChevronRight size={20} />
                  </NavBtn>
                </>
              }
            >
              <MonthGrid>
                {Array.from({ length: blanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}

                {monthDates.map(d => {
                  const key = toLocalDay(d);
                  return (
                    <Day
                      key={key}
                      label={d.getUTCDate().toString()}
                      filled={days.includes(key)}
                      size={30}
                      variant="month"
                    />
                  );
                })}
              </MonthGrid>
            </CalendarCard>
          )}

          <footer className="progress-footer" style={{ marginTop: '5rem', fontSize: '.9rem', color: '#777', textAlign: 'center' }}>
            CalmPulseDaily © {new Date().getFullYear()}
          </footer>

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
          .progress-main::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background:
              radial-gradient(circle at 18% 12%, rgba(251, 146, 60, 0.045) 0%, transparent 45%),
              radial-gradient(circle at 82% 20%, rgba(0, 0, 0, 0.02) 0%, transparent 40%),
              radial-gradient(circle at 50% 85%, rgba(251, 146, 60, 0.03) 0%, transparent 55%);
            pointer-events: none;
          }
          .progress-header {
            position: relative;
            z-index: 1;
            opacity: 0;
            animation: fadeInUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.2s forwards;
          }
          .progress-header h1 {
            opacity: 0;
            animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
          }
          .progress-header p {
            opacity: 0;
            animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards;
          }
          .metrics-grid {
            position: relative;
            z-index: 1;
          }
          .metric-card {
            opacity: 0;
            animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          .metric-0 { animation-delay: 0.1s; }
          .metric-1 { animation-delay: 0.2s; }
          .metric-2 { animation-delay: 0.3s; }

          .progress-toggle{
            opacity: 0;
            animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.25s forwards;
          }

          .calendar-card{
            opacity: 0;
            animation: fadeInUp 0.85s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.32s forwards;
          }

          .progress-footer{
            opacity: 0;
            animation: fadeIn 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.4s forwards;
          }

          @media (prefers-reduced-motion: reduce){
            .progress-header,
            .progress-header h1,
            .progress-header p,
            .metric-card,
            .progress-toggle,
            .calendar-card,
            .progress-footer{
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
          }
          @media (max-width: 768px) {
            .progress-main {
              padding: 6rem 0.5rem 2rem !important;
            }
            .progress-header p {
              font-size: 0.95rem !important;
            }
            .metrics-grid {
              gap: 1rem !important;
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 480px) {
            .progress-main {
              padding: 5.5rem 0.25rem 1.5rem !important;
            }
            .progress-header p {
              font-size: 0.9rem !important;
            }
          }
        `}</style>
        </div>
      </main>
    </>
  );
}

/* ==================================================================== */
/*                           SOUS-COMPOSANTS                            */
/* ==================================================================== */

const FullPageCenter = ({
  children,
}: { children: React.ReactNode }) => (
  <div
    style={{
      minHeight: '100vh',
      fontFamily: 'Poppins',
      display:   'flex',
      alignItems:'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </div>
);

const MetricGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={className}
    style={{
      display: 'grid',
      gap: '1.25rem',
      gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
    }}
  >
    {children}
  </div>
);

function Metric({ 
  label, 
  value, 
  icon,
  className,
  note,
  tone = 'neutral',
}: { 
  label: string; 
  value: number;
  icon?: React.ReactNode;
  className?: string;
  note?: string;
  tone?: 'orange' | 'orangeSoft' | 'neutral';
}) {
  const toneBg =
    tone === 'orange'
      ? 'radial-gradient(circle at 25% 10%, rgba(251,146,60,0.20) 0%, transparent 55%)'
      : tone === 'orangeSoft'
        ? 'radial-gradient(circle at 25% 10%, rgba(251,146,60,0.14) 0%, transparent 55%)'
        : 'radial-gradient(circle at 25% 10%, rgba(0,0,0,0.06) 0%, transparent 55%)';

  return (
    <div
      className={className}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '1.25rem',
        boxShadow: '0 10px 30px rgba(0,0,0,.06)',
        border: '1px solid rgba(0,0,0,.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all .25s ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,.06)';
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: toneBg,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(251,146,60,0.10)',
                border: '1px solid rgba(251,146,60,0.18)',
              }}
            >
              {icon}
            </div>
            <div style={{ fontSize: '.95rem', color: '#555', fontWeight: 750 }}>{label}</div>
          </div>

          {note && (
            <div style={{ fontSize: '.85rem', color: '#777', fontWeight: 650 }}>
              {note}
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: INK, letterSpacing: -0.6 }}>
            {value}
          </div>
          <div style={{ height: 10, width: 10, borderRadius: 999, background: ACCENT, opacity: 0.9 }} />
        </div>
      </div>
    </div>
  );
}

const Toggle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      marginTop: '1.5rem',
      display: 'flex',
      justifyContent: 'flex-start',
    }}
  >
    <div
      style={{
        display: 'inline-flex',
        gap: 6,
        padding: 6,
        background: '#fff',
        borderRadius: 999,
        border: '1px solid rgba(0,0,0,.06)',
        boxShadow: '0 2px 10px rgba(0,0,0,.04)',
      }}
    >
      {children}
    </div>
  </div>
);

const ToggleBtn = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: '.55rem 1.1rem',
      borderRadius: 999,
      fontSize: '.9rem',
      fontWeight: 750,
      border: '1px solid transparent',
      cursor: 'pointer',
      background: active ? '#111' : 'transparent',
      color: active ? '#fff' : '#111',
      transition: 'all .2s ease',
      boxShadow: active ? '0 10px 24px rgba(0,0,0,.12)' : 'none',
      transform: 'translateY(0)',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-1px)';
      if (!active) e.currentTarget.style.background = 'rgba(0,0,0,.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = active ? '0 10px 24px rgba(0,0,0,.12)' : 'none';
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    {children}
  </button>
);

function CalendarCard({
  title,
  children,
  innerRef,
  controls,
}: {
  title: string;
  children: React.ReactNode;
  innerRef?: React.Ref<HTMLDivElement>;
  controls?: React.ReactNode;
}) {
  return (
    <div
      className="calendar-card"
      ref={innerRef}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '1rem',
        margin: '1.1rem auto 0',
        boxShadow: '0 10px 30px rgba(0,0,0,.06)',
        border: '1px solid rgba(0,0,0,.06)',
        transition: 'all .25s ease',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 14px 30px rgba(0,0,0,.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,.06)';
      }}
    >
      {/* Subtle accent */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 10% 0%, rgba(251,146,60,0.10) 0%, transparent 55%)' }} />
      
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          fontSize: '1.02rem',
          fontWeight: 850,
          color: '#111',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span>{title}</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>{controls}</div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

const WeekGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: '0.75rem',
    }}
  >
    {children}
  </div>
);

const MonthGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: '0.5rem',
      width: '100%',
    }}
  >
    {children}
  </div>
);

function Day({
  label,
  filled,
  size,
  variant = 'month',
}: {
  label: string;
  filled: boolean;
  size: number;
  variant?: 'week' | 'month';
}) {
  const isMonth = variant === 'month';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: isMonth ? '0.25rem 0.15rem' : '0.35rem 0.15rem',
        borderRadius: 14,
        transition: 'all .2s ease',
        cursor: 'default',
        minWidth: 0,
        width: '100%',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = filled ? 'rgba(251, 146, 60, 0.08)' : 'rgba(0,0,0,0.03)';
        const circle = e.currentTarget.querySelector('span:last-child') as HTMLElement;
        if (circle) {
          circle.style.transform = 'scale(1.08)';
          if (filled) {
            circle.style.boxShadow = '0 10px 22px rgba(251, 146, 60, 0.28)';
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        const circle = e.currentTarget.querySelector('span:last-child') as HTMLElement;
        if (circle) {
          circle.style.transform = 'scale(1)';
          circle.style.boxShadow = 'none';
        }
      }}
    >
      {/* Week view shows weekday label above; Month view uses the number inside the circle (except filled days) */}
      {!isMonth && (
        <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 750, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: filled
            ? `linear-gradient(135deg, ${ACCENT} 0%, #FF8C42 100%)`
            : '#fff',
          border: filled ? '1px solid rgba(0,0,0,0)' : '1px solid rgba(0,0,0,.14)',
          transition: 'all .2s ease',
          position: 'relative',
        }}
      >
        {isMonth && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '.85rem',
              fontWeight: 850,
              color: filled ? '#fff' : '#111',
              userSelect: 'none',
            }}
          >
            {label}
          </span>
        )}
      </span>
    </div>
  );
}

const NavBtn = ({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    style={{
      background: disabled ? 'transparent' : '#fff',
      border: '1px solid rgba(0,0,0,.10)',
      borderRadius: '8px',
      padding: '0.4rem 0.6rem',
      cursor: disabled ? 'default' : 'pointer',
      color: disabled ? '#bbb' : '#111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all .2s ease',
      opacity: disabled ? 0.5 : 1,
    }}
    onMouseEnter={(e) => {
      if (!disabled) {
        e.currentTarget.style.background = 'rgba(0,0,0,.04)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!disabled) {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }}
  >
    {children}
  </button>
);


