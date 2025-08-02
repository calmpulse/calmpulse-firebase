'use client';

import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
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

/* ---------- CONSTANTES UI ---------- */
const ACCENT = '#FB923C';
/* plage minimale des requêtes : 1 janv 2025, midi UTC (= 13/14 h Paris) */
const FROM   = new Date(Date.UTC(2025, 0, 1, 12));

/* ==================================================================== */
/*                               PAGE                                   */
/* ==================================================================== */
export default function ProgressPage() {
  /* -------- état -------- */
  const [showModal,  setShowModal]  = useState(false);
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

  /* -------- fetch Firestore (avec cache sessionStorage) -------- */
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const cache = sessionStorage.getItem('days');
    if (cache) {
      setDays(JSON.parse(cache));
      setLoading(false);
    }

    (async () => {
      const snap = await getDocs(
        query(
          collection(db, 'sessions'),
          where('userId',  '==', uid),
          where('status',  '==', 'completed'),
          where('endedAt', '>=', Timestamp.fromDate(FROM)),
          orderBy('endedAt', 'asc'),
        ),
      );

      const all = snap.docs.map(d =>
        toLocalDay((d.data().endedAt as Timestamp).toDate()),
      );
      setDays(all);
      sessionStorage.setItem('days', JSON.stringify(all));
      setLoading(false);
    })();
  }, []);

  /* -------- scroll auto lorsqu’on change de vue -------- */
  useEffect(() => {
    if (view === 'week'  && weekRef.current)
      weekRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (view === 'month' && monthRef.current)
      monthRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [view]);

  /* -------- redirections / spinners -------- */
  if (!auth.currentUser)
    return (
      <>
        <AuthHeader onShowModal={() => setShowModal(true)} />
        {showModal && (
          <EntryModal mode="login" onClose={() => setShowModal(false)} />
        )}
        <FullPageCenter>Please log in to view your progress.</FullPageCenter>
      </>
    );

  if (loading)
    return (
      <>
        <AuthHeader onShowModal={() => setShowModal(false)} />
        <FullPageCenter>Loading…</FullPageCenter>
      </>
    );

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
      <AuthHeader onShowModal={() => setShowModal(true)} />

      <main
        style={{
          minHeight: '100vh',
          background: '#f9f9f9',
          fontFamily: 'Poppins',
          padding: '7rem 1rem 4rem',
          textAlign: 'center',
        }}
      >
        {/* ---- titre ---- */}
        <h1 style={{ fontSize: '2.6rem', marginBottom: '.4rem' }}>
          Your Progress
        </h1>
        <p style={{ fontSize: '1.05rem', color: '#555', marginBottom: '3rem' }}>
          Build your CalmPulse streak one mindful breath at a time
        </p>

        {/* ---- cartes métriques ---- */}
        <MetricGrid>
          <Metric label="Current Streak"  value={current} />
          <Metric label="Longest Streak"  value={longest} />
          <Metric label="Total Sessions"  value={total}   />
        </MetricGrid>

        {/* ---- toggle ---- */}
        <Toggle>
          {(['week', 'month'] as const).map(v => (
            <ToggleBtn
              key={v}
              active={view === v}
              onClick={() => setView(v)}
            >
              {v === 'week' ? 'This Week' : 'This Month'}
            </ToggleBtn>
          ))}
        </Toggle>

        {/* ---- WEEK VIEW ---- */}
        {view === 'week' && (
          <CalendarCard title="This Week" innerRef={weekRef}>
            <WeekGrid>
              {week.map(d => (
                <Day
                  key={d}
                  label={new Date(d).toLocaleDateString('en', {
                    weekday: 'short',
                  })}
                  filled={days.includes(d)}
                  size={28}
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
              year:  'numeric',
              timeZone: 'Europe/Paris',
            })}
            controls={
              <>
                <NavBtn disabled={!canPrev} onClick={prevMonth}>‹</NavBtn>
                <NavBtn disabled={!canNext} onClick={nextMonth}>›</NavBtn>
              </>
            }
          >
            <MonthGrid>
              {Array.from({ length: blanks }).map((_, i) => (
                <div key={`blank-${i}`} />
              ))}

              {monthDates.map(d => {
                const key = toLocalDay(d);        // même clé que dans days[]
                return (
                  <Day
                    key={key}
                    label={d.getUTCDate().toString()}
                    filled={days.includes(key)}
                    size={22}
                  />
                );
              })}
            </MonthGrid>
          </CalendarCard>
        )}

        <footer style={{ marginTop: '5rem', fontSize: '.9rem', color: '#777' }}>
          CalmPulseDaily © 2025
        </footer>
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

const MetricGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      maxWidth: 1050,
      margin: '0 auto',
      display: 'grid',
      gap: '2rem',
      gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
    }}
  >
    {children}
  </div>
);

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '2rem',
        boxShadow: '0 2px 6px rgba(0,0,0,.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '1.05rem', color: '#555' }}>{label}</span>
      <span
        style={{
          fontSize: '3rem',
          fontWeight: 700,
          color: ACCENT,
          marginTop: '.3rem',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const Toggle = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      marginTop: '3rem',
      display: 'flex',
      gap: '1rem',
      justifyContent: 'center',
    }}
  >
    {children}
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
      padding: '.5rem 1.4rem',
      borderRadius: 999,
      fontSize: '.9rem',
      fontWeight: 500,
      border: 'none',
      cursor: 'pointer',
      background: active ? ACCENT : '#e5e7eb',
      color: active ? '#fff' : '#111',
      transition: 'all .25s ease',
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
      ref={innerRef}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: '2rem',
        maxWidth: 1050,
        margin: '2rem auto 0',
        boxShadow: '0 2px 6px rgba(0,0,0,.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          fontSize: '1.2rem',
        }}
      >
        {controls}
        {title}
      </div>
      {children}
    </div>
  );
}

const WeekGrid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7,1fr)',
      gap: '1.2rem',
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
      gap: '1rem',
    }}
  >
    {children}
  </div>
);

function Day({
  label,
  filled,
  size,
}: {
  label: string;
  filled: boolean;
  size: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span style={{ fontSize: '.75rem', color: '#666' }}>{label}</span>
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: filled ? ACCENT : '#d1d5db',
        }}
      />
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
      background: 'none',
      border: 'none',
      fontSize: '1.4rem',
      cursor: disabled ? 'default' : 'pointer',
      color: disabled ? '#bbb' : '#000',
    }}
  >
    {children}
  </button>
);


