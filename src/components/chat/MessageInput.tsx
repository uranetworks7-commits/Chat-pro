"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp, onDisconnect, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { blockUser } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { blockedWords } from '@/lib/blocked-words';

export default function MessageInput() {
  const [text, setText] = useState('');
  const [isSendingImage, setIsSendingImage] = useState(false);
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
    if (!user || !typingStatusRef || isSendingImage) return;
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
    const messageText = text.trim();
    if (!messageText || !user) return;
    if (user.isBlocked && user.blockExpires && user.blockExpires > Date.now()) {
        toast({
            title: "You are blocked",
            description: `You cannot send messages for another ${Math.ceil((user.blockExpires - Date.now()) / 60000)} minutes.`,
            variant: "destructive",
        });
        return;
    }

    const containsAbusiveWord = blockedWords.some(word => messageText.toLowerCase().includes(word.toLowerCase()));
    if (containsAbusiveWord) {
        await blockUser(user, `${user.customName} was blocked by URA Firing Squad for inappropriate language.`);
        toast({
            title: "You have been blocked",
            description: "Your account has been blocked for 30 minutes due to inappropriate language.",
            variant: "destructive",
        });
        setText('');
        handleTyping(false);
        return;
    }

    try {
      const messagesRef = ref(db, 'public_chat');
      const messagePayload: any = {
        senderId: user.username,
        senderName: user.customName,
        senderProfileUrl: user.profileImageUrl,
        role: user.role,
        timestamp: serverTimestamp(),
      };

      if (isSendingImage) {
        messagePayload.imageUrl = messageText;
      } else {
        messagePayload.text = messageText;
      }
      
      await push(messagesRef, messagePayload);

      setText('');
      if(isSendingImage) setIsSendingImage(false);
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

  const toggleImageMode = () => {
    setIsSendingImage(!isSendingImage);
    setText('');
  }

  return (
    <div className="p-4 border-t bg-card/80">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!isSendingImage) {
              handleTyping(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={isSendingImage ? 'Enter your image URL...' : 'Type your message...'}
          className={cn("pr-24 bg-background", "text-base md:text-sm h-12 md:h-auto")}
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleImageMode}>
            {isSendingImage ? <X className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!text.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
