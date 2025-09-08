
"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserData } from '@/lib/types';
import { Label } from '../ui/label';

export default function SetupName() {
  const [username, setUsername] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedCustomName = customName.trim();

    if (trimmedUsername.length < 2 || trimmedCustomName.length < 3) {
      toast({
        title: 'Invalid input',
        description: 'Username must be at least 2 characters and display name must be at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const userRef = ref(db, `users/${trimmedUsername}`);
    
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const existingUser = snapshot.val() as UserData;
            
            if (existingUser.customName === trimmedCustomName) {
                // User exists and customName matches, log them in
                setUser(existingUser);
                toast({ title: `Welcome back, ${existingUser.customName}!` });
            } else {
                // User exists, but customName does not match
                toast({
                    title: 'Incorrect Display Name',
                    description: "The display name does not match the username. Please try again.",
                    variant: 'destructive',
                });
            }
        } else {
            // User does not exist
             toast({
                title: 'Login Failed',
                description: "This user does not exist. Please check your username.",
                variant: 'destructive',
            });
        }
    } catch (error) {
      console.error('Failed to login:', error);
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
          Please enter your credentials to log in.
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
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter your display name..."
                className="text-lg h-12"
            />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleLogin} className="w-full text-lg py-6" disabled={isSubmitting}>
          {isSubmitting ? 'Logging in...' : 'Login'}
        </Button>
      </CardFooter>
    </Card>
  );
}
