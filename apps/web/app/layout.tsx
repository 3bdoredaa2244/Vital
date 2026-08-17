import './globals.css';

import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';

import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/lib/auth';

// The same two families the mobile app loads (display + body), so headings and
// copy render identically across clients.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VITAL — Preventive Health Intelligence',
  description: 'Know your body. Before it fails you.',
  icons: { icon: '/favicon.png' },
};

export const viewport: Viewport = {
  themeColor: '#FBF6EC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
