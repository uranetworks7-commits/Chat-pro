
"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { User, Users, MessageCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FriendsSheet from './FriendsSheet';
import Link from 'next/link';

interface HeaderProps {
    onFocusInput?: () => void;
}

export default function Header({ onFocusInput }: HeaderProps) {
  const { user } = useUser();
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [hasFriendRequest, setHasFriendRequest] = useState(false);

  // TODO: Replace with real data listener for new messages
  const hasNewFriendMessage = false;

  useEffect(() => {
    if (!user) return;
    
    const requestsRef = ref(db, `users/${user.username}/friendRequests`);
    const listener = onValue(requestsRef, (snapshot) => {
        const requestsData = snapshot.val();
        if (requestsData) {
            const hasPending = Object.values(requestsData).some(status => status === 'pending');
            setHasFriendRequest(hasPending);
        } else {
            setHasFriendRequest(false);
        }
    });

    return () => off(requestsRef, 'value', listener);

  }, [user]);

  return (
    <>
      <header className="flex items-center justify-between p-2 border-b bg-card/80">
        <div className="flex items-center gap-2">
           <div className="p-1.5 bg-primary rounded-full">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
           </div>
          <h1 className="text-lg font-bold font-headline text-primary">Public Chat</h1>
          {onFocusInput && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onFocusInput}>
                <Pencil className="h-4 w-4"/>
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <User className="h-4 w-4" />
              {hasFriendRequest && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent ring-2 ring-card" />}
              <span className="sr-only">Open Profile</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setFriendsOpen(true)} className="relative h-8 w-8">
            <Users className="h-4 w-4" />
            {hasFriendRequest && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent ring-2 ring-card" />}
            <span className="sr-only">Open Friends List</span>
          </Button>
        </div>
      </header>
      <FriendsSheet open={friendsOpen} onOpenChange={setFriendsOpen} />
    </>
  );
}
