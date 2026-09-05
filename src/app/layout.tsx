import type { Metadata, Viewport } from 'next';
import { Outfit, Inter, JetBrains_Mono, Plus_Jakarta_Sans, Sora, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LanguageProvider } from '@/components/providers/language-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { DesignProvider } from '@/components/providers/design-provider';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';
import { ChunkErrorHandler } from '@/components/providers/chunk-error-handler';

// Hostinger hCDN respects the one-year s-maxage emitted for prerendered HTML.
// A dynamic shell keeps HTML aligned with the currently running standalone build;
// hashed CSS and JavaScript remain immutable and cacheable for one year.
export const dynamic = 'force-dynamic';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
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

const fontInitScript = `
  (function() {
    try {
      var raw = localStorage.getItem('tournamentspro:design:v4');
      if (raw) {
        var parsed = JSON.parse(raw);
        var fontMap = {
          'outfit': 'var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
          'jakarta': 'var(--font-jakarta), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
          'sora': 'var(--font-sora), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
          'space-grotesk': 'var(--font-space-grotesk), var(--font-outfit), ui-sans-serif, system-ui, sans-serif',
          'inter': 'var(--font-inter), ui-sans-serif, system-ui, sans-serif'
        };
        if (parsed && parsed.font && fontMap[parsed.font]) {
          document.documentElement.style.setProperty('--font-sans', fontMap[parsed.font]);
          document.documentElement.style.setProperty('--font-active', fontMap[parsed.font]);
          document.documentElement.dataset.uiFont = parsed.font;
        }
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${outfit.variable} ${plusJakarta.variable} ${sora.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: fontInitScript }} />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <ChunkErrorHandler />
        <ThemeProvider>
          <DesignProvider>
            <LanguageProvider>
              <AuthProvider>
                <AppLayoutWrapper>{children}</AppLayoutWrapper>
              </AuthProvider>
            </LanguageProvider>
          </DesignProvider>
        </ThemeProvider>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
