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

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Check for updates
                      registration.addEventListener('updatefound', function() {
                        const newWorker = registration.installing;
                        if (newWorker) {
                          console.log('New service worker found');
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('New version available');
                              
                              // Show update notification
                              const updateBanner = document.createElement('div');
                              updateBanner.innerHTML = \`
                                <div style="position: fixed; top: 0; left: 0; right: 0; background: #1e40af; color: white; padding: 12px; text-align: center; z-index: 10000; font-family: system-ui;">
                                  <span>A new version is available!</span>
                                  <button onclick="window.location.reload()" style="margin-left: 12px; background: white; color: #1e40af; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
                                    Update Now
                                  </button>
                                  <button onclick="this.parentElement.parentElement.remove()" style="margin-left: 8px; background: transparent; color: white; border: 1px solid white; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                                    Later
                                  </button>
                                </div>
                              \`;
                              document.body.appendChild(updateBanner);
                            }
                          });
                        }
                      });
                      
                      // Check for updates immediately
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
