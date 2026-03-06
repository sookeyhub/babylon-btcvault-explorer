import type { Metadata } from 'next';
import { Space_Grotesk, Geist_Mono } from 'next/font/google';
import Header from '@/components/Header';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BTCVault Explorer | Babylon',
  description: 'Explore Bitcoin vaults on Babylon — TVL, vault details, analytics, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} min-h-screen bg-[#faf9f5] font-sans text-[#387085] antialiased`}
      >
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
