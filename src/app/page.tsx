"use client";

import { useUser } from '@/context/UserContext';
import SetupName from '@/components/chat/SetupName';
import ChatInterface from '@/components/chat/ChatInterface';

export default function Home() {
  const { user, loading } = useUser();

  if (loading) {
    return null; // Or a minimal loader, but this makes it faster
  }

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      {!user?.customName ? <SetupName /> : <ChatInterface />}
    </main>
  );
}
