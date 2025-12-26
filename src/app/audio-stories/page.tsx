'use client';

import React, { useState, useRef, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import AuthHeader from '@/components/AuthHeader';
import EntryModal from '@/components/EntryModal';
import { Headphones, Play, Pause } from 'lucide-react';
import { findAllStoryURLs } from '@/lib/findStory';

/* ==================================================================== */
/*                               PAGE                                   */
/* ==================================================================== */
export default function AudioStoriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'signup' | 'login'>('login');
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const [stories, setStories] = useState([
    {
      id: 1,
      title: 'First Meeting',
      description: 'The story of how two people first crossed paths and began their journey together.',
      duration: '0:00',
      audioUrl: null as string | null,
    },
    {
      id: 2,
      title: 'Growing Together',
      description: 'A tale of shared experiences and personal growth between two souls.',
      duration: '0:00',
      audioUrl: null as string | null,
    },
    {
      id: 3,
      title: 'Moments of Connection',
      description: 'Exploring the small moments that create deep bonds between two people.',
      duration: '0:00',
      audioUrl: null as string | null,
    },
    {
      id: 4,
      title: "Life's Journey",
      description: 'The ups and downs of life as experienced by two people walking together.',
      duration: '0:00',
      audioUrl: null as string | null,
    },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const storyURLs = await findAllStoryURLs();
        setStories((prevStories) =>
          prevStories.map((story) => {
            const found = storyURLs.find((s) => s.id === story.id);
            return { ...story, audioUrl: found?.url || null };
          }),
        );
      } catch {
        // ignore
      }
    })();
  }, []);

  const handlePlay = (storyId: number) => {
    const story = stories.find((s) => s.id === storyId);
    if (!story || !story.audioUrl) return;

    if (selectedStory === storyId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (selectedStory !== storyId) {
      setSelectedStory(storyId);
      if (audioRef.current) {
        audioRef.current.src = story.audioUrl;
        audioRef.current.load();
      }
    }

    audioRef.current
      ?.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedStory) return;

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        setStories((prevStories) =>
          prevStories.map((story) => (story.id === selectedStory ? { ...story, duration: durationStr } : story)),
        );
      }
    };

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [selectedStory]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Audio Stories - CalmPulseDaily',
            description: 'Listen to audio stories.',
            url: 'https://www.calmpulsedaily.com/audio-stories',
          }),
        }}
      />

      <AuthHeader
        onShowModal={(m) => {
          setModalMode(m);
          setShowModal(true);
        }}
      />
      {showModal && <EntryModal mode={modalMode} onClose={() => setShowModal(false)} />}

      <main
        className="stories-main"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #fafafa 0%, #f9f9f9 100%)',
          fontFamily: 'Poppins',
          padding: '7rem 1rem 4rem',
        }}
      >
        <div className="stories-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.6rem', marginBottom: '.4rem' }}>Audio Stories</h1>
          <p style={{ fontSize: '1.05rem', color: '#555', maxWidth: '600px', margin: '0 auto' }}>
            Listen to stories about life between two people.
          </p>
        </div>

        <div
          className="stories-grid"
          style={{
            maxWidth: '1050px',
            margin: '0 auto',
            display: 'grid',
            gap: '2rem',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {stories.map((story, index) => {
            const isSelected = selectedStory === story.id;
            const isCurrentPlaying = isSelected && isPlaying;
            return (
              <StoryCard key={story.id} className={`story-card story-card-${index}`}>
                <div
                  style={{
                    width: '100%',
                    height: '180px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.2rem',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  }}
                >
                  <Headphones
                    size={64}
                    stroke="#fff"
                    fill="rgba(255,255,255,0.2)"
                    style={{
                      transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      transform: isCurrentPlaying ? 'scale(1.1)' : 'scale(1)',
                    }}
                  />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '.5rem' }}>{story.title}</h3>
                <p style={{ fontSize: '.95rem', lineHeight: 1.6, color: '#555', marginBottom: '1rem' }}>
                  {story.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <button
                    onClick={() => (story.audioUrl ? handlePlay(story.id) : undefined)}
                    disabled={!story.audioUrl}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.5rem',
                      padding: '.6rem 1.2rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: story.audioUrl ? (isCurrentPlaying ? '#FB923C' : '#667eea') : '#d1d5db',
                      color: '#fff',
                      fontSize: '.9rem',
                      fontWeight: 500,
                      cursor: story.audioUrl ? 'pointer' : 'not-allowed',
                      transition: 'all .3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      transform: 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (story.audioUrl) e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    onMouseDown={(e) => {
                      if (story.audioUrl) e.currentTarget.style.transform = 'scale(0.95)';
                    }}
                    onMouseUp={(e) => {
                      if (story.audioUrl) e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                  >
                    {isCurrentPlaying ? (
                      <>
                        <Pause size={18} />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play size={18} />
                        Play
                      </>
                    )}
                  </button>
                  <span style={{ fontSize: '.85rem', color: '#888' }}>{story.duration}</span>
                </div>
              </StoryCard>
            );
          })}
        </div>

        <footer style={{ marginTop: '5rem', textAlign: 'center', fontSize: '.9rem', color: '#777' }}>
          CalmPulseDaily © {new Date().getFullYear()}
        </footer>
      </main>

      <audio ref={audioRef} preload="none" />

      <style jsx>{`
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
        .stories-main {
          position: relative;
        }
        .stories-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .stories-header {
          position: relative;
          z-index: 1;
          opacity: 0;
          animation: fadeInUp 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s forwards;
        }
        .stories-grid {
          position: relative;
          z-index: 1;
        }
        .story-card {
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .story-card-0 {
          animation-delay: 0.1s;
        }
        .story-card-1 {
          animation-delay: 0.2s;
        }
        .story-card-2 {
          animation-delay: 0.3s;
        }
        .story-card-3 {
          animation-delay: 0.4s;
        }
      `}</style>
    </>
  );
}

const StoryCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={className}
    style={{
      background: '#fff',
      borderRadius: '18px',
      padding: '1.5rem',
      boxShadow: '0 2px 6px rgba(0,0,0,.05)',
      transition: 'all .3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,.05)';
    }}
  >
    {children}
  </div>
);







