
"use client";

import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { UserData, UserRole } from '@/lib/types';
import { Label } from '../ui/label';

type Step = 'enterUsername' | 'setCustomName';

export default function SetupName() {
  const [username, setUsername] = useState('');
  const [customName, setCustomName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('enterUsername');
  const [existingUser, setExistingUser] = useState<UserData | null>(null);
  const { setUser } = useUser();
  const { toast } = useToast();

  const handleCheckUsername = async () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2) {
      toast({
        title: 'Invalid username',
        description: 'Username must be at least 2 characters.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const userRef = ref(db, `users/${trimmedUsername}`);

    try {
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const userData = snapshot.val() as UserData;
        const fullUserData = { ...userData, username: trimmedUsername };

        if (userData.customName) {
          // User exists and has custom name, log them in
          setUser(fullUserData);
          toast({ title: `Welcome back, ${userData.customName}!` });
        } else {
          // User exists but needs to set a custom name
          setExistingUser(fullUserData);
          setStep('setCustomName');
        }
      } else {
        // User does not exist, fail login
        toast({
            title: 'Login Failed',
            description: 'This username does not exist. No new accounts can be created.',
            variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to check username:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Could not process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSetCustomName = async () => {
    const trimmedCustomName = customName.trim();
     if (trimmedCustomName.length < 3) {
      toast({
        title: 'Invalid Display Name',
        description: 'Display name must be at least 3 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (!existingUser) {
        toast({ title: "An error occurred. Please go back and re-enter your username.", variant: 'destructive'});
        return;
    }

    setIsSubmitting(true);
    const userRef = ref(db, `users/${existingUser.username}`);
    
    try {
        let role: UserRole = 'user';
        let finalCustomName = trimmedCustomName;

        if (trimmedCustomName.includes('#225')) {
            role = 'moderator';
            finalCustomName = trimmedCustomName.replace('#225', '').trim();
        } else if (trimmedCustomName.includes('#226')) {
            role = 'developer';
            finalCustomName = trimmedCustomName.replace('#226', '').trim();
        } else if (trimmedCustomName.includes('#227')) {
            role = 'system';
            finalCustomName = trimmedCustomName.replace('#227', '').trim();
        }
        
        if (finalCustomName.length < 3) {
            toast({
              title: 'Invalid Display Name',
              description: 'Display name (without code) must be at least 3 characters.',
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
        }

        const updatedUser: UserData = { ...existingUser, customName: finalCustomName, role };

        await set(userRef, updatedUser);
        setUser({ ...updatedUser, username: existingUser.username });
        toast({ title: `Welcome, ${finalCustomName}!` });
    } catch (error) {
        console.error('Failed to set user data:', error);
        toast({
            title: 'An Error Occurred',
            description: 'Could not save your display name.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
      <CardHeader>
        <CardTitle className="text-3xl font-headline text-center text-primary">
          {step === 'enterUsername' ? 'Welcome to Public Chat' : 'Set Your Display Name'}
        </CardTitle>
        <CardDescription className="text-center">
            {step === 'enterUsername' 
                ? 'Please enter your username to log in.'
                : `Welcome, @${username}! Please set a display name to continue.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'enterUsername' ? (
             <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username..."
                    className="text-lg h-12"
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckUsername()}
                />
            </div>
        ) : (
             <div className="space-y-2">
                <Label htmlFor="customName">Display Name</Label>
                <Input
                    id="customName"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetCustomName()}
                    placeholder="Enter your desired display name..."
                    className="text-lg h-12"
                />
            </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={step === 'enterUsername' ? handleCheckUsername : handleSetCustomName} className="w-full text-lg py-6" disabled={isSubmitting}>
          {isSubmitting 
            ? 'Verifying...' 
            : (step === 'enterUsername' ? 'Continue' : 'Join Chat')}
        </Button>
      </CardFooter>
    </Card>
  );
}
