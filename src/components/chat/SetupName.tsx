"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, UserData } from '@/lib/types';

export default function SetupName() {
  const [name, setName] = useState('');
  const { setUser } = useUser();
  const { toast } = useToast();

  const handleNameSubmit = async () => {
    if (name.trim().length < 3) {
      toast({
        title: 'Name too short',
        description: 'Please enter a name with at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }

    let customName = name.trim();
    let role: UserRole = 'user';

    if (customName.startsWith('#225')) {
      role = 'moderator';
      customName = customName.substring(4);
    } else if (customName.startsWith('#226')) {
      role = 'developer';
      customName = customName.substring(4);
    } else if (customName.startsWith('#227')) {
      role = 'system';
      customName = 'URA System';
    }

    if (!customName) {
        toast({
          title: 'Invalid Name',
          description: 'Please provide a name after the code.',
          variant: 'destructive',
        });
        return;
    }

    const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: UserData = {
      username,
      customName,
      role,
      profileImageUrl: '', // Set to empty string for default icon
      friends: {},
      friendRequests: {},
      isBlocked: false,
      blockExpires: 0
    };

    try {
      const userRef = ref(db, `users/${username}`);
      await set(userRef, newUser);
      setUser(newUser);
      localStorage.setItem('echosphere_user', JSON.stringify(newUser));
      toast({
        title: `Welcome, ${customName}!`,
        description: "You've successfully joined EchoSphere.",
      });
    } catch (error) {
      console.error('Failed to save user data:', error);
      toast({
        title: 'Setup Failed',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">Welcome to EchoSphere</CardTitle>
        <CardDescription className="text-center">
          Choose a name to display in the chat. This can only be set once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
            placeholder="Enter your custom name..."
            className="text-center text-lg h-12"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleNameSubmit} className="w-full text-lg py-6">
          Join Chat
        </Button>
      </CardFooter>
    </Card>
  );
}
