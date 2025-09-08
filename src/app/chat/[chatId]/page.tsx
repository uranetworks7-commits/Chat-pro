
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import type { UserData } from '@/lib/types';
import SplashScreen from '@/components/chat/SplashScreen';

interface ChatHeaderProps {
  otherUser: UserData | null;
}

function ChatHeader({ otherUser }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card/80">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        {otherUser ? (
          <>
            <Avatar>
              <AvatarImage src={otherUser.profileImageUrl} />
              <AvatarFallback>{otherUser.customName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold">{otherUser.customName}</h1>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
            <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
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
    if (user && otherUser) {
      document.title = `Chat between ${user.customName} and ${otherUser.customName}`;
    } else {
      document.title = 'Private Chat';
    }
    // Cleanup function to reset title
    return () => {
        document.title = 'Public Chat';
    };
  }, [user, otherUser]);


  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    // This should ideally redirect to login
    return <SplashScreen />;
  }

  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="h-full w-full max-w-4xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl rounded-lg overflow-hidden border">
            <ChatHeader otherUser={otherUser} />
            <div className="flex-1 flex flex-col chat-bg overflow-hidden">
                <div className="flex-1 flex flex-col min-h-0">
                    <MessageList chatId={chatId} isPrivateChat={true} />
                    <TypingIndicator chatId={chatId} />
                </div>
            </div>
            <MessageInput chatId={chatId} />
        </div>
    </main>
  );
}
