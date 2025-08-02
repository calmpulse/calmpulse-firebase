import './globals.css';
import React from 'react';
import Script from 'next/script';


export const metadata = {
  title: 'CalmPulse',
  description: 'Breathe. Relax. Focus.',
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
      </head>

      <body>
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
