
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';

import MessageList from '@/components/chat/MessageList';
import type { UserData, Message } from '@/lib/types';
import SplashScreen from '@/components/chat/SplashScreen';
import { useBackground } from '@/context/BackgroundContext';
import { cn } from '@/lib/utils';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';

interface ChatHeaderProps {
  otherUser: UserData | null;
  onFocusInput?: () => void;
}

function ChatHeader({ otherUser, onFocusInput }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between p-3 border-b bg-card/80">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => router.push('/')} className="p-2 h-auto">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <span className="ml-2 font-semibold hidden sm:inline">Private Message</span>
        {onFocusInput && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFocusInput}>
                <Pencil className="h-4 w-4"/>
            </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        {otherUser ? (
          <>
            <h1 className="text-xl font-bold text-right">{otherUser.customName}</h1>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.profileImageUrl} />
              <AvatarFallback>{otherUser.customName.charAt(0)}</AvatarFallback>
            </Avatar>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 bg-muted rounded-md animate-pulse" />
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
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
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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

  const handleReply = (message: Message) => {
    setReplyTo(message);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleFocusInput = () => {
    inputRef.current?.focus();
  };


  return (
    <main className="h-[100vh] w-screen flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="h-full w-full max-w-6xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl border">
            <ChatHeader otherUser={otherUser} onFocusInput={handleFocusInput} />
            <div className={cn("flex-1 flex flex-col chat-bg min-h-0", background)}>
                <MessageList chatId={chatId} isPrivateChat={true} otherUserName={otherUser?.customName} onReply={handleReply} />
            </div>
            <div className="mb-2">
                <TypingIndicator chatId={chatId} />
                <MessageInput ref={inputRef} chatId={chatId} replyTo={replyTo} onCancelReply={cancelReply} />
            </div>
        </div>
    </main>
  );
}
