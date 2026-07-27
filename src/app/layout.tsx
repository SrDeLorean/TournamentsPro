import type { Metadata, Viewport } from 'next';
import { Outfit, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TorneosPro | Plataforma eSports Multijuego & Multiorganización',
  description: 'Gestiona torneos, ligas, estadísticas avanzadas y mercado de fichajes para EA FC, Valorant, Rocket League y más.',
  keywords: ['esports', 'torneos', 'EA FC', 'valorant', 'cs2', 'league of legends', 'rocket league'],
  authors: [{ name: 'TournamentsPro' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E2E8F0' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased flex flex-col min-h-screen">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AppLayoutWrapper>{children}</AppLayoutWrapper>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
