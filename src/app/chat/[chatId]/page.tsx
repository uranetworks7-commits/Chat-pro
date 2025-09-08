
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import type { UserData } from '@/lib/types';
import SplashScreen from '@/components/chat/SplashScreen';
import { useBackground } from '@/context/BackgroundContext';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  otherUser: UserData | null;
}

function ChatHeader({ otherUser }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-2 border-b bg-card/80">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push('/')} className="p-2 h-auto">
          <ArrowLeft className="h-5 w-5" />
          <span className="ml-2 font-semibold hidden sm:inline text-sm">Private Message</span>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        {otherUser ? (
          <>
            <h1 className="text-lg font-bold text-right">{otherUser.customName}</h1>
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.profileImageUrl} />
              <AvatarFallback>{otherUser.customName.charAt(0)}</AvatarFallback>
            </Avatar>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-5 w-28 bg-muted rounded-md animate-pulse" />
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </header>
  );
}


export default function PrivateChatPage() {
  const { chatId } = useParams() as { chatId: string };
  const { user, loading } = useUser();
  const [otherUser, setOtherUser] = useState<UserData | null>(null);
  const { background } = useBackground();
  
  useEffect(() => {
    if (!chatId || !user) return;

    const participantIds = chatId.split('_');
    const otherUserId = participantIds.find(id => id !== user.username);
    
    if (!otherUserId) return;

    const otherUserRef = ref(db, `users/${otherUserId}`);
    
    const listener = onValue(otherUserRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setOtherUser({ ...userData, username: otherUserId });
      }
    });

    return () => off(otherUserRef, 'value', listener);

  }, [chatId, user]);


  useEffect(() => {
    document.title = 'Private Chat';
    // Cleanup function to reset title
    return () => {
        document.title = 'Public Chat';
    };
  }, []);


  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    // This should ideally redirect to login
    return <SplashScreen />;
  }

  return (
    <main className="h-[100vh] w-screen flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="h-full w-full max-w-6xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl border">
            <ChatHeader otherUser={otherUser} />
            <div className={cn("flex-1 flex flex-col chat-bg min-h-0", background)}>
                <MessageList chatId={chatId} isPrivateChat={true} otherUserName={otherUser?.customName} />
                <MessageInput chatId={chatId} />
                <TypingIndicator chatId={chatId} />
            </div>
        </div>
    </main>
  );
}
