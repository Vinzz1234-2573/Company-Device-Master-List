import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GamutPro Asset Manager',
  description: 'IT Asset Management System for GamutPro',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
