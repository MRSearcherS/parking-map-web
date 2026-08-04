import FloatingSuggestParking from '@/components/FloatingSuggestParking';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Бесплатные парковки',
  description: 'Карта бесплатных парковок с платным доступом к точным местам.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}
        <FloatingSuggestParking /></body>
    </html>
  );
}

