
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, set, serverTimestamp, query, orderByChild, equalTo, get, update, onValue, off, remove } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { RoleIcon } from '@/components/chat/Icons';
import { Check, X, UserPlus, Search, LogOut, ImageIcon, ImageOff, ArrowLeft, PaintBrush } from 'lucide-react';
import type { UserData } from '@/lib/types';
import { useBackground } from '@/context/BackgroundContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface FriendRequest {
    id: string;
    name: string;
}

export default function ProfilePage() {
  const { user, setUser, loading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [friendCustomName, setFriendCustomName] = useState('');
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [searchedUser, setSearchedUser] = useState<UserData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { background, setBackground } = useBackground();


  useEffect(() => {
    if (loading) return;
    if (!user) {
        router.replace('/');
        return;
    }
    
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

  }, [user, loading, router]);
  
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
    router.push('/');
  }
  
  if (loading || !user) return null;

  return (
    <main className="h-screen w-screen bg-background flex flex-col">
        <header className="flex flex-row items-center justify-between p-2 border-b">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}><ArrowLeft /></Button>
                <h1 className="text-xl font-semibold">Profile</h1>
            </div>
        </header>
        <ScrollArea className="flex-1">
            <div className="py-6 flex flex-col items-center">
              <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback className="text-4xl">
                  <RoleIcon role={user.role} className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-2xl font-bold font-headline">{user.customName}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="mt-1 text-sm capitalize inline-flex items-center gap-1.5"><RoleIcon role={user.role} className="h-4 w-4" />{user.role}</p>
              <Button onClick={handleLogout} variant="destructive" size="sm" className="mt-4">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
              </Button>
            </div>
            <div className="px-4">
              <Separator />
              <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Update Avatar</h3>
                  <div className="space-y-2">
                      <Label htmlFor="avatar-url">Avatar URL</Label>
                      <div className="flex gap-2">
                          <Input id="avatar-url" placeholder="https://..." value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} />
                          <Button onClick={handleUpdateAvatar} disabled={!newAvatarUrl}>Set</Button>
                      </div>
                  </div>
              </div>
              <Separator />
               <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Change Background</h3>
                   <div className="flex justify-between gap-2">
                      <Button variant={background === 'bg-chat-1' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-1')} className="flex-1">
                          <ImageIcon className="mr-2 h-4 w-4"/> Preset 1
                      </Button>
                      <Button variant={background === 'bg-chat-2' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-2')} className="flex-1">
                          <ImageIcon className="mr-2 h-4 w-4"/> Preset 2
                      </Button>
                      <Button variant={background === 'bg-chat-none' ? 'default' : 'outline'} onClick={() => setBackground('bg-chat-none')} className="px-4">
                          <ImageOff className="mr-2 h-4 w-4"/> None
                      </Button>
                   </div>
                   <Button asChild variant="outline" className="w-full mt-2">
                      <Link href="/profile/background">
                          <PaintBrush className="mr-2 h-4 w-4" />
                          Add Custom Background
                      </Link>
                   </Button>
              </div>
              <Separator />
               <div className="py-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Add Friend</h3>
                  <div className="space-y-2">
                      <Label htmlFor="friend-customName">Display Name</Label>
                      <div className="flex gap-2">
                          <Input id="friend-customName" placeholder="Enter display name..." value={friendCustomName} onChange={(e) => setFriendCustomName(e.target.value)}  onKeyDown={(e) => e.key === 'Enter' && handleSearchFriend()} />
                          <Button onClick={handleSearchFriend} disabled={!friendCustomName.trim() || isSearching} size="icon">
                              {isSearching ? <span className="animate-spin h-5 w-5 rounded-full border-b-2 border-current" /> : <Search className="h-5 w-5" />}
                          </Button>
                      </div>
                       {searchedUser && (
                          <div className="flex items-center justify-between p-3 rounded-md bg-secondary mt-2">
                              <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                      <AvatarImage src={searchedUser.profileImageUrl} />
                                      <AvatarFallback>{searchedUser.customName ? searchedUser.customName.charAt(0) : '?'}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{searchedUser.customName || searchedUser.username}</span>
                              </div>
                              <Button onClick={handleSendFriendRequest} size="sm">
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Send Request
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
              <Separator />
              <div className="py-4">
                <h3 className="font-semibold text-foreground">Friend Requests</h3>
                <div className="mt-2 space-y-2">
                  {friendRequests.length > 0 ? (
                    friendRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                        <span className="font-medium">{req.name}</span>
                        <div className="flex items-center">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-500/10" onClick={() => handleFriendRequest(req.id, 'accept')}><Check className="h-5 w-5"/></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => handleFriendRequest(req.id, 'reject')}><X className="h-5 w-5" /></Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No new friend requests.</p>
                  )}
                </div>
              </div>
            </div>
        </ScrollArea>
    </main>
  );
}
