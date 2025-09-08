"use client";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { useUser } from '@/context/UserContext';
import { AnimatePresence, motion } from "framer-motion";

interface TypingIndicatorProps {
  chatId?: string; // Optional: for private chats
}

export default function TypingIndicator({ chatId }: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const typingRef = ref(db, `typing/${chatId || 'public'}`);
    const listener = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const currentTypingUsers = Object.entries(data)
          .map(([key, value]: [string, any]) => value.name)
          .filter(name => name !== user?.customName); 
        setTypingUsers(currentTypingUsers);
      } else {
        setTypingUsers([]);
      }
    });

    return () => off(typingRef, 'value', listener);
  }, [chatId, user?.customName]);

  const getTypingText = () => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return 'Several people are typing...';
  };

  const typingText = getTypingText();

  return (
    <div className="h-6 px-4 pb-1">
        <AnimatePresence>
            {typingText && (
                <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="text-sm text-muted-foreground italic"
                >
                    {typingText}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
  );
}
