import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hackathon Hub — Build Better Teams. Build Bigger Ideas.',
  description:
    'The AI-powered Hackathon Collaboration Platform for Kongu Engineering College. Discover teammates, verify skills, and collaborate to build winning projects.',
  keywords: [
    'hackathon',
    'collaboration',
    'KEC',
    'Kongu Engineering College',
    'teams',
    'AI',
    'skill verification',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
