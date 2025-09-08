
"use client";

import { memo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Flag, UserPlus, Trash2, ShieldOff, Download, Play, Link as LinkIcon, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleIcon } from './Icons';
import { cn } from '@/lib/utils';
import type { Message, UserData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get, update, set } from 'firebase/database';
import AudioPlayer from './AudioPlayer';
import Confetti from './Confetti';

interface MessageProps {
  message: Message;
  onReport: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  onSendFriendRequest: (userId: string) => void;
  isPrivateChat?: boolean;
}

const roleStyles = {
  user: 'text-foreground',
  moderator: 'text-green-400 font-bold',
  developer: 'text-red-400 font-bold tracking-wider',
  system: 'text-purple-400 font-semibold',
};

const messageBgStyles = {
    user: 'bg-secondary',
    moderator: 'bg-green-900/80 border border-green-700 shadow-[0_0_25px_5px_rgba(34,197,94,0.3)]',
    developer: 'bg-red-900/80 border border-red-700 shadow-[0_0_25px_5px_rgba(239,68,68,0.3)]',
    system: 'bg-purple-800/80 border border-purple-600',
}

function parseAndRenderMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const mediaExtensions = {
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      video: ['mp4', 'webm', 'mov'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
    };
  
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        let buttonText = "Visit Site";
        let Icon = LinkIcon;
        let variant: "default" | "secondary" | "destructive" = "secondary";
        
        try {
            const url = new URL(part);
            const extension = url.pathname.split('.').pop()?.toLowerCase();
            
            if (mediaExtensions.video.includes(extension!)) {
                buttonText = "Watch Video";
                Icon = Play;
                variant = "destructive";
            } else if (mediaExtensions.audio.includes(extension!)) {
                // Audio is handled by MediaContent with the new AudioPlayer,
                // so we don't render a button for them.
                return null;
            } else if (mediaExtensions.image.includes(extension!)) {
                // Images are also handled by MediaContent.
                return null;
            }
        } catch (e) {
            // Not a valid URL, treat as text
        }
  
        return (
          <Button key={index} asChild variant={variant} size="sm" className="my-2 h-auto py-2 text-xs">
            <a href={part} target="_blank" rel="noopener noreferrer">
              <Icon className="mr-2 h-4 w-4" />
              {buttonText}
            </a>
          </Button>
        );
      }
      return <p key={index} className="whitespace-pre-wrap break-words">{part}</p>;
    });
}

function isValidHttpUrl(string: string) {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

function getMediaType(url: string) {
    if (!isValidHttpUrl(url)) return null;
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension!)) return 'image';
    if (['mp4', 'webm', 'mov'].includes(extension!)) return 'video';
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension!)) return 'audio';
    return null;
}

const MediaContent = ({ url }: { url: string }) => {
    const mediaType = getMediaType(url);

    if (mediaType === 'image') {
        return <Image src={url} alt="chat attachment" className="mt-2 rounded-lg aspect-square object-cover" width={200} height={200} />;
    }
    if (mediaType === 'video') {
        return <video src={url} controls className="mt-2 rounded-lg max-w-xs" />;
    }
    if (mediaType === 'audio') {
        return <AudioPlayer url={url} />;
    }
    return null;
};


