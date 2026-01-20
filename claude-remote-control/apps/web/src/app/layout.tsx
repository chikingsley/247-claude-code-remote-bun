import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Inter, Space_Grotesk } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/Providers';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  // Android: resize content when virtual keyboard appears (instead of panning)
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: '247 - The Vibe Company',
  description: '247 - Web terminal access to Claude Code from anywhere',
  applicationName: '247',
  metadataBase: new URL('https://247.quivr.com'),
  openGraph: {
    title: '247 - The Vibe Company',
    description: 'Web terminal access to Claude Code from anywhere. Control your AI coding sessions remotely.',
    url: 'https://247.quivr.com',
    siteName: '247',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '247 - Web terminal access to Claude Code',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '247 - The Vibe Company',
    description: 'Web terminal access to Claude Code from anywhere. Control your AI coding sessions remotely.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '247',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-screen font-sans antialiased">
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
