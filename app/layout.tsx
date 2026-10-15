import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n';

export const viewport: Viewport = {
  themeColor: '#0284c7',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'Wear Weather (by NOk) — Akıllı Gardırop & Rota Asistanı',
  description:
    'Gizlilik odaklı, çok kaynaklı hava durumu konsensüsü, çok duraklı rota planlayıcı ve ülke alım gücüne duyarlı akıllı giyim uygulaması.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wear Weather',
  },
  openGraph: {
    title: 'Wear Weather - by NOk',
    description:
      'Gizlilik odaklı, çok kaynaklı hava durumu konsensüsü ve renk/kumaş uyumlu akıllı giyim rehberi.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body suppressHydrationWarning><LanguageProvider>{children}</LanguageProvider></body>
    </html>
  );
}
