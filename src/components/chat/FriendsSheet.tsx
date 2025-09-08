"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MessageCircle, UserX } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FriendsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FriendsSheet({ open, onOpenChange }: FriendsSheetProps) {
  const { user } = useUser();

  // Placeholder for friends list
  const friends: any[] = []; 

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
                <li key={friend.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{friend.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Private Message
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <UserX className="mr-2 h-4 w-4" />
                        Remove Friend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
