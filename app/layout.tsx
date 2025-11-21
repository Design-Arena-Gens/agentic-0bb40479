import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ruthless Mentor',
  description: 'Brutally honest idea evaluator. If it\'s trash, we\'ll say it.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
