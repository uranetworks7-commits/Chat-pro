
"use client";

import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';
import { useBackground } from '@/context/BackgroundContext';
import { cn } from '@/lib/utils';

export default function ChatInterface() {
  const { background } = useBackground();
  return (
    <div className="h-[100vh] w-full max-w-6xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl border mx-auto">
      <Header />
      <div className={cn("flex-1 flex flex-col chat-bg min-h-0", background)}>
        <MessageList isPrivateChat={false} />
        <MessageInput />
        <TypingIndicator />
      </div>
    </div>
  );
}
