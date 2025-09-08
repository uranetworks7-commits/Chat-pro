
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, remove, update } from 'firebase/database';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import type { Message, UserData } from '@/lib/types';
import MessageComponent from './Message';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReportDialog from './ReportDialog';
import { AnimatePresence, motion } from "framer-motion";
import { blockUser, unblockUser } from '@/lib/utils';
import { get, set as dbSet, serverTimestamp } from 'firebase/database';
import { blockedWords } from '@/lib/blocked-words';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MessageCircle } from 'lucide-react';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { isToday, isYesterday, format, isSameDay } from 'date-fns';
import DateSeparator from './DateSeparator';

interface MessageListProps {
  chatId?: string; // For private chats
  isPrivateChat?: boolean;
  otherUserName?: string;
}

function WelcomeMessage({ otherUserName }: { otherUserName?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-bold">Welcome to your private chat!</h2>
            <p className="text-muted-foreground text-sm">
                You are now in a private conversation with <span className="font-semibold text-foreground">{otherUserName || '...'}</span>.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Messages sent here are only visible to the two of you.</p>
        </div>
    );
}

const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
}


export default function MessageList({ chatId, isPrivateChat, otherUserName }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useUser();
  const { toast } = useToast();
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState<Message | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userInteractedRef = useRef(false);
  const [pendingBlocks, setPendingBlocks] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [messageToWarn, setMessageToWarn] = useState<Message | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const handleNewMessage = useCallback((newMessage: Message) => {
    if (newMessage.senderId !== user?.username && audioRef.current && userInteractedRef.current) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }

    if (newMessage.senderId === user?.username && !isPrivateChat) {
        const messageText = newMessage.text || '';
        const containsAbusiveWord = blockedWords.some(word => messageText.toLowerCase().includes(word.toLowerCase()));
        if (containsAbusiveWord) {
          setMessageToWarn(newMessage);
          toast({
              title: "Inappropriate Language Detected",
              description: "Please delete the message within 45 seconds to avoid a block.",
              variant: "destructive",
          });
        }
    }
  }, [user, isPrivateChat, toast]);


  useEffect(() => {
    audioRef.current = new Audio('https://files.catbox.moe/fwx9jw.mp3');
    
    const handleInteraction = () => {
        userInteractedRef.current = true;
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    const messagesRef = ref(db, chatId ? `private_chats/${chatId}/messages` : 'public_chat');
    
    const listener = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const newMessages: Message[] = data 
          ? Object.entries(data).map(([key, value]) => ({ id: key, ...(value as Omit<Message, 'id'>) }))
          : [];
      
      newMessages.sort((a, b) => a.timestamp - b.timestamp);

      setMessages((prevMessages) => {
        if (newMessages.length > prevMessages.length) {
            const lastMessage = newMessages[newMessages.length - 1];
            handleNewMessage(lastMessage);
        }
        return newMessages;
      });
    });

    return () => {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        off(messagesRef, 'value', listener);
        // Clear all pending timeouts on component unmount
        pendingBlocks.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [chatId, handleNewMessage, pendingBlocks]);

  useEffect(() => {
      if (messageToWarn && user) {
          const senderId = messageToWarn.senderId;
          const userToBlockRef = ref(db, `users/${senderId}`);
          
          const timeoutId = setTimeout(async () => {
              const snapshot = await get(userToBlockRef);
              if (snapshot.exists()) {
                  const userToBlockData = snapshot.val() as UserData;
                  const userToBlock = { ...userToBlockData, username: senderId };
                  blockUser(userToBlock, `URA Firing Squad Blocked ${userToBlock.customName}.`);
                  setPendingBlocks(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(messageToWarn.id);
                      return newMap;
                  });
              }
          }, 45 * 1000);
          
          setPendingBlocks(prev => new Map(prev).set(messageToWarn.id, timeoutId));
          setMessageToWarn(null); // Reset after handling
      }
  }, [messageToWarn, user, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            setTimeout(() => {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            }, 100);
        }
    }
  }, [messages.length]);

  const handleDeleteRequest = (messageId: string) => {
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (messageToDelete) {
      if (pendingBlocks.has(messageToDelete)) {
          clearTimeout(pendingBlocks.get(messageToDelete));
          setPendingBlocks(prev => {
              const newMap = new Map(prev);
              newMap.delete(messageToDelete);
              return newMap;
          });
          toast({ title: "Potential block avoided.", description: "You deleted the message in time." });
      }

      const path = chatId ? `private_chats/${chatId}/messages/${messageToDelete}` : `public_chat/${messageToDelete}`;
      await remove(ref(db, path));
      if (!pendingBlocks.has(messageToDelete)) {
        toast({ title: 'Message deleted.' });
      }
      setMessageToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleReport = (message: Message) => {
    setMessageToReport(message);
    setReportDialogOpen(true);
  };

  const handleReply = (message: Message) => {
    setReplyTo(message);
  }
  
  const handleBlock = async (userIdToBlock: string) => {
    const userToBlockRef = ref(db, `users/${userIdToBlock}`);
    const snapshot = await get(userToBlockRef);
    if (snapshot.exists() && user) {
        const userToBlockData = snapshot.val() as UserData
        const userToBlock = { ...userToBlockData, username: userIdToBlock };
        await blockUser(userToBlock, `${user.customName} has blocked ${userToBlock.customName}.`);
        toast({
            title: "User Blocked",
            description: `${userToBlock.customName} has been blocked.`,
        });
    }
  }

  const handleUnblock = async (userIdToUnblock: string) => {
    const userToUnblockRef = ref(db, `users/${userIdToUnblock}`);
    const snapshot = await get(userToUnblockRef);
    if (snapshot.exists()) {
        const userToUnblockData = snapshot.val() as UserData;
        const userToUnblock = { ...userToUnblockData, username: userIdToUnblock };
        await unblockUser(userToUnblock, `${userToUnblock.customName} was unblocked by a Moderator.`);
        toast({
            title: "User Unblocked",
            description: `${userToUnblock.customName} can now chat again.`,
            className: "bg-green-500 text-white",
        });
    }
  }

  const handleSendFriendRequest = async (recipientId: string) => {
    if (!user) {
        toast({ title: 'You must be logged in to send friend requests.', variant: 'destructive' });
        return;
    }
    if (user.username === recipientId) {
        toast({ title: "You can't send a friend request to yourself.", variant: 'destructive' });
        return;
    }

    try {
        const updates: any = {};
        updates[`/users/${user.username}/friendRequests/${recipientId}`] = 'sent';
        updates[`/users/${recipientId}/friendRequests/${user.username}`] = 'pending';

        await update(ref(db), updates);
        toast({ title: 'Friend request sent!' });
    } catch (error) {
        console.error("Error sending friend request:", error);
        toast({ title: 'Failed to send friend request.', variant: 'destructive' });
    }
  };

  const handleReportSubmit = async (reason: string) => {
    if (!messageToReport || !user) return;

    const reportsRef = ref(db, `reports/${messageToReport.id}`);
    await dbSet(reportsRef, {
      reporter: user.customName,
      reportedUser: messageToReport.senderId,
      message: messageToReport.text || 'Image Message',
      reason,
      timestamp: serverTimestamp(),
    });

    const messageContent = (messageToReport.text || '').toLowerCase();
    const containsBlockedWord = blockedWords.some(word => messageContent.includes(word.toLowerCase()));
    
    toast({
        title: 'Thank you for reporting.',
        description: 'This action is under review.',
    });

    if (containsBlockedWord) {
        setTimeout(async () => {
            const userToBlockRef = ref(db, `users/${messageToReport.senderId}`);
            const snapshot = await get(userToBlockRef);
            if (snapshot.exists()) {
                const userToBlock = { ...snapshot.val(), username: messageToReport.senderId } as UserData;
                await blockUser(userToBlock, `${user.customName} reported... Ura Firing Squad Blocked ${messageToReport.senderName}.`);
            }
        }, 5 * 1000);
    }

    setReportDialogOpen(false);
    setMessageToReport(null);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };
  
  if (isPrivateChat && messages.length === 0) {
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <WelcomeMessage otherUserName={otherUserName} />
            <TypingIndicator chatId={chatId} />
            <MessageInput chatId={chatId} replyTo={replyTo} onCancelReply={cancelReply} />
        </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2 space-y-1">
        <AnimatePresence>
          {messages.map((message, index) => {
            const showDateSeparator = index === 0 || !isSameDay(new Date(messages[index-1].timestamp), new Date(message.timestamp));
            
            return (
                <div key={message.id}>
                    {showDateSeparator && <DateSeparator date={formatDateSeparator(new Date(message.timestamp))} />}
                    <motion.div
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="group"
                    >
                        <MessageComponent
                            message={message}
                            onReport={handleReport}
                            onDelete={handleDeleteRequest}
                            onBlock={handleBlock}
                            onUnblock={handleUnblock}
                            onSendFriendRequest={handleSendFriendRequest}
                            onReply={handleReply}
                            isPrivateChat={isPrivateChat}
                        />
                    </motion.div>
                </div>
            )
          })}
          </AnimatePresence>
        </div>
      </ScrollArea>
       <TypingIndicator chatId={chatId} />
       <MessageInput chatId={chatId} replyTo={replyTo} onCancelReply={cancelReply} />

      {messageToReport && (
        <ReportDialog
          open={isReportDialogOpen}
          onOpenChange={setReportDialogOpen}
          onSubmit={handleReportSubmit}
        />
      )}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the message from the chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
