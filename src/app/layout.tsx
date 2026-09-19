import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/components/providers';
import { PwaRegister } from '@/components/PwaRegister';

// UI text.
const instrument = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
});

// Headings and headline figures.
const grotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-grotesk',
});

export const metadata: Metadata = {
  title: 'FinanceFlow',
  description: 'A comprehensive personal finance app for budgeting and expense tracking.',
  applicationName: 'FinanceFlow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FinanceFlow',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${instrument.variable} ${grotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
