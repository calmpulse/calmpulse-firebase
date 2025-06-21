'use client';
import { useEffect, useRef } from 'react';

export default function EntryModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleJustPlay = () => {
    localStorage.setItem('cp_seen', 'yes');
    onClose();
  };

  useEffect(() => {
    // Focus management
    const firstButton = modalRef.current?.querySelector('button');
    (firstButton as HTMLElement)?.focus();

    // Escape key handler
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleJustPlay();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleJustPlay]); // ✅ Include dependency here

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleJustPlay();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm px-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl"
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg"></div>
        </div>

        <h2 id="modal-title" className="text-3xl font-bold text-center mb-4">
          Welcome to CalmPulse
        </h2>
        
        <p className="text-center text-gray-600 mb-8 text-lg">
          Track your meditation journey<br />or start today&apos;s session.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => alert('Subscribe feature coming soon')}
            className="w-full py-3 text-lg border-2 border-gray-300 rounded-full hover:border-gray-400 transition-colors"
          >
            Subscribe
          </button>
          
          <button
            onClick={() => alert('Login feature coming soon')}
            className="w-full py-3 text-lg border-2 border-gray-300 rounded-full hover:border-gray-400 transition-colors"
          >
            Log in
          </button>
          
          <button
            onClick={handleJustPlay}
            className="w-full py-3 text-lg bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
          >
            Just Play
          </button>
        </div>
      </div>
    </div>
  );
}

