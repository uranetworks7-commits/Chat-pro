"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, UserData } from '@/lib/types';
import { Label } from '../ui/label';

export default function SetupName() {
  const [username, setUsername] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useUser();
  const { toast } = useToast();

  const handleLoginOrCreate = async () => {
    if (username.trim().length < 3 || customName.trim().length < 3) {
      toast({
        title: 'Invalid input',
        description: 'Username and display name must be at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const userRef = ref(db, `users/${username.trim()}`);
    
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            // User exists, log them in
            const existingUser = snapshot.val() as UserData;
            setUser(existingUser);
            toast({ title: `Welcome back, ${existingUser.customName}!` });
        } else {
            // User does not exist, create a new one
            const newUser: UserData = {
                username: username.trim(),
                customName: customName.trim(),
                role: 'user',
                profileImageUrl: '',
                friends: {},
                friendRequests: {},
                isBlocked: false,
                blockExpires: 0
            };
            await set(userRef, newUser);
            setUser(newUser);
            toast({
                title: `Welcome, ${customName.trim()}!`,
                description: "You've successfully joined the chat.",
            });
        }
    } catch (error) {
      console.error('Failed to login or create user:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Could not process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Welcome to Public Chat</CardTitle>
        <CardDescription className="text-center">
          Enter your username to login or create a new account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username..."
                className="text-lg h-12"
            />
        </div>
        <div className="space-y-2">
            <Label htmlFor="customName">Display Name</Label>
            <Input
                id="customName"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLoginOrCreate()}
                placeholder="Enter your display name..."
                className="text-lg h-12"
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleLoginOrCreate} className="w-full text-lg py-6" disabled={isSubmitting}>
          {isSubmitting ? 'Joining...' : 'Login or Join Chat'}
        </Button>
      </CardFooter>
    </Card>
  );
}
