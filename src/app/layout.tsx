
"use client";

import type { Metadata } from 'next';
import { UserProvider } from '@/context/UserContext';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { BackgroundProvider, useBackground } from '@/context/BackgroundContext';

/*
export const metadata: Metadata = {
  title: 'Public Chat',
  description: 'A modern real-time chat application.',
};
*/

function AppBody({ children }: { children: React.ReactNode }) {
  const { background } = useBackground();
  
  return (
    <body className={cn('font-body antialiased', `bg-${background}`)}>
      <UserProvider>
        {children}
        <Toaster />
      </UserProvider>
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Public Chat</title>
        <meta name="description" content="A modern real-time chat application." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <BackgroundProvider>
        <AppBody>{children}</AppBody>
      </BackgroundProvider>
    </html>
  );
}
