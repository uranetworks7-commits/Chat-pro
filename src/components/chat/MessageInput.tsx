"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp, onDisconnect, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

export default function MessageInput() {
  const [text, setText] = useState('');
  const { user } = useUser();
  const { toast } = useToast();
  const typingRef = useRef<any>(null);
  const typingStatusRef = user ? ref(db, `typing/${user.username}`) : null;

  useEffect(() => {
    if (typingStatusRef) {
      const onDisconnectRef = onDisconnect(typingStatusRef);
      onDisconnectRef.remove();
    }
    return () => {
        if (typingStatusRef) {
            remove(typingStatusRef);
        }
    }
  }, [typingStatusRef]);

  const handleTyping = (isTyping: boolean) => {
    if (!user || !typingStatusRef) return;
    if (isTyping) {
      set(typingStatusRef, { name: user.customName });
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => {
        handleTyping(false);
      }, 3000);
    } else {
      remove(typingStatusRef);
      clearTimeout(typingRef.current);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim() || !user) return;
    if (user.isBlocked && user.blockExpires && user.blockExpires > Date.now()) {
        toast({
            title: "You are blocked",
            description: `You cannot send messages for another ${Math.ceil((user.blockExpires - Date.now()) / 60000)} minutes.`,
            variant: "destructive",
        });
        return;
    }
    try {
      const messagesRef = ref(db, 'public_chat');
      await push(messagesRef, {
        text: text,
        senderId: user.username,
        senderName: user.customName,
        senderProfileUrl: user.profileImageUrl,
        role: user.role,
        timestamp: serverTimestamp(),
      });
      setText('');
      handleTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };
  
  const handleImageSend = () => {
    const imageUrl = prompt("Please enter the image URL:");
    if (!imageUrl || !user) return;

    try {
        const messagesRef = ref(db, 'public_chat');
        push(messagesRef, {
            imageUrl: imageUrl,
            senderId: user.username,
            senderName: user.customName,
            senderProfileUrl: user.profileImageUrl,
            role: user.role,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error sending image:', error);
        toast({
            title: "Error",
            description: "Failed to send image.",
            variant: "destructive",
        });
    }
  };

  return (
    <div className="p-4 border-t bg-card/80">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            handleTyping(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Type your message... (Shift+Enter for new line)"
          className="pr-24 rounded-full bg-background"
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleImageSend}>
            <ImagePlus className="h-5 w-5" />
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!text.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
