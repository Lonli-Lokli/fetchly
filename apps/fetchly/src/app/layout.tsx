import type { Metadata } from 'next';
import './global.css';

export const metadata: Metadata = {
  title: 'Fetchly',
  description: 'Fast and simple data delivery.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
