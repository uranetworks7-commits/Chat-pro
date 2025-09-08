
"use client";

import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';

export default function ChatInterface() {
  return (
    <div className="h-screen w-full max-w-4xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl border">
      <Header />
      <div className="flex-1 flex flex-col chat-bg min-h-0">
        <MessageList isPrivateChat={false} />
        <TypingIndicator />
      </div>
      <MessageInput />
    </div>
  );
}
