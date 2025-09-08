"use client";

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MessageCircle, UserX, Trash2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface FriendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Friend extends UserData {
    id: string;
}

export default function FriendsSheet({ open, onOpenChange }: FriendsSheetProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const router = useRouter();


  useEffect(() => {
      if (!user) return;
      const friendsRef = ref(db, `users/${user.username}/friends`);

      const listener = onValue(friendsRef, async (snapshot) => {
          const friendIds = snapshot.val();
          if (friendIds) {
              const friendPromises = Object.keys(friendIds).map(id => {
                  return new Promise<Friend | null>((resolve) => {
                      const userRef = ref(db, `users/${id}`);
                      onValue(userRef, (userSnapshot) => {
                          if (userSnapshot.exists()) {
                              resolve({ id, ...userSnapshot.val() });
                          } else {
                              resolve(null);
                          }
                      }, { onlyOnce: true });
                  });
              });
              const friendsData = (await Promise.all(friendPromises)).filter(f => f !== null) as Friend[];
              setFriends(friendsData);
          } else {
              setFriends([]);
          }
      });
      return () => off(friendsRef, 'value', listener);

  }, [user]);

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    // Optimistically update UI
    setFriends(friends.filter(f => f.id !== friendId));

    const updates: any = {};
    updates[`/users/${user.username}/friends/${friendId}`] = null;
    updates[`/users/${friendId}/friends/${user.username}`] = null;

    try {
        await update(ref(db), updates);
        toast({ title: 'Friend removed.' });
    } catch (error) {
        // Revert UI if error
        // You might need a more robust state management for this
        console.error("Failed to remove friend:", error);
        toast({ title: 'Failed to remove friend.', variant: 'destructive' });
    }
  };

  const handlePrivateMessage = (friendId: string) => {
    if (!user) return;

    const ids = [user.username, friendId].sort();
    const chatId = ids.join('_');
    
    onOpenChange(false);
    router.push(`/chat/${chatId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Friends</SheetTitle>
          <SheetDescription>Your connections on Public Chat.</SheetDescription>
        </SheetHeader>
        <div className="py-6">
          {friends.length > 0 ? (
            <ul className="space-y-3">
              {friends.map(friend => (
                <li key={friend.id} className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.profileImageUrl} />
                      <AvatarFallback>{friend.customName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{friend.customName}</span>
                  </div>
                   <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => handlePrivateMessage(friend.id)}>
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleRemoveFriend(friend.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Friend
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                   </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Your friends list is empty.</p>
              <p className="text-xs text-muted-foreground mt-1">Send a friend request from a message!</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
