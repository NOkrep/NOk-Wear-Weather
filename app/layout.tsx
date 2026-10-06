import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Weathrobe - Konum ve Seyahat Bazlı Kıyafet & Hava Durumu Rehberi',
  description: 'Gizlilik odaklı ilçe, şehir ve rota bazlı çok kaynaklı hava durumu tahmini ve dinamik kıyafet tavsiye platformu.',
  openGraph: {
    title: 'Weathrobe - Konum ve Seyahat Bazlı Kıyafet & Hava Durumu Rehberi',
    description: 'Gizlilik odaklı ilçe, şehir ve rota bazlı çok kaynaklı hava durumu tahmini ve dinamik kıyafet tavsiye platformu.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Weathrobe - Konum ve Seyahat Bazlı Kıyafet & Hava Durumu Rehberi',
    description: 'Gizlilik odaklı ilçe, şehir ve rota bazlı çok kaynaklı hava durumu tahmini ve dinamik kıyafet tavsiye platformu.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
