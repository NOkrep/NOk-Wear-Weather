import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Wear Weather - by NOk',
  description: 'Gizlilik odaklı, çok kaynaklı hava durumu konsensüsü ve renk/kumaş uyumlu akıllı giyim rehberi.',
  openGraph: {
    title: 'Wear Weather - by NOk',
    description: 'Gizlilik odaklı, çok kaynaklı hava durumu konsensüsü ve renk/kumaş uyumlu akıllı giyim rehberi.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wear Weather - by NOk',
    description: 'Gizlilik odaklı, çok kaynaklı hava durumu konsensüsü ve renk/kumaş uyumlu akıllı giyim rehberi.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
