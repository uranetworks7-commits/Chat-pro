
"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { User, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileSheet from './ProfileSheet';
import FriendsSheet from './FriendsSheet';

export default function Header() {
  const { user } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
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
            <Bell className="h-4 w-4 text-primary-foreground" />
           </div>
          <h1 className="text-lg font-bold font-headline text-primary">Public Chat</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} className="relative h-8 w-8">
            <User className="h-4 w-4" />
            {hasFriendRequest && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent ring-2 ring-card" />}
            <span className="sr-only">Open Profile</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setFriendsOpen(true)} className="relative h-8 w-8">
            <Users className="h-4 w-4" />
            {hasFriendRequest && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent ring-2 ring-card" />}
            <span className="sr-only">Open Friends List</span>
          </Button>
        </div>
      </header>
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <FriendsSheet open={friendsOpen} onOpenChange={setFriendsOpen} />
    </>
  );
}
