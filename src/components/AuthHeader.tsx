'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LogOut, Settings } from 'lucide-react';

export default function AuthHeader({
  onShowModal,
}: {
  onShowModal: (mode: 'signup' | 'login') => void;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [initial, setInitial] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const mobileAvatarRef = useRef<HTMLDivElement | null>(null);
  const desktopAvatarRef = useRef<HTMLDivElement | null>(null);

  /* listen auth */
  useEffect(
    () =>
      onAuthStateChanged(auth, async (cu) => {
        setUser(cu);
        setShowLogout(false);
        if (!cu) {
          setInitial(null);
          return;
        }
        const letter =
          cu.displayName?.split(' ').pop()?.[0] ?? cu.email?.[0] ?? '';
        setInitial(letter.toUpperCase());
        try {
          const snap = await getDoc(doc(db, 'users', cu.uid));
          const ln = (snap.data()?.lastName as string | undefined)?.[0];
          if (ln) setInitial(ln.toUpperCase());
        } catch {}
      }),
    []
  );

  /* click-outside to close logout dropdown (works on touch + mouse) */
  useEffect(() => {
    const handle = (e: PointerEvent) => {
      if (!showLogout) return;
      const target = e.target as Node | null;
      if (!target) return;

      // Important: desktop + mobile avatar areas both exist in the DOM (CSS toggles visibility),
      // so we must consider clicks inside either container as "inside".
      if (mobileAvatarRef.current?.contains(target)) return;
      if (desktopAvatarRef.current?.contains(target)) return;
      setShowLogout(false);
    };

    document.addEventListener('pointerdown', handle);
    return () => document.removeEventListener('pointerdown', handle);
  }, [showLogout]);

  /* scroll detection using IntersectionObserver */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create a sentinel element to detect when we've scrolled past the top
    const sentinel = document.createElement('div');
    sentinel.style.position = 'absolute';
    sentinel.style.top = '100px';
    sentinel.style.left = '0';
    sentinel.style.width = '1px';
    sentinel.style.height = '1px';
    sentinel.style.pointerEvents = 'none';
    sentinel.style.zIndex = '-9999';
    document.body.appendChild(sentinel);
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsScrolled(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      }
    );
    
    observer.observe(sentinel);
    
    return () => {
      observer.disconnect();
      if (document.body.contains(sentinel)) {
        document.body.removeChild(sentinel);
      }
    };
  }, []);

  const handleLogout = () => void signOut(auth);

  return (
    <header
      className="calmpulse-header"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        zIndex: 200,
        padding: 'var(--hdr-pad, 24px 32px)',
        transition: 'all .4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        background: 'transparent',
      }}
    >
      {/* Transparent blurry backdrop - no color, just blur */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100%',
          background: 'transparent',
          backdropFilter: isScrolled ? 'blur(40px) saturate(180%)' : 'blur(0px)',
          WebkitBackdropFilter: isScrolled ? 'blur(40px) saturate(180%)' : 'blur(0px)',
          opacity: isScrolled ? 1 : 0,
          transition: 'all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      />
      
      {/* Content wrapper */}
      <div
        style={{
          width: '100%',
          maxWidth: '1400px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
      }}
    >
      {/* bloc gauche */}
        <nav
          className="nav-desktop"
          style={{ 
            display: 'flex', 
            gap: 'var(--nav-gap, 32px)',
            alignItems: 'center',
          }}
        >
          <NavLink href="/" hoverColor="#111">Home</NavLink>
          <NavLink
          href="/progress"
            hoverColor="#FB923C"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              onShowModal('login');
            }
          }}
        >
          Progress
          </NavLink>
          <NavLink href="/community-hub" hoverColor="#667eea">Community Hub</NavLink>
          <NavLink href="/about" hoverColor="#FB7185">About Us</NavLink>
      </nav>

      {/* mobile nav toggle */}
      <div
        className="nav-mobile"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: '100%',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!user ? (
            <button
              type="button"
              onClick={() => onShowModal('login')}
              aria-label="Log in"
              style={{
                height: 34,
                padding: '0 16px',
                borderRadius: 10,
                border: '1.5px solid rgba(17,17,17,0.70)',
                background: 'rgba(255,255,255,0.85)',
                color: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 850,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(0,0,0,.10)',
              }}
            >
              Log In
            </button>
          ) : (
            <div ref={mobileAvatarRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowLogout((p) => !p)}
                title="Account Menu"
                aria-label="Open account menu"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: 'none',
                  background: '#111',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: 0,
                  margin: 0,
                  lineHeight: 1,
                  userSelect: 'none',
                  boxShadow: '0 2px 4px rgba(0,0,0,.05)',
                }}
              >
                {initial}
              </button>

              {showLogout && (
                <div
                  style={{
                    position: 'absolute',
                    top: 48,
                    right: 0,
                    background: '#fff',
                    borderRadius: 14,
                    padding: '6px 0',
                    minWidth: 220,
                    boxShadow: '0 14px 40px rgba(0,0,0,.12)',
                    border: '1px solid rgba(0,0,0,.06)',
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ fontWeight: 900, color: '#111', fontSize: '.95rem' }}>
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div style={{ marginTop: 4, color: '#666', fontSize: '.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user?.email}
                    </div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <MenuItem
                      icon={<Settings size={18} />}
                      label="Account"
                      href="/account"
                      onClick={() => setShowLogout(false)}
                    />
                  </div>
                  <div style={{ height: 1, background: '#f5f5f5', margin: '4px 0' }} />
                  <div style={{ padding: '4px 0' }}>
                    <MenuItem
                      icon={<LogOut size={18} />}
                      label="Sign Out"
                      onClick={() => {
                        setShowLogout(false);
                        handleLogout();
                      }}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* bloc droit */}
      <div className="nav-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        {!user ? (
          <button
            onClick={() => onShowModal('login')}
            style={{
              background: 'transparent',
              color: '#111',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '8px 18px',
              fontSize: '0.95rem',
              fontWeight: 500,
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
            Log In
          </button>
        ) : (
          <div
            ref={desktopAvatarRef}
            style={{
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowLogout((p) => !p)}
              title="Account Menu"
              style={{
                width: 36,
                height: 36,
              borderRadius: '50%',
              background: '#111',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
                fontSize: '0.95rem',
              userSelect: 'none',
              cursor: 'pointer',
                border: 'none',
                padding: 0,
                margin: 0,
                lineHeight: 1,
                transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                boxShadow: '0 2px 4px rgba(0,0,0,.05)',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.05)';
            }}
          >
            {initial}
            </button>
            
            {showLogout && (
              <div
                style={{
                  position: 'absolute',
                  top: 48,
                  right: 0,
                  background: '#fff',
                  borderRadius: 12,
                  padding: '6px 0',
                  minWidth: 200,
                  boxShadow: '0 4px 20px rgba(0,0,0,.08)',
                  border: '1px solid rgba(0,0,0,.06)',
                  animation: 'fadeInDown 0.2s ease-out',
                  zIndex: 1000,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <style>{`
                  @keyframes fadeInDown {
                    from {
                      opacity: 0;
                      transform: translateY(-8px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
                
                {/* User Info */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
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
                      fontSize: '0.9rem',
                      padding: 0,
                      margin: 0,
                      lineHeight: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {initial}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#111',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.displayName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: '4px 0' }}>
                  <MenuItem
                    icon={<Settings size={18} />}
                    label="Account"
                    href="/account"
                    onClick={() => setShowLogout(false)}
                  />
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: 1,
                    background: '#f5f5f5',
                    margin: '4px 0',
                }}
                />

                {/* Logout */}
                <div style={{ padding: '4px 0' }}>
                  <MenuItem
                    icon={<LogOut size={18} />}
                    label="Sign Out"
                    onClick={() => {
                      setShowLogout(false);
                      handleLogout();
                    }}
                    danger
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      <MobileBottomNav pathname={pathname} user={user} onShowModal={onShowModal} />

      <style>{`
        @media (max-width: 820px){
          .calmpulse-header{ --hdr-pad: 14px 14px; --nav-gap: 16px; }
          .nav-desktop{ display: none !important; }
          .nav-mobile{ display: flex !important; width: 100%; max-width: 1400px; }
          .nav-right{ display: none !important; }
        }
        .nav-mobile button:focus-visible{
          outline: 3px solid rgba(17,17,17,0.20);
          outline-offset: 3px;
        }
      `}</style>
    </header>
  );
}

function MobileBottomNav({
  pathname,
  user,
  onShowModal,
}: {
  pathname: string | null;
  user: User | null;
  onShowModal: (mode: 'signup' | 'login') => void;
}) {
  const isHome = pathname === '/' || pathname === null;
  const isProgress = pathname === '/progress';
  const isHub = pathname === '/community-hub';
  const isAbout = pathname === '/about';

  return (
    <nav className="cp-bottom-nav" aria-label="Bottom navigation">
      <Link
        href="/"
        className="cp-bottom-item"
        aria-current={isHome ? 'page' : undefined}
        style={{
          color: isHome ? '#111' : '#111',
        }}
      >
        Breath
      </Link>
      <Link
        href="/progress"
        className="cp-bottom-item"
        aria-current={isProgress ? 'page' : undefined}
        onClick={(e) => {
          if (!user) {
            e.preventDefault();
            onShowModal('login');
          }
        }}
        style={{
          color: '#111',
        }}
      >
        Progress
      </Link>
      <Link
        href="/community-hub"
        className="cp-bottom-item"
        aria-current={isHub ? 'page' : undefined}
        style={{
          color: '#111',
        }}
      >
        Hub
      </Link>
      <Link
        href="/about"
        className="cp-bottom-item"
        aria-current={isAbout ? 'page' : undefined}
        style={{
          color: '#111',
        }}
      >
        About
      </Link>
      <style>{`
        .cp-bottom-nav{
          display:none;
        }
        @media (max-width: 820px){
          .cp-bottom-nav{
            position: fixed;
            left: 0;
            right: 0;
            bottom: env(safe-area-inset-bottom);
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0;
            z-index: 998;
            padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
            background: rgba(255,255,255,0.92);
            border-top: 1px solid rgba(0,0,0,0.08);
            box-shadow: 0 -16px 50px rgba(0,0,0,0.10);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
          .cp-bottom-item{
            display:flex;
            align-items:center;
            justify-content:center;
            padding: 10px 8px;
            border-radius: 14px;
            font-weight: 900;
            text-decoration:none;
            border: 1px solid transparent;
            transition: transform .15s ease, background .15s ease;
            font-size: 0.95rem;
          }
          .cp-bottom-item[aria-current='page']{
            background: rgba(0,0,0,0.06);
            border-color: rgba(0,0,0,0.08);
          }
          /* Brand color accents per tab when active */
          .cp-bottom-item[href='/'][aria-current='page']{ background: rgba(255,221,0,0.22); }
          .cp-bottom-item[href='/progress'][aria-current='page']{ background: rgba(251,146,60,0.18); }
          .cp-bottom-item[href='/community-hub'][aria-current='page']{ background: rgba(102,126,234,0.14); }
          .cp-bottom-item[href='/about'][aria-current='page']{ background: rgba(251,113,133,0.14); }
          .cp-bottom-item:active{
            transform: translateY(1px);
          }
        }
      `}</style>
    </nav>
  );
}

/* Nav Link Component */
function NavLink({
  href,
  children,
  onClick,
  hoverColor = '#FB923C',
}: {
  href: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  hoverColor?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
  background: 'none',
  border: 'none',
        color: isHovered ? hoverColor : '#111',
  fontSize: '1.02rem',
  fontWeight: 500,
  cursor: 'pointer',
        padding: '6px 0',
  letterSpacing: 0.1,
        textDecoration: 'none',
        transition: 'color .2s ease',
        position: 'relative',
      }}
    >
      {children}
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: isHovered ? '100%' : 0,
          height: 2,
          background: hoverColor,
          transition: 'width .3s ease',
        }}
      />
    </Link>
  );
}

/* Menu Item Component */
function MenuItem({
  icon,
  label,
  href,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: danger ? '#e11d48' : '#111',
    cursor: 'pointer',
    transition: 'all .2s ease',
    borderRadius: 0,
    border: 'none',
    background: 'transparent',
    width: '100%',
    textAlign: 'left',
  textDecoration: 'none',
};

  if (href) {
    return (
      <Link
        href={href}
        style={baseStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = danger ? 'rgba(225, 29, 72, 0.06)' : '#f9f9f9';
          const iconSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
          if (iconSpan && !danger) iconSpan.style.color = '#FB923C';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          const iconSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
          if (iconSpan && !danger) iconSpan.style.color = '#666';
        }}
        onClick={onClick}
      >
        <span style={{ display: 'flex', alignItems: 'center', color: danger ? '#e11d48' : '#666', transition: 'color .2s ease' }}>
          {icon}
        </span>
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button
      style={baseStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'rgba(225, 29, 72, 0.06)' : '#f9f9f9';
        const iconSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
        if (iconSpan && !danger) iconSpan.style.color = '#FB923C';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        const iconSpan = e.currentTarget.querySelector('span:first-child') as HTMLElement;
        if (iconSpan && !danger) iconSpan.style.color = '#666';
      }}
      onClick={onClick}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: danger ? '#e11d48' : '#666', transition: 'color .2s ease' }}>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}


