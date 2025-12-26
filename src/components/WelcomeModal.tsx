'use client';

import { useState, useEffect, useRef } from 'react';

export default function WelcomeModal({
  onSubscribe,
  onLogin,
  onContinue,
}: {
  onSubscribe: () => void;
  onLogin: () => void;
  onContinue: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onContinue();
    }, 300);
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: isVisible ? 'rgba(0,0,0,.4)' : 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        transition: 'background .4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
      }}
    >
      <div
        ref={modalRef}
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 18,
          width: '94%',
          maxWidth: 380,
          padding: '2rem 1.7rem 1.3rem',
          boxShadow: isVisible ? '0 20px 60px rgba(0,0,0,.15)' : '0 10px 34px rgba(0,0,0,.1)',
          position: 'relative',
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
          opacity: isVisible ? 1 : 0,
          transition: 'all .5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* × close */}
        <button
          aria-label="Close"
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'none',
            border: 0,
            fontSize: 24,
            color: '#888',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.color = '#111';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#888';
          }}
        >
          ×
        </button>

        {/* Title */}
        <h2 style={{ fontWeight: 700, fontSize: '1.45rem', textAlign: 'center', marginBottom: 22, color: '#111' }}>
          CalmPulseDaily
        </h2>

        {/* Description */}
        <p
          style={{
            fontSize: '0.95rem',
            color: '#666',
            lineHeight: 1.6,
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          Create a free account to save your meditation stats anywhere — and never lose your streak.
        </p>

        {/* Buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          <button
            onClick={onSubscribe}
            style={{
              width: '100%',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '.7rem 0',
              fontWeight: 500,
              fontSize: '1rem',
              background: 'transparent',
              color: '#111',
              cursor: 'pointer',
              transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#111';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Subscribe
          </button>

          <button
            onClick={onLogin}
            style={{
              width: '100%',
              border: '1.5px solid #111',
              borderRadius: 8,
              padding: '.7rem 0',
              fontWeight: 500,
              fontSize: '1rem',
              background: 'transparent',
              color: '#111',
              cursor: 'pointer',
              transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#111';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Log in
          </button>

          <button
            onClick={handleClose}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 8,
              padding: '.7rem 0',
              fontWeight: 500,
              fontSize: '1rem',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#111';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Start your session
          </button>
        </div>
      </div>
    </div>
  );
}

