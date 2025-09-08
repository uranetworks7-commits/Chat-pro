"use client";

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off, remove } from 'firebase/database';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/hooks/use-toast';
import type { Message, UserData } from '@/lib/types';
import MessageComponent from './Message';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReportDialog from './ReportDialog';
import { AnimatePresence, motion } from "framer-motion";
import { blockUser } from '@/lib/utils';
import { get, set as dbSet, push, serverTimestamp } from 'firebase/database';


export default function MessageList() {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useUser();
  const { toast } = useToast();
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [messageToReport, setMessageToReport] = useState<Message | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://files.catbox.moe/fwx9jw.mp3');
  }, []);

  useEffect(() => {
    const messagesRef = ref(db, 'public_chat');
    const handleNewMessages = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const messageList: Message[] = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...(value as Omit<Message, 'id'>),
        })).sort((a, b) => a.timestamp - b.timestamp);

        if (messages.length > 0 && messageList.length > messages.length) {
            const lastMessage = messageList[messageList.length - 1];
            if (lastMessage.senderId !== user?.username && audioRef.current) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            }
        }

        setMessages(messageList);
      } else {
        setMessages([]);
      }
    };

    onValue(messagesRef, handleNewMessages);

    return () => {
      off(messagesRef, 'value', handleNewMessages);
    };
  }, [user?.username, messages.length]);

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

  const handleDelete = async (messageId: string) => {
    await remove(ref(db, `public_chat/${messageId}`));
    toast({ title: 'Message deleted.' });
  };

  const handleReport = (message: Message) => {
    setMessageToReport(message);
    setReportDialogOpen(true);
  };
  
  const handleBlock = async (userIdToBlock: string, senderName: string) => {
    const userToBlockRef = ref(db, `users/${userIdToBlock}`);
    const snapshot = await get(userToBlockRef);
    if (snapshot.exists()) {
        const userToBlock = snapshot.val() as UserData;
        await blockUser(userToBlock, `${senderName} was blocked by a moderator.`);
        toast({
            title: "User Blocked",
            description: `${senderName} has been blocked for 30 minutes.`,
        });
    }
  }

  const handleReportSubmit = async (reason: string) => {
    if (!messageToReport) return;
    const reportsRef = ref(db, `reports/${messageToReport.id}`);
    await dbSet(reportsRef, {
      reporter: user?.username,
      reportedUser: messageToReport.senderId,
      message: messageToReport.text || 'Image Message',
      reason,
      timestamp: serverTimestamp(),
    });
    
    await handleBlock(messageToReport.senderId, messageToReport.senderName);

    toast({
      title: 'Thank you for your feedback! 📢',
      description: 'The user has been blocked and the report is under review.',
    });
    setReportDialogOpen(false);
    setMessageToReport(null);
  };

  return (
    <>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-2">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="group"
            >
                <MessageComponent
                    message={message}
                    onReport={handleReport}
                    onDelete={handleDelete}
                    onBlock={(userId) => handleBlock(userId, message.senderName)}
                />
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
      {messageToReport && (
        <ReportDialog
          open={isReportDialogOpen}
          onOpenChange={setReportDialogOpen}
          onSubmit={handleReportSubmit}
        />
      )}
    </>
  );
}
