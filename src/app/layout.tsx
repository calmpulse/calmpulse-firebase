import './globals.css';
import React from 'react';
import Script from 'next/script';
import type { Metadata } from 'next';

const siteUrl = 'https://www.calmpulsedaily.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CalmPulseDaily - Free Daily Meditation & Mindfulness App',
    template: '%s | CalmPulseDaily',
  },
  description: 'Free daily meditation app for mindfulness and relaxation. 15-minute guided meditation sessions to reduce anxiety, improve sleep, and build a daily meditation streak. Start your journey to inner calm today.',
  keywords: [
    'meditation',
    'mindfulness',
    'daily meditation',
    'guided meditation',
    'meditation app',
    'free meditation',
    'anxiety relief',
    'stress relief',
    'sleep meditation',
    'meditation streak',
    'calm',
    'relaxation',
    'mental health',
    'wellness',
    'self-care',
  ],
  authors: [{ name: 'CalmPulse' }],
  creator: 'CalmPulse',
  publisher: 'CalmPulse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'CalmPulseDaily',
    title: 'CalmPulseDaily - Free Daily Meditation & Mindfulness App',
    description: 'Free daily meditation app for mindfulness and relaxation. 15-minute guided meditation sessions to reduce anxiety, improve sleep, and build a daily meditation streak.',
    images: [
      {
        url: `${siteUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: 'CalmPulseDaily - Meditation App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CalmPulseDaily - Free Daily Meditation & Mindfulness App',
    description: 'Free daily meditation app for mindfulness and relaxation. 15-minute guided meditation sessions.',
    images: [`${siteUrl}/logo.svg`],
    creator: '@calmpulse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'Health & Wellness',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Pre-connect to Firebase CDNs for faster initial auth requests */}
        <link rel="preconnect" href="https://www.gstatic.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        
        {/* Critical CSS to prevent layout shift */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical styles for hero section - prevents FOUC */
            .hero,
            section.hero {
              min-height: 100vh !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 8rem 1rem 4rem !important;
            }
            .hero-content,
            .hero-content > * {
              text-align: center !important;
              width: 100% !important;
              max-width: 100% !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
            }
            .hero h1,
            .hero .tagline,
            .hero .ring,
            .hero .controls {
              text-align: center !important;
              margin-left: auto !important;
              margin-right: auto !important;
            }
            .logo-wrapper {
              display: inline-block !important;
              margin: 0 auto !important;
            }
            .features {
              text-align: center !important;
              width: 100% !important;
            }
          `
        }} />
      </head>

      <body>
        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'CalmPulseDaily',
              url: siteUrl,
              logo: `${siteUrl}/logo.svg`,
              description: 'Free daily meditation app for mindfulness and relaxation',
              sameAs: [
                'https://www.buymeacoffee.com/calmpulse',
              ],
            }),
          }}
        />
        
        {/* Structured Data - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'CalmPulseDaily',
              applicationCategory: 'HealthApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '100',
              },
            }),
          }}
        />
        
        {children}

        {/* Buy-Me-a-Coffee script */}
        <Script
          src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"
          strategy="afterInteractive"
          data-name="bmc-button"
          data-slug="calmpulse"
          data-color="#FFDD00"
          data-emoji=""
          data-font="Poppins"
          data-text="Buy me a coffee"
          data-outline-color="#000000"
          data-font-color="#000000"
          data-coffee-color="#ffffff"
        />
      </body>
    </html>
  );
}
