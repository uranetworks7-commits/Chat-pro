
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, MicOff, CornerUpLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref as dbRef, push, set, serverTimestamp, onDisconnect, remove, get, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { UserData, Message } from '@/lib/types';

interface MessageInputProps {
  chatId?: string; // Optional: for private chats
  replyTo?: Message | null;
  onCancelReply: () => void;
}

const MessageInput = React.forwardRef<HTMLTextAreaElement, MessageInputProps>(
    ({ chatId, replyTo, onCancelReply }, fowardedRef) => {
  const [text, setText] = useState('');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const typingRef = useRef<any>(null);
  const typingStatusRef = user ? dbRef(db, `typing/${chatId || 'public'}/${user.username}`) : null;
  const internalRef = useRef<HTMLTextAreaElement>(null);

  const ref = (fowardedRef || internalRef) as React.RefObject<HTMLTextAreaElement>;

  const isBlocked = user?.isBlocked && user.blockExpires && user.blockExpires > Date.now();

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

  const handleTextChange = (newText: string) => {
      setText(newText);
      if (!isSendingMedia) {
        handleTyping(true);
      }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!user || !typingStatusRef || isSendingMedia) return;
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
    if (isBlocked) {
        toast({
            title: "You are blocked",
            description: `You cannot send messages at this time.`,
            variant: "destructive",
        });
        return;
    }

    try {
      const messagesRef = dbRef(db, chatId ? `private_chats/${chatId}/messages` : 'public_chat');
      const messagePayload: any = {
        senderId: user.username,
        senderName: user.customName,
        senderProfileUrl: user.profileImageUrl || '',
        role: user.role,
        timestamp: serverTimestamp(),
      };

      if (replyTo) {
        messagePayload.replyTo = {
            messageId: replyTo.id,
            senderName: replyTo.senderName,
            text: replyTo.text,
        };
        if (replyTo.imageUrl) {
            messagePayload.replyTo.imageUrl = replyTo.imageUrl;
        }
      }

      if (isSendingMedia) {
        messagePayload.imageUrl = messageText;
      } else {
        messagePayload.text = messageText;
      }
      
      const newMessageRef = await push(messagesRef, messagePayload);
      
      if (chatId) {
        try {
            const chatMetadataRef = dbRef(db, `private_chats/${chatId}/metadata`);
            const participantIds = chatId.split('_');
            
            const otherParticipantId = participantIds.find(id => id !== user.username);

            if (otherParticipantId) {
                const otherUserRef = dbRef(db, `users/${otherParticipantId}`);
                const currentUserRef = dbRef(db, `users/${user.username}`);
                
                const [otherUserSnap, currentUserSnap] = await Promise.all([get(otherUserRef), get(currentUserRef)]);

                if(otherUserSnap.exists() && currentUserSnap.exists()){
                    const otherUser = { ...otherUserSnap.val(), username: otherParticipantId } as UserData;
                    const currentUser = { ...currentUserSnap.val(), username: user.username } as UserData;

                    const metadataUpdate: any = {
                        lastMessage: isSendingMedia ? 'Media' : messageText,
                        timestamp: serverTimestamp(),
                        participants: {
                            [currentUser.username]: {
                                customName: currentUser.customName,
                                profileImageUrl: currentUser.profileImageUrl || ''
                            },
                            [otherUser.username]: {
                                customName: otherUser.customName,
                                profileImageUrl: otherUser.profileImageUrl || ''
                            }
                        }
                    };
                    await update(chatMetadataRef, metadataUpdate);
                }
            }
        } catch (metadataError) {
            console.error('Failed to update private chat metadata, but message was sent:', metadataError);
        }
      }

      setText('');
      if(isSendingMedia) setIsSendingMedia(false);
      handleTyping(false);
      if (replyTo) onCancelReply();


    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  const toggleMediaMode = () => {
    setIsSendingMedia(!isSendingMedia);
    setText('');
    ref.current?.focus();
  }
  
  const getPlaceholder = () => {
    if (isBlocked) return "You are blocked and cannot send messages.";
    if (replyTo) return `Replying to ${replyTo.senderName}...`;
    if (isSendingMedia) return "Enter your media URL...";
    return "Type your message...";
  }

  const focusInput = () => {
    ref.current?.focus();
  };

  return (
    <div className="px-2 pb-2 pt-1">
      {replyTo && (
        <div className="flex items-center justify-between p-2 rounded-t-md bg-secondary text-sm mb-1">
            <div className="flex items-center gap-2 overflow-hidden">
                <CornerUpLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate">{replyTo.senderName}</p>
                    <p className="text-muted-foreground truncate">{replyTo.text || "Media"}</p>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancelReply}>
                <X className="h-4 w-4" />
            </Button>
        </div>
      )}
      <div 
        className="flex items-end gap-2 bg-background p-1.5 rounded-lg border"
        onClick={focusInput}
        >
        <Button variant="ghost" size="icon" onClick={toggleMediaMode} disabled={isBlocked} className="h-8 w-8 flex-shrink-0">
            {isSendingMedia ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        <Textarea
          ref={ref}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={getPlaceholder()}
          className={cn(
            "flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base min-h-0 p-0",
            isBlocked ? "pl-2 text-destructive placeholder:text-destructive/80" : ""
          )}
          disabled={isBlocked}
          rows={1}
        />
        <Button size="icon" onClick={handleSendMessage} disabled={!text.trim() || isBlocked} className="h-8 w-8 flex-shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

MessageInput.displayName = "MessageInput";
export default MessageInput;
