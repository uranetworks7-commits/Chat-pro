"use client";

import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from '@/components/chat/TypingIndicator';

export default function ChatInterface() {
  return (
    <div className="h-full w-full max-w-4xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl rounded-lg overflow-hidden border">
      <Header />
      <MessageList />
      <TypingIndicator />
      <MessageInput />
    </div>
  );
}
