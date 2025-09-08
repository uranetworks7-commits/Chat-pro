"use client";

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useUser } from '@/context/UserContext';
import { db } from '@/lib/firebase';
import { ref, set, serverTimestamp } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { updateProfileAvatar } from '@/ai/flows/profile-avatar-update';
import { RoleIcon } from './Icons';
import { Check, X, Bot } from 'lucide-react';

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSheet({ open, onOpenChange }: ProfileSheetProps) {
  const { user, setUser } = useUser();
  const { toast } = useToast();
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpdateAvatar = async () => {
    if (!user || !newAvatarUrl) return;
    const updatedUser = { ...user, profileImageUrl: newAvatarUrl };
    const userRef = ref(db, `users/${user.username}`);
    await set(userRef, updatedUser);
    setUser(updatedUser);
    toast({ title: 'Avatar updated successfully!' });
    setNewAvatarUrl('');
  };
  
  const handleGenerateAvatar = async () => {
      if (!user || !aiPrompt) return;
      setIsGenerating(true);
      try {
        const result = await updateProfileAvatar({ description: `A digital avatar for a user named ${user.customName}. The theme is: ${aiPrompt}` });
        if (result.avatarUrl) {
            const updatedUser = { ...user, profileImageUrl: result.avatarUrl };
            const userRef = ref(db, `users/${user.username}`);
            await set(userRef, updatedUser);
            setUser(updatedUser);
            toast({ title: 'AI Avatar Generated!', description: 'Your new avatar has been set.' });
        }
      } catch (error) {
          console.error("AI avatar generation failed:", error);
          toast({ title: 'Generation Failed', description: 'Could not generate avatar. Please try again.', variant: 'destructive'});
      } finally {
          setIsGenerating(false);
          setAiPrompt('');
      }
  }

  // TODO: Add friend request logic
  const friendRequests: any[] = []; // Placeholder

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your Profile</SheetTitle>
          <SheetDescription>View and manage your profile details.</SheetDescription>
        </SheetHeader>
        <div className="py-6 flex flex-col items-center">
          <Avatar className="h-24 w-24 border-4 border-primary shadow-lg">
            <AvatarImage src={user.profileImageUrl} />
            <AvatarFallback className="text-4xl">
              <RoleIcon role={user.role} className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <h2 className="mt-4 text-2xl font-bold font-headline">{user.customName}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <p className="mt-1 text-xs capitalize inline-flex items-center gap-1.5"><RoleIcon role={user.role} className="h-3 w-3" />{user.role}</p>
        </div>
        <Separator />
        <div className="py-4 space-y-4">
            <h3 className="font-semibold text-foreground">Update Avatar</h3>
            <div className="space-y-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <div className="flex gap-2">
                    <Input id="avatar-url" placeholder="https://..." value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} />
                    <Button onClick={handleUpdateAvatar} disabled={!newAvatarUrl}>Set</Button>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="ai-prompt">Generate with AI</Label>
                <div className="flex gap-2">
                    <Input id="ai-prompt" placeholder="e.g., a cosmic warrior cat" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                    <Button onClick={handleGenerateAvatar} disabled={isGenerating || !aiPrompt}>
                        <Bot className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                        {isGenerating ? '...' : 'Go'}
                    </Button>
                </div>
            </div>
        </div>
        <Separator />
        <div className="py-4">
          <h3 className="font-semibold text-foreground">Friend Requests</h3>
          <div className="mt-2 space-y-2">
            {friendRequests.length > 0 ? (
              friendRequests.map(req => (
                <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                  <span>{req.name}</span>
                  <div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500"><Check /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><X /></Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No new friend requests.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