const MessageComponent = ({ message, onReport, onDelete, onBlock, onUnblock, onSendFriendRequest, isPrivateChat }: MessageProps) => {
  const { user } = useUser();
  const [senderData, setSenderData] = useState<UserData | null>(null);
  const [fireConfetti, setFireConfetti] = useState(false);
  const isSender = user?.username === message.senderId;
  const senderRole = message.role || 'user';
  const canModerate = user?.role === 'moderator' || user?.role === 'developer';
  const hasMedia = message.imageUrl && isValidHttpUrl(message.imageUrl);

  const showLikeButton = message.text && message.text.includes('#');
  const hasLiked = user ? message.likedBy && message.likedBy[user.username] : false;


  useEffect(() => {
    if (canModerate && !isSender) {
        const userRef = ref(db, `users/${message.senderId}`);
        const listener = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setSenderData({ ...snapshot.val(), username: message.senderId });
            }
        });
        return () => off(userRef, 'value', listener);
    }
  }, [canModerate, isSender, message.senderId]);

  const handleLike = async () => {
    if (!user) return;
    if (hasLiked && user.role === 'user') return; // Regular users can't unlike or re-like

    const messageRef = ref(db, isPrivateChat ? `private_chats/${message.id.split('_')[0]}/messages/${message.id}` : `public_chat/${message.id}`);
    
    const newLikes = (message.likes || 0) + 1;
    const newLikedBy = { ...(message.likedBy || {}), [user.username]: true };

    try {
        await update(messageRef, {
            likes: newLikes,
            likedBy: newLikedBy,
        });
        setFireConfetti(false); // Reset to allow re-triggering
        setTimeout(() => setFireConfetti(true), 10);
    } catch (error) {
        console.error("Failed to like message:", error);
    }
  };

  const isSenderBlocked = senderData?.isBlocked && senderData.blockExpires && senderData.blockExpires > Date.now();

    if (senderRole === 'system') {
        return (
            <div className="flex justify-center items-center my-2">
                <div className="flex items-center gap-2 text-center text-xs text-purple-400 font-semibold px-4 py-1 bg-purple-800/80 border border-purple-600 rounded-full">
                    <RoleIcon role="system" className="h-4 w-4" />
                    <span className="font-bold">{message.senderName}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{message.text}</span>
                </div>
            </div>
        );
    }
    
  return (
    <>
    <Confetti fire={fireConfetti} />
    <div className={cn('flex flex-col gap-1 p-1 my-2 rounded-lg transition-colors group', isSender ? 'items-end' : 'items-start')}>
      <div className={cn('flex items-start gap-2', isSender ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar className="h-6 w-6 border-2 border-muted">
          <AvatarImage src={message.senderProfileUrl} />
          <AvatarFallback>
            <RoleIcon role={senderRole} />
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold', roleStyles[senderRole])}>
                    {message.senderName}
                </span>
                {senderRole !== 'user' && <RoleIcon role={senderRole} className="h-2 w-2" />}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4 text-primary" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isSender ? "end" : "start"}>
                {!isSender && !isPrivateChat && <DropdownMenuItem onClick={() => onSendFriendRequest(message.senderId)}><UserPlus className="mr-2 h-4 w-4" /><span>Send Friend Request</span></DropdownMenuItem>}
                {!isSender && !isPrivateChat && <DropdownMenuItem onClick={() => onReport(message)}><Flag className="mr-2 h-4 w-4" /><span>Report</span></DropdownMenuItem>}
                {(canModerate || isSender) && <DropdownMenuSeparator />}
                {(canModerate || isSender) && <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>}
                {canModerate && !isSender && !isPrivateChat && (
                    isSenderBlocked 
                        ? <DropdownMenuItem className="text-green-500" onClick={() => onUnblock(message.senderId)}><ShieldCheck className="mr-2 h-4 w-4" /><span>Unblock User</span></DropdownMenuItem>
                        : <DropdownMenuItem className="text-destructive" onClick={() => onBlock(message.senderId)}><ShieldOff className="mr-2 h-4 w-4" /><span>Block for 30 min</span></DropdownMenuItem>
                )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className={cn('max-w-[85%]', isSender ? 'self-end' : 'self-start ml-8')}>
          <div className={cn(
              'rounded-lg p-2 relative shadow-md', 
              isSender ? 'bg-primary text-primary-foreground rounded-br-none' : `${messageBgStyles[senderRole]} rounded-bl-none`,
          )}>
              <div className="text-xs break-words">{message.text && parseAndRenderMessage(message.text)}</div>
              {hasMedia && <MediaContent url={message.imageUrl!} />}
               {showLikeButton && (
                  <div className="mt-2 flex items-center gap-2">
                      <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleLike}
                          disabled={hasLiked && user?.role === 'user'}
                          className="h-auto p-1 text-xs bg-background/20 hover:bg-background/40"
                      >
                          <Heart className={cn("h-4 w-4", hasLiked ? "text-red-500 fill-current" : "text-white")} />
                      </Button>
                      {message.likes && message.likes > 0 && <span className="text-xs font-bold">{message.likes}</span>}
                  </div>
              )}
          </div>
      </div>
      <span className={cn("text-[8px] text-muted-foreground mt-1 px-1", isSender ? 'self-end' : 'self-start ml-8')}>
          {format(new Date(message.timestamp), 'p')}
      </span>
    </div>
    </>
  );
};

export default memo(MessageComponent);
