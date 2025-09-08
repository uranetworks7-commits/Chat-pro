
"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import SetupName from '@/components/chat/SetupName';
import ChatInterface from '@/components/chat/ChatInterface';
import SplashScreen from '@/components/chat/SplashScreen';

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const [isAppLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 500); // Show splash screen for 0.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (userLoading || isAppLoading) {
    return <SplashScreen />;
  }

  return (
    <main className="bg-background/80 backdrop-blur-sm">
      {!user ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center">
            <SetupName />
        </div>
      ) : <ChatInterface />}
    </main>
  );
}
