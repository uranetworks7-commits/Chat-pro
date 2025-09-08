"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import SplashScreen from '@/components/chat/SplashScreen';
import SetupName from '@/components/chat/SetupName';
import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  const { user, loading, setUser } = useUser();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash || loading) {
    return <SplashScreen />;
  }

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      {!user?.customName ? <SetupName /> : <ChatInterface />}
    </main>
  );
}
