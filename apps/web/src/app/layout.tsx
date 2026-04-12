import type { Metadata } from 'next';
import { Fraunces, Manrope } from 'next/font/google';

import { AppProviders } from '@/components/providers/app-providers';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
});

export const metadata: Metadata = {
  title: 'Scalable Real-Time Chat System',
  description: 'Portfolio-grade real-time messaging system demonstrating scalable system design.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="font-sans text-white antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
