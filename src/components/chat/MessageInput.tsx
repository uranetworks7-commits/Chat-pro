
"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp, onDisconnect, remove, get, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { blockUser } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { blockedWords } from '@/lib/blocked-words';
import type { UserData } from '@/lib/types';


interface MessageInputProps {
  chatId?: string; // Optional: for private chats
}

export default function MessageInput({ chatId }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const typingRef = useRef<any>(null);
  const typingStatusRef = user ? ref(db, `typing/${chatId || 'public'}/${user.username}`) : null;
  const abuseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (abuseTimeoutRef.current) {
        clearTimeout(abuseTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
      setText(newText);
      if (!isSendingMedia) {
        handleTyping(true);
      }

      // If user clears the input, cancel the pending block
      if (newText.trim() === '' && abuseTimeoutRef.current) {
          clearTimeout(abuseTimeoutRef.current);
          abuseTimeoutRef.current = null;
          toast({
              title: "Block Canceled",
              description: "The pending block has been canceled as the message was cleared.",
              className: "bg-green-500 text-white"
          });
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
            description: `You cannot send messages for another ${Math.ceil((user.blockExpires! - Date.now()) / 60000)} minutes.`,
            variant: "destructive",
        });
        return;
    }

    const containsAbusiveWord = blockedWords.some(word => messageText.toLowerCase().includes(word.toLowerCase()));
    if (containsAbusiveWord && !abuseTimeoutRef.current) {
        toast({
            title: "Warning: Inappropriate Language",
            description: "Your message contains blocked words. You will be blocked in 45 seconds. Clear the message to cancel.",
            variant: "destructive",
            duration: 10000,
        });

        abuseTimeoutRef.current = setTimeout(() => {
             if (user) {
                blockUser(user, `URA Firing Squad Blocked ${user.customName}.`);
                toast({
                    title: "You have been blocked",
                    description: "Your account has been blocked for 30 minutes due to inappropriate language.",
                    variant: "destructive",
                });
             }
             abuseTimeoutRef.current = null;
        }, 45000);
    }

    try {
      const messagesRef = ref(db, chatId ? `private_chats/${chatId}/messages` : 'public_chat');
      const messagePayload: any = {
        senderId: user.username,
        senderName: user.customName,
        senderProfileUrl: user.profileImageUrl || '',
        role: user.role,
        timestamp: serverTimestamp(),
      };

      if (isSendingMedia) {
        messagePayload.imageUrl = messageText; // imageUrl is now a generic mediaUrl
      } else {
        messagePayload.text = messageText;
      }
      
      await push(messagesRef, messagePayload);

      if (chatId) {
        const chatMetadataRef = ref(db, `private_chats/${chatId}/metadata`);
        const participantIds = chatId.split('_');
        
        const otherParticipantId = participantIds.find(id => id !== user.username);
        if (otherParticipantId) {
            const otherUserRef = ref(db, `users/${otherParticipantId}`);
            const currentUserRef = ref(db, `users/${user.username}`);
            
            const [otherUserSnap, currentUserSnap] = await Promise.all([get(otherUserRef), get(currentUserRef)]);

            if(otherUserSnap.exists() && currentUserSnap.exists()){
                const otherUser = otherUserSnap.val() as UserData;
                const currentUser = currentUserSnap.val() as UserData;

                messagePayload.role = currentUser.role;

                const metadataUpdate: any = {
                    lastMessage: isSendingMedia ? 'Media' : messageText,
                    timestamp: serverTimestamp(),
                    participants: {
                        [user.username]: {
                            customName: currentUser.customName,
                            profileImageUrl: currentUser.profileImageUrl
                        },
                        [otherParticipantId!]: {
                            customName: otherUser.customName,
                            profileImageUrl: otherUser.profileImageUrl
                        }
                    }
                };
                await update(chatMetadataRef, metadataUpdate);
            }
        }
      }

      setText('');
      if(isSendingMedia) setIsSendingMedia(false);
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

  const toggleMediaMode = () => {
    setIsSendingMedia(!isSendingMedia);
    setText('');
  }
  
  const getPlaceholder = () => {
    if (isBlocked) return "You are blocked and cannot send messages.";
    if (isSendingMedia) return "Enter your media URL...";
    return "Type your message...";
  }

  return (
    <div className="p-2 border-t bg-card/80">
      <div className="relative">
        {isBlocked && <MicOff className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
        <Textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={getPlaceholder()}
          className={cn("pr-20 bg-background", isBlocked ? "pl-9 text-destructive placeholder:text-destructive/80" : "", "h-9 text-xs")}
          disabled={isBlocked}
          rows={1}
        />
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2 flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleMediaMode} disabled={isBlocked} className="h-7 w-7">
            {isSendingMedia ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <Button size="icon" onClick={handleSendMessage} disabled={!text.trim() || isBlocked} className="h-7 w-7">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
