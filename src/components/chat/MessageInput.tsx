
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

    const containsAbusiveWord = blockedWords.some(word => messageText.toLowerCase().includes(word.toLowerCase()));
    if (containsAbusiveWord) {
        toast({
            title: "Warning: Inappropriate Language",
            description: "Your message contains blocked words. Further violations may result in a ban.",
            variant: "destructive",
        });
        // Block after 45 seconds, but don't tell the user the time
        setTimeout(() => {
            if (user) {
                blockUser(user, `URA Firing Squad Blocked ${user.customName}.`);
            }
        }, 45 * 1000);
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
        // Wrap metadata update in its own try/catch to suppress errors
        try {
            const chatMetadataRef = ref(db, `private_chats/${chatId}/metadata`);
            const participantIds = chatId.split('_');
            
            const otherParticipantId = participantIds.find(id => id !== user.username);

            if (otherParticipantId) {
                const otherUserRef = ref(db, `users/${otherParticipantId}`);
                const currentUserRef = ref(db, `users/${user.username}`);
                
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
            // This catch block is intentionally left empty to suppress the toast.
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
