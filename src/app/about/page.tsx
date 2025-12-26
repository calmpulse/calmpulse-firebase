import React from 'react';
import type { Metadata } from 'next';
import AboutHeaderWithModal from './AboutHeaderWithModal';
import { Mail, MessageCircle } from 'lucide-react';
import Image from 'next/image';

const siteUrl = 'https://www.calmpulsedaily.com';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'CalmPulseDaily is a light, minimalist meditation and breathing platform built in 2025 by a French start-up—designed to help busy minds reset with breath, calm, and awareness.',
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    type: 'website',
    url: `${siteUrl}/about`,
    title: 'About Us | CalmPulseDaily',
    description:
      'Created in 2025 by a French start-up, CalmPulseDaily helps people reconnect with themselves through breath, calm, and awareness—minimalist, AI-guided, and built for busy minds.',
    images: [
      {
        url: `${siteUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: 'CalmPulseDaily',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | CalmPulseDaily',
    description:
      'Created in 2025 by a French start-up, CalmPulseDaily helps people reconnect with themselves through breath, calm, and awareness—minimalist, AI-guided, and built for busy minds.',
    images: [`${siteUrl}/logo.svg`],
  },
};

export default function AboutPage() {
  const WhyIcon = ({ size = 42 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3.2" opacity="1" />
      <circle cx="24" cy="24" r="3.2" fill="currentColor" opacity="1" />
    </svg>
  );

  const HowIcon = ({ size = 42 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <path
        d="M6 28c7-9 13-9 18 0s11 9 18 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="1"
      />
    </svg>
  );

  const WhatIcon = ({ size = 42 }: { size?: number }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block' }}
    >
      <circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" strokeWidth="3.2" opacity="1" />
      <path d="M22 18l10 6-10 6v-12z" fill="currentColor" opacity="1" />
    </svg>
  );

  return (
    <>
      {/* Structured Data - AboutPage */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About Us | CalmPulseDaily',
            url: `${siteUrl}/about`,
            description:
              'Learn about CalmPulseDaily: a minimalist, AI-guided meditation and breathing platform created in 2025 by a French start-up.',
            isPartOf: {
              '@type': 'WebSite',
              name: 'CalmPulseDaily',
              url: siteUrl,
            },
          }),
        }}
      />

      <AboutHeaderWithModal />

      <main
        className="about"
        style={{
          minHeight: '100vh',
          fontFamily: 'Poppins, sans-serif',
          background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
          position: 'relative',
        }}
      >
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-wrap">
            <div className="hero-grid">
              <div className="hero-copy">
                <h1 className="hero-title">About Us</h1>
                <p className="hero-sub">
                  We are building CalmPulseDaily to help people reconnect with themselves—through breath, calm, and awareness.
                  It&apos;s a minimalist, AI-guided meditation and breathing platform designed for busy minds.
                </p>
                <p className="hero-sub2">
                  Created in <strong>2025</strong> by a French start‑up — surrounded by friends while building
                  a calmer daily ritual.
                </p>

                <div className="hero-cta">
                  <a className="btn" href="#contact">
                    Contact us
                  </a>
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
                </div>
              </div>

              <div className="hero-visual" aria-hidden="true">
                <svg width="420" height="420" viewBox="0 0 420 420" className="hero-illus" aria-hidden="true">
                  <defs>
                    <linearGradient id="cp_yellow" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0" stopColor="#FFDD00" />
                      <stop offset="1" stopColor="#FFB800" />
                    </linearGradient>
                  </defs>
                  <ellipse cx="250" cy="330" rx="160" ry="26" fill="rgba(0,0,0,0.08)" />
                  <circle cx="250" cy="220" r="150" fill="url(#cp_yellow)" />
                  <text
                    x="250"
                    y="230"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Papyrus, 'Herculanum', 'Bradley Hand', 'Chalkduster', 'Times New Roman', serif"
                    fontSize="56"
                    fontWeight="900"
                    letterSpacing="6"
                    fill="rgba(17,17,17,0.78)"
                  >
                    ZEN
                  </text>
                </svg>
              </div>
            </div>

            <div className="scroll-center">
              <a className="scroll-cue" href="#story" aria-label="Scroll down">
                <span className="scroll-cue-arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </div>
          </div>

          <div className="hero-bg" aria-hidden="true" />
        </section>

        {/* HORIZONTAL 3-UP */}
        <section className="tri" id="story">
          <div className="wrap">
            <div className="w3-grid" aria-label="Why / How / What">
              <article className="w3-item">
                <div className="w3-icon why" aria-hidden="true">
                  <div className="w3-icon-bg" />
                  <span className="w3-num">1</span>
                </div>
                <h2 className="w3-title">Why</h2>
                <p className="w3-text">
                  CalmPulseDaily exists to help people slow down every day, even when life is busy. We believe calm should be
                  simple, accessible, and built through small daily pauses — not long routines or perfect discipline.
                </p>
              </article>

              <article className="w3-item">
                <div className="w3-icon how" aria-hidden="true">
                  <div className="w3-icon-bg" />
                  <span className="w3-num">2</span>
                </div>
                <h2 className="w3-title">How</h2>
                <p className="w3-text">
                  We remove friction from meditation by offering a single, short daily experience. CalmPulseDaily helps people build consistency, not overwhelm. 
                  No libraries to browse, no decisions to make — just show up and breathe.
                </p>
              </article>

              <article className="w3-item">
                <div className="w3-icon what" aria-hidden="true">
                  <div className="w3-icon-bg" />
                  <span className="w3-num">3</span>
                </div>
                <h2 className="w3-title">What</h2>
                <p className="w3-text">
                  CalmPulseDaily is a daily guided meditation experience. Each day, users access a short session designed to
                  reset the mind, track presence, and turn calm into a habit over time.
                </p>
              </article>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="stat-num">2025</div>
                <div className="stat-label">Created</div>
              </div>
              <div className="stat">
                <div className="stat-num">15</div>
                <div className="stat-label">Minutes to reset</div>
              </div>
              <div className="stat">
                <div className="stat-num">0€</div>
                <div className="stat-label">To start</div>
              </div>
            </div>

            <div className="contact-card" id="contact">
              <div className="contact-bg" aria-hidden="true" />
              <div className="contact-inner">
                <div className="contact-title">
                  <MessageCircle size={20} stroke="#111" />
                  <h2>Contact us</h2>
                </div>
                <p>
                  Questions, feedback, or partnership ideas? We’d love to hear from you — quick hello’s are welcome too.
                </p>
                <div className="contact-actions">
                  <a className="contact-btn" href="mailto:calmpulsedaily@gmail.com">
                    <span className="contact-btn-icon" aria-hidden="true">
                      <Mail size={16} stroke="#fff" />
                    </span>
                    Email us
                  </a>
                </div>
              </div>
            </div>

            <footer className="footer">CalmPulseDaily © {new Date().getFullYear()}</footer>
          </div>
        </section>

        <style>{`
          html{ scroll-behavior: smooth; }
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
          @keyframes floaty {
            0% { transform: translate3d(0,0,0) }
            50% { transform: translate3d(0,-10px,0) }
            100% { transform: translate3d(0,0,0) }
          }
          @keyframes bounce {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }
          .wrap{
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 1rem;
            position: relative;
            z-index: 1;
          }
          .hero{
            background: transparent;
            position: relative;
            padding: 7.5rem 0 3.25rem;
          }
          .hero-bg{
            position:absolute;
            inset:0;
            pointer-events:none;
            background:
              radial-gradient(circle at 18% 20%, rgba(102,126,234,0.10) 0%, transparent 55%),
              radial-gradient(circle at 82% 22%, rgba(251,113,133,0.08) 0%, transparent 55%),
              radial-gradient(circle at 50% 95%, rgba(255,221,0,0.10) 0%, transparent 60%);
          }
          .hero-wrap{
            padding-top: 0;
          }
          .hero-grid{
            display:grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 2rem;
            align-items: center;
          }
          .hero-copy{
            text-align: left;
            opacity: 0;
            animation: fadeInUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s forwards;
          }
          .hero-title{
            margin: 0;
            font-size: 4.1rem;
            letter-spacing: -1.2px;
            color: #111;
            line-height: 0.98;
            opacity: 0;
            animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.25s forwards;
          }
          .hero-sub{
            margin: 1rem 0 0;
            color: rgba(17,17,17,0.85);
            font-size: 1.15rem;
            line-height: 1.75;
            max-width: 60ch;
            opacity: 0;
            animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.35s forwards;
          }
          .hero-sub2{
            margin: 0.9rem 0 0;
            color: rgba(17,17,17,0.78);
            font-size: 1.05rem;
            line-height: 1.7;
            max-width: 62ch;
            opacity: 0;
            animation: fadeIn 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.45s forwards;
          }
          .hero-cta{
            margin-top: 1.4rem;
            display:flex;
            gap: 10px;
            flex-wrap: wrap;
            opacity: 0;
            animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.55s forwards;
          }
          .btn{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            padding: 10px 14px;
            border-radius: 999px;
            background: #111;
            color:#fff;
            text-decoration:none;
            font-weight: 850;
            border: 1.5px solid #111;
            transition: transform .2s ease, box-shadow .2s ease, background .2s ease, color .2s ease;
            box-shadow: 0 10px 24px rgba(0,0,0,.12);
          }
          .btn:hover{
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(0,0,0,.16);
          }
          .scroll-cue{
            margin-top: 1.35rem;
            display:inline-flex;
            flex-direction: column;
            align-items:center;
            gap: 6px;
            text-decoration:none;
            color: rgba(17,17,17,0.7);
          }
          .scroll-center{
            display:flex;
            justify-content:center;
            margin-top: 0.75rem;
          }
          .scroll-cue-arrow{
            font-size: 2rem;
            opacity: 0.75;
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
            transition:all .4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position:relative;
            overflow:hidden;
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
          .coffee:hover::before{ left:100%; }
          .coffee:hover{
            transform:translateY(-2px);
            box-shadow:0 8px 20px rgba(0,0,0,.12);
          }
          .hero-visual{
            display:flex;
            align-items:center;
            justify-content:center;
            opacity: 0;
            animation: fadeInUp 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.25s forwards;
          }
          .hero-illus{
            filter: drop-shadow(0 30px 60px rgba(0,0,0,0.18));
          }

          .tri{
            padding: 4.25rem 0 4rem;
          }
          /* WHY / HOW / WHAT (3-up) */
          .w3-grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 2.25rem;
            align-items: start;
            justify-items: center;
            text-align: center;
          }
          .w3-item{
            max-width: 42ch;
            display:flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          }
          .w3-item:nth-child(1){ animation-delay: 0.08s; }
          .w3-item:nth-child(2){ animation-delay: 0.18s; }
          .w3-item:nth-child(3){ animation-delay: 0.28s; }
          .w3-icon{
            width: 128px;
            height: 128px;
            border-radius: 999px;
            position: relative;
            display:flex;
            align-items:center;
            justify-content:center;
            margin-bottom: 18px;
            color: rgba(17,17,17,0.92);
          }
          .w3-num{
            position: relative;
            z-index: 1;
            font-weight: 950;
            font-size: 3rem;
            letter-spacing: -0.06em;
            color: rgba(17,17,17,0.88);
            line-height: 1;
          }
          .w3-icon-bg{
            position:absolute;
            inset:0;
            border-radius: 999px;
            opacity: 1;
            filter: blur(0px);
          }
          .w3-icon.why .w3-icon-bg{
            background: radial-gradient(circle at 30% 25%, rgba(102,126,234,0.42) 0%, rgba(102,126,234,0.14) 55%, transparent 76%);
          }
          .w3-icon.how .w3-icon-bg{
            background: radial-gradient(circle at 30% 25%, rgba(251,146,60,0.42) 0%, rgba(251,146,60,0.14) 55%, transparent 76%);
          }
          .w3-icon.what .w3-icon-bg{
            background: radial-gradient(circle at 30% 25%, rgba(255,221,0,0.50) 0%, rgba(255,221,0,0.16) 55%, transparent 76%);
          }
          .w3-title{
            margin: 0;
            font-size: 2.2rem;
            font-weight: 950;
            letter-spacing: -0.9px;
            color:#111;
            line-height: 1.05;
          }
          .w3-text{
            margin: 14px 0 0;
            color: rgba(17,17,17,0.70);
            line-height: 1.9;
            font-size: 1.05rem;
          }
          .stats{
            margin-top: 1.1rem;
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.1rem;
            opacity: 0;
            animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.18s forwards;
          }
          .stat{
            border-radius: 18px;
            background: #fff;
            border: 1px solid rgba(0,0,0,.06);
            box-shadow: 0 10px 30px rgba(0,0,0,.06);
            padding: 1.15rem;
            text-align: center;
          }
          .stat-num{
            font-size: 2.4rem;
            font-weight: 950;
            letter-spacing: -0.6px;
            color:#111;
          }
          .stat-label{
            margin-top: 6px;
            color:#555;
            font-weight: 750;
          }
          .contact-card{
            margin-top: 1.35rem;
            position: relative;
            overflow: hidden;
            border-radius: 18px;
            background: #fff;
            border: 1px solid rgba(0,0,0,.06);
            box-shadow: 0 10px 30px rgba(0,0,0,.06);
            opacity: 0;
            animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.24s forwards;
          }
          .contact-bg{
            position:absolute;
            inset:0;
            pointer-events:none;
            background:
              radial-gradient(circle at 16% 18%, rgba(102,126,234,0.14) 0%, transparent 55%),
              radial-gradient(circle at 82% 26%, rgba(251,113,133,0.10) 0%, transparent 55%),
              radial-gradient(circle at 52% 86%, rgba(255,221,0,0.10) 0%, transparent 60%);
          }
          .contact-inner{
            position: relative;
            z-index: 1;
            padding: 1.15rem;
          }
          .contact-title{
            display:flex;
            align-items:center;
            gap: 10px;
          }
          .contact-title h2{
            margin: 0;
            font-size: 1.25rem;
            letter-spacing: -0.2px;
            color:#111;
          }
          .contact-inner p{
            margin: 10px 0 0;
            color:#555;
            line-height: 1.7;
            max-width: 78ch;
          }
          .contact-actions{
            display:flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 14px;
          }
          .contact-btn{
            display:inline-flex;
            align-items:center;
            gap: 10px;
            padding: 10px 14px;
            border-radius: 999px;
            background: #111;
            color:#fff;
            text-decoration:none;
            font-weight: 850;
            border: 1.5px solid #111;
            transition: transform .2s ease, box-shadow .2s ease;
            box-shadow: 0 10px 24px rgba(0,0,0,.12);
          }
          .contact-btn:hover{
            transform: translateY(-1px);
            box-shadow: 0 14px 30px rgba(0,0,0,.16);
          }
          .contact-btn-icon{
            width: 24px;
            height: 24px;
            border-radius: 999px;
            display:flex;
            align-items:center;
            justify-content:center;
            background: rgba(255,255,255,0.16);
          }
          .footer{
            margin-top: 2.8rem;
            text-align:center;
            color:#777;
            font-size: .9rem;
            opacity: 0;
            animation: fadeIn 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.3s forwards;
          }

          @media (prefers-reduced-motion: reduce){
            .hero-copy,
            .hero-title,
            .hero-sub,
            .hero-sub2,
            .hero-cta,
            .hero-visual,
            .w3-item,
            .stats,
            .contact-card,
            .footer{
              animation: none !important;
              opacity: 1 !important;
              transform: none !important;
            }
            .scroll-cue-arrow{
              animation: none !important;
            }
          }
          @media (max-width: 980px){
            .hero{
              padding: 6.75rem 0 3.25rem;
            }
            .hero-grid{
              grid-template-columns: 1fr;
              gap: 1.75rem;
            }
            .hero-copy{
              text-align:center;
            }
            .hero-cta{
              justify-content:center;
            }
            .hero-title{
              font-size: 3.1rem;
            }
            .w3-grid{
              grid-template-columns: 1fr;
              gap: 2.25rem;
              justify-items: center;
            }
            .w3-item{
              width: 100%;
              max-width: 560px;
            }
          }
          @media (max-width: 480px){
            .hero{
              padding: 6.25rem 0 2.5rem;
            }
            .hero-title{
              font-size: 2.5rem;
            }
            .hero-sub{
              font-size: 1.02rem;
            }
            .hero-sub2{
              font-size: .98rem;
            }
            .hero-illus{
              width: min(340px, 100%);
              height: auto;
            }
          }
          @media (max-width: 820px){
            /* Hide the big hero illustration (yellow circle + ZEN) on mobile only */
            .hero-visual{ display: none; }
          }
          @media (max-width: 1020px){
            .stats{ grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
    </>
  );
}



