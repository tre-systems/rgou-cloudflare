import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import NetworkStatus from '@/components/NetworkStatus';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Royal Game of Ur',
  description:
    'Play the ancient Mesopotamian board game dating back 4,500 years. Race your pieces around the board and challenge an AI opponent in this historic strategy game.',
  keywords: [
    'board game',
    'ancient game',
    'mesopotamian',
    'strategy',
    'AI',
    'Royal Game of Ur',
    'PWA',
    'offline game',
  ],
  authors: [{ name: 'Royal Game of Ur Project' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'rgou',
  },
  applicationName: 'rgou',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'rgou',
    'msapplication-TileColor': '#1e40af',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e40af',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#1e40af" />

        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              if (document.getElementById('update-banner')) return;
                              const updateBanner = document.createElement('div');
                              updateBanner.id = 'update-banner';
                              updateBanner.innerHTML = '<div style="position:fixed;top:16px;left:50%;transform:translateX(-50%);background:rgba(30,41,59,0.95);color:#fff;padding:10px 20px;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.12);z-index:10000;display:flex;align-items:center;gap:16px;font-family:system-ui;min-width:260px;max-width:90vw;"><span style="font-size:15px;font-weight:500;">A new version is available!</span><button onclick="window.location.reload()" style="background:#38bdf8;color:#fff;border:none;border-radius:8px;padding:6px 16px;font-weight:600;cursor:pointer;font-size:14px;">Update Now</button><button onclick="this.closest(\'#update-banner\').remove()" style="background:none;color:#fff;border:none;font-size:14px;text-decoration:underline;cursor:pointer;padding:6px 8px;">Later</button></div>';
                              document.body.appendChild(updateBanner);
                            }
                          });
                        }
                      });
                      registration.update();
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <PWAInstallPrompt />
        <NetworkStatus />
      </body>
    </html>
  );
}
