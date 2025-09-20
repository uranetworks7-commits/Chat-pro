
"use client";

import React from 'react';
import Header from '@/components/chat/Header';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import TypingIndicator from './TypingIndicator';
import { useBackground } from '@/context/BackgroundContext';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/types';

export default function ChatInterface() {
  const { background } = useBackground();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const [replyTo, setReplyTo] = React.useState<Message | null>(null);

  const isUrlBackground = background.startsWith('url(');

  const handleFocusInput = () => {
    inputRef.current?.focus();
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
    handleFocusInput();
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  return (
    <div className="h-[100vh] w-full max-w-6xl flex flex-col bg-card/70 backdrop-blur-md shadow-2xl border mx-auto">
      <Header onFocusInput={handleFocusInput} />
      <div 
        className={cn("flex-1 flex flex-col chat-bg min-h-0", !isUrlBackground && background)}
        style={isUrlBackground ? { backgroundImage: background } : {}}
      >
        <MessageList isPrivateChat={false} onReply={handleReply} />
      </div>
      <div>
        <TypingIndicator />
        <MessageInput ref={inputRef} replyTo={replyTo} onCancelReply={cancelReply} />
      </div>
    </div>
  );
}
