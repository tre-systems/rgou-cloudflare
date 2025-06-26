import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NetworkStatus from "@/components/NetworkStatus";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Royal Game of Ur - Ancient Board Game",
  description:
    "Play the ancient Mesopotamian board game dating back 4,500 years. Race your pieces around the board and challenge an AI opponent in this historic strategy game.",
  keywords: [
    "board game",
    "ancient game",
    "mesopotamian",
    "strategy",
    "AI",
    "Royal Game of Ur",
    "PWA",
    "offline game",
  ],
  authors: [{ name: "Royal Game of Ur Project" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Royal Game of Ur",
  },
  applicationName: "Royal Game of Ur",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Royal Game of Ur",
    "msapplication-TileColor": "#1e40af",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e40af",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="mask-icon" href="/icons/icon-192x192.png" color="#1e40af" />

        {/* Microsoft Tiles */}
        <meta
          name="msapplication-TileImage"
          content="/icons/icon-144x144.png"
        />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PWAInstallPrompt />
        <NetworkStatus />
      </body>
    </html>
  );
}
