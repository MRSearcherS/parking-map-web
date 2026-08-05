import type { Metadata } from 'next';
import './globals.css';
import AuthRecoveryRedirect from '@/components/AuthRecoveryRedirect';

export const metadata: Metadata = {
  title: 'Бесплатные парковки',
  description: 'Карта бесплатных парковок с платным доступом к точным местам.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthRecoveryRedirect />
        {children}
      </body>
    </html>
  );
}
