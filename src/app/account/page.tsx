'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Shield, UserRound } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('login');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [nickname, setNickname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const hasPasswordProvider = useMemo(() => {
    return !!user?.providerData?.some((p) => p.providerId === 'password');
  }, [user]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoadingProfile(true);
      setProfileErr(null);
      setProfileMsg(null);
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const data = snap.exists() ? (snap.data() as { firstName?: string; lastName?: string; nickname?: string | null }) : {};
        setNickname((data.nickname ?? '').toString());
        const fn = data.firstName ?? user.displayName?.split(' ')?.[0] ?? '';
        const ln = data.lastName ?? user.displayName?.split(' ')?.slice(1).join(' ') ?? '';
        setFirstName(fn);
        setLastName(ln);
      } catch (e) {
        setProfileErr(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    void load();
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileErr(null);
    setProfileMsg(null);
    try {
      const fn = firstName.trim();
      const ln = lastName.trim();
      const displayName = `${fn} ${ln}`.trim() || user.displayName || user.email?.split('@')[0] || 'User';
      const safeNickname = nickname.trim().slice(0, 60);

      await Promise.all([
        updateProfile(user, { displayName }),
        setDoc(
          doc(db, 'users', user.uid),
          {
            nickname: safeNickname || null,
            firstName: fn,
            lastName: ln,
            email: user.email ?? null,
            updatedAt: new Date(),
          },
          { merge: true },
        ),
      ]);

      setProfileMsg('Saved.');
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'permission-denied') {
        setProfileErr('Missing permissions to update your profile in Firestore.');
      } else {
        setProfileErr(e instanceof Error ? e.message : 'Failed to save');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPwErr(null);
    setPwMsg(null);

    if (!hasPasswordProvider) {
      setPwErr('Your account does not use an email/password sign-in method.');
      return;
    }

    if (!user.email) {
      setPwErr('Missing email on this account.');
      return;
    }

    if (newPw.length < 6) {
      setPwErr('New password must be at least 6 characters.');
      return;
    }

    if (newPw !== confirmPw) {
      setPwErr('Passwords do not match.');
      return;
    }

    setChangingPw(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setPwMsg('Password updated.');
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/wrong-password') setPwErr('Current password is incorrect.');
      else if (code === 'auth/requires-recent-login')
        setPwErr('Please log out and log back in, then retry.');
      else setPwErr(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <>
      <AuthHeader
        onShowModal={(m) => {
          setModalMode(m);
          setShowModal(true);
        }}
      />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}

      <main
        style={{
          minHeight: '100vh',
          padding: '7rem 1rem 4rem',
          fontFamily: 'Poppins, sans-serif',
          background: 'linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%)',
        }}
      >
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <Settings size={26} stroke="#111" />
            <h1 style={{ margin: 0, fontSize: '2.2rem' }}>Account</h1>
          </div>

          {!user ? (
            <div
              style={{
                background: '#fff',
                border: '1px solid rgba(0,0,0,.06)',
                borderRadius: 18,
                padding: '1.25rem',
                boxShadow: '0 10px 30px rgba(0,0,0,.06)',
              }}
            >
              <div style={{ fontWeight: 800, color: '#111', marginBottom: 8 }}>You’re viewing as guest.</div>
              <div style={{ color: '#555', marginBottom: 14 }}>
                Log in to edit your profile and password.
              </div>
              <button
                onClick={() => {
                  setModalMode('login');
                  setShowModal(true);
                }}
                style={{
                  border: '1.5px solid #111',
                  background: '#111',
                  color: '#fff',
                  borderRadius: 999,
                  padding: '10px 14px',
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
              >
                Log in
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {/* Profile card */}
              <section
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,.06)',
                  borderRadius: 18,
                  padding: '1.25rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <UserRound size={18} stroke="#111" />
                  <div style={{ fontWeight: 850, color: '#111' }}>Profile</div>
                </div>

                <div style={{ color: '#666', fontSize: '.92rem', marginBottom: 12 }}>
                  Signed in as <strong>{user.email}</strong>
                </div>

                <form onSubmit={saveProfile} style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <div style={{ fontSize: '.9rem', fontWeight: 800, color: '#111' }}>
                      Nickname <span style={{ color: '#777', fontWeight: 650 }}>(public in Community Hub)</span>
                    </div>
                    <input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="e.g. CalmRunner"
                      disabled={loadingProfile || savingProfile}
                      style={inputStyle}
                    />
                    <div style={{ fontSize: '.82rem', color: '#777', lineHeight: 1.35 }}>
                      Your real name stays private; the Community Hub will show this nickname instead.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      disabled={loadingProfile || savingProfile}
                      style={inputStyle}
                    />
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      disabled={loadingProfile || savingProfile}
                      style={inputStyle}
                    />
                  </div>

                  {profileErr && <div style={{ color: '#dc2626', fontSize: '.92rem' }}>{profileErr}</div>}
                  {profileMsg && <div style={{ color: '#166534', fontSize: '.92rem' }}>{profileMsg}</div>}

                  <button
                    type="submit"
                    disabled={savingProfile || loadingProfile}
                    style={{
                      border: '1.5px solid #111',
                      background: 'transparent',
                      color: '#111',
                      borderRadius: 999,
                      padding: '10px 14px',
                      fontWeight: 800,
                      cursor: savingProfile || loadingProfile ? 'default' : 'pointer',
                      transition: 'all .2s ease',
                      justifySelf: 'start',
                    }}
                    onMouseEnter={(e) => {
                      if (savingProfile || loadingProfile) return;
                      e.currentTarget.style.background = '#111';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#111';
                    }}
                  >
                    {savingProfile ? 'Saving…' : 'Save changes'}
                  </button>
                </form>
              </section>

              {/* Password card */}
              <section
                style={{
                  background: '#fff',
                  border: '1px solid rgba(0,0,0,.06)',
                  borderRadius: 18,
                  padding: '1.25rem',
                  boxShadow: '0 10px 30px rgba(0,0,0,.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <Shield size={18} stroke="#111" />
                  <div style={{ fontWeight: 850, color: '#111' }}>Password</div>
                </div>

                {!hasPasswordProvider ? (
                  <div style={{ color: '#666', fontSize: '.92rem' }}>
                    This account doesn’t use an email/password sign-in method, so password changes aren’t available.
                  </div>
                ) : (
                  <form onSubmit={changePassword} style={{ display: 'grid', gap: 10 }}>
                    <input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      placeholder="Current password"
                      autoComplete="current-password"
                      disabled={changingPw}
                      style={inputStyle}
                      required
                    />
                    <input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      placeholder="New password"
                      autoComplete="new-password"
                      disabled={changingPw}
                      style={inputStyle}
                      required
                    />
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={changingPw}
                      style={inputStyle}
                      required
                    />

                    {pwErr && <div style={{ color: '#dc2626', fontSize: '.92rem' }}>{pwErr}</div>}
                    {pwMsg && <div style={{ color: '#166534', fontSize: '.92rem' }}>{pwMsg}</div>}

                    <button
                      type="submit"
                      disabled={changingPw}
                      style={{
                        border: '1.5px solid #111',
                        background: 'transparent',
                        color: '#111',
                        borderRadius: 999,
                        padding: '10px 14px',
                        fontWeight: 800,
                        cursor: changingPw ? 'default' : 'pointer',
                        transition: 'all .2s ease',
                        justifySelf: 'start',
                      }}
                      onMouseEnter={(e) => {
                        if (changingPw) return;
                        e.currentTarget.style.background = '#111';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#111';
                      }}
                    >
                      {changingPw ? 'Updating…' : 'Update password'}
                    </button>
                  </form>
                )}
              </section>
            </div>
          )}
        </div>

        <style jsx>{`
          input:focus {
            outline: none;
            border-color: #111 !important;
            background: #fff !important;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05) !important;
          }
        `}</style>
      </main>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1.5px solid #eee',
  borderRadius: 10,
  padding: '.7rem .95rem',
  fontSize: '1rem',
  fontFamily: 'inherit',
  background: '#fcfcfc',
  transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
};


