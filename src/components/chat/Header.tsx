"use client";

import { useState } from 'react';
import { User, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProfileSheet from './ProfileSheet';
import FriendsSheet from './FriendsSheet';

export default function Header() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);

  // TODO: Replace these with real data listeners
  const hasFriendRequest = true; 
  const hasNewFriendMessage = false;

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-card/80">
        <div className="flex items-center gap-2">
           <div className="p-2 bg-primary rounded-full">
            <Bell className="h-6 w-6 text-primary-foreground" />
           </div>
          <h1 className="text-2xl font-bold font-headline text-primary">Public Chat</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setProfileOpen(true)} className="relative">
            <User className="h-6 w-6" />
            {hasFriendRequest && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-card" />}
            <span className="sr-only">Open Profile</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setFriendsOpen(true)} className="relative">
            <Users className="h-6 w-6" />
            {hasNewFriendMessage && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-card" />}
            <span className="sr-only">Open Friends List</span>
          </Button>
        </div>
      </header>
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      <FriendsSheet open={friendsOpen} onOpenChange={setFriendsOpen} />
    </>
  );
}
