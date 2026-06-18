import './globals.css';

import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter } from 'next/font/google';

import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'VITAL Lab Partner',
  description: 'VITAL lab partner portal — appointments and result uploads',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
