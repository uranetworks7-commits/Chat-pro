
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, set, serverTimestamp, query, orderByChild, equalTo, get, update, onValue, off, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { RoleIcon } from './Icons';
import { Check, X, UserPlus, Search, LogOut, ImageIcon, ImageOff, ArrowLeft } from 'lucide-react';
import type { UserData } from '@/lib/types';
import { useBackground } from '@/context/BackgroundContext';
import { ScrollArea } from '../ui/scroll-area';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FriendRequest {
    id: string;
    name: string;
}

export default function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [friendCustomName, setFriendCustomName] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchedUser, setSearchedUser] = useState<UserData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { background, setBackground } = useBackground();


  useEffect(() => {
    if (!user) return;
    
    const requestsRef = ref(db, `users/${user.username}/friendRequests`);
    const listener = onValue(requestsRef, async (snapshot) => {
        const requestsData = snapshot.val();
        if (requestsData) {
            const pendingRequests = Object.entries(requestsData)
                .filter(([_, status]) => status === 'pending')
                .map(([id]) => id);

            const requestsWithNames: FriendRequest[] = [];
            for (const id of pendingRequests) {
                const userSnapshot = await get(ref(db, `users/${id}`));
                if (userSnapshot.exists()) {
                    requestsWithNames.push({ id, name: userSnapshot.val().customName });
                }
            }
            setFriendRequests(requestsWithNames);
        } else {
            setFriendRequests([]);
        }
    });

    return () => off(requestsRef, 'value', listener);

  }, [user]);
  
  useEffect(() => {
    if (!friendCustomName) {
      setSearchedUser(null);
    }
  }, [friendCustomName]);

  const handleUpdateAvatar = async () => {
    if (!user || !newAvatarUrl) return;
    const userRef = ref(db, `users/${user.username}/profileImageUrl`);
    await set(userRef, newAvatarUrl);
    setUser({ ...user, profileImageUrl: newAvatarUrl });
    toast({ title: 'Avatar updated successfully!' });
    setNewAvatarUrl('');
  };

  const handleSearchFriend = async () => {
    const nameToSearch = friendCustomName.trim();
    if (!nameToSearch || !user) return;

    if (nameToSearch === user.customName) {
        toast({ title: "You can't add yourself!", variant: 'destructive' });
        return;
    }
    
    setIsSearching(true);
    setSearchedUser(null);

    const usersRef = ref(db, 'users');

    try {
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const allUsers = snapshot.val();
            let foundUser: UserData | null = null;
            let foundUserId: string | null = null;
            
            const normalizedSearch = nameToSearch.toLowerCase();

            for (const userId in allUsers) {
                const userData = allUsers[userId];
                if (userData.customName && userData.customName.toLowerCase() === normalizedSearch) {
                    foundUserId = userId;
                    foundUser = userData;
                    break;
                }
            }

            if (foundUser && foundUserId) {
                setSearchedUser({ ...foundUser, username: foundUserId });
            } else {
                toast({ title: 'User not found.', variant: 'destructive' });
                setSearchedUser(null);
            }
        } else {
            toast({ title: 'User not found.', variant: 'destructive' });
            setSearchedUser(null);
        }
    } catch (error) {
        console.error("Error searching friend:", error);
        toast({ title: 'An error occurred during search. Make sure you have the correct display name.', variant: 'destructive' });
    } finally {
        setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!user || !searchedUser) return;

    try {
        const updates: any = {};
        updates[`/users/${user.username}/friendRequests/${searchedUser.username}`] = 'sent';
        updates[`/users/${searchedUser.username}/friendRequests/${user.username}`] = 'pending';

        await update(ref(db), updates);
        toast({ title: `Friend request sent to ${searchedUser.customName || searchedUser.username}!` });
        setFriendCustomName('');
        setSearchedUser(null);
    } catch (error) {
        console.error("Error sending friend request:", error);
        toast({ title: 'Failed to send friend request.', variant: 'destructive' });
    }
};

  const handleFriendRequest = async (requesterId: string, action: 'accept' | 'reject') => {
      if (!user) return;

      const currentUserRef = ref(db, `users/${user.username}/friendRequests/${requesterId}`);
      const requesterUserRef = ref(db, `users/${requesterId}/friendRequests/${user.username}`);
      
      await remove(currentUserRef);
      await remove(requesterUserRef);

      if (action === 'accept') {
          const updates: any = {};
          updates[`/users/${user.username}/friends/${requesterId}`] = true;
          updates[`/users/${requesterId}/friends/${user.username}`] = true;
          await update(ref(db), updates);
          toast({ title: 'Friend request accepted!' });
      } else {
          toast({ title: 'Friend request rejected.' });
      }
  };

  const handleLogout = () => {
    setUser(null);
    toast({ title: 'You have been logged out.' });
    onOpenChange(false);
  }
  
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-full w-full bg-background p-0 flex flex-col border-0">
        <DialogHeader className="flex flex-row items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft /></Button>
                </DialogClose>
                <DialogTitle>Profile</DialogTitle>
            </div>
        </DialogHeader>
        <ScrollArea className="flex-1">
            <div className="py-4 flex flex-col items-center">
              <Avatar className="h-20 w-20 border-4 border-primary shadow-lg">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback className="text-3xl">
                  <RoleIcon role={user.role} className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-3 text-xl font-bold font-headline">{user.customName}</h2>
              <p className="text-xs text-muted-foreground">@{user.username}</p>
              <p className="mt-1 text-xs capitalize inline-flex items-center gap-1.5"><RoleIcon role={user.role} className="h-3 w-3" />{user.role}</p>
            </div>
            <div className="px-4">
              <Separator />
              <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Update Avatar</h3>
                  <div className="space-y-2">
                      <Label htmlFor="avatar-url" className="text-xs">Avatar URL</Label>
                      <div className="flex gap-2">
                          <Input id="avatar-url" placeholder="https://..." value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} className="h-9 text-xs" />
                          <Button onClick={handleUpdateAvatar} disabled={!newAvatarUrl} size="sm">Set</Button>
                      </div>
                  </div>
              </div>
              <Separator />
               <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Change Background</h3>
                   <div className="flex justify-between gap-2">
                      <Button variant={background === 'bg-chat-1' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-1')} className="flex-1 h-9 text-xs">
                          <ImageIcon className="mr-2 h-4 w-4"/> Image 1
                      </Button>
                      <Button variant={background === 'bg-chat-2' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-2')} className="flex-1 h-9 text-xs">
                          <ImageIcon className="mr-2 h-4 w-4"/> Image 2
                      </Button>
                      <Button variant={background === 'bg-chat-none' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-none')} className="h-9 text-xs px-3">
                          <ImageOff className="mr-2 h-4 w-4"/> None
                      </Button>
                   </div>
              </div>
              <Separator />
               <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground text-sm">Add Friend</h3>
                  <div className="space-y-2">
                      <Label htmlFor="friend-customName" className="text-xs">Display Name</Label>
                      <div className="flex gap-2">
                          <Input id="friend-customName" placeholder="Enter display name..." value={friendCustomName} onChange={(e) => setFriendCustomName(e.target.value)}  onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()} className="h-9 text-xs" />
                          <Button onClick={handleSearchFriend} disabled={!friendCustomName.trim() || isSearching} size="icon" className="h-9 w-9">
                              {isSearching ? <span className="animate-spin h-4 w-4 rounded-full border-b-2 border-current" /> : <Search className="h-4 w-4" />}
                          </Button>
                      </div>
                       {searchedUser && (
                          <div className="flex items-center justify-between p-2 rounded-md bg-secondary mt-2">
                              <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                      <AvatarImage src={searchedUser.profileImageUrl} />
                                      <AvatarFallback>{searchedUser.customName ? searchedUser.customName.charAt(0) : '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-xs">{searchedUser.customName || searchedUser.username}</span>
                              </div>
                              <Button onClick={handleSendFriendRequest} size="sm" className="h-8 text-xs">
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Send Request
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
              <Separator />
              <div className="py-4">
                <h3 className="font-semibold text-foreground text-sm">Friend Requests</h3>
                <div className="mt-2 space-y-2">
                  {friendRequests.length > 0 ? (
                    friendRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                        <span className="font-medium text-xs">{req.name}</span>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={() => handleFriendRequest(req.id, 'accept')}><Check className="h-4 w-4"/></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-500/10" onClick={() => handleFriendRequest(req.id, 'reject')}><X className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No new friend requests.</p>
                  )}
                </div>
              </div>
            </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="destructive" className="w-full h-9 text-xs">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
