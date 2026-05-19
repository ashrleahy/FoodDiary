import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['300', '400', '500', '600', '700'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'CalTracker',
  description: 'Track your meals, drinks and calories with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
