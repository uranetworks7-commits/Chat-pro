
"use client";

import { memo, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Flag, UserPlus, Trash2, ShieldOff, Download, Play, Link as LinkIcon, ShieldCheck, Star, ArrowRight, CornerUpLeft, Smile } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { RoleIcon } from './Icons';
import { cn } from '@/lib/utils';
import type { Message, UserData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, off, get, update, set, remove, increment } from 'firebase/database';
import AudioPlayer from './AudioPlayer';
import Confetti from './Confetti';
import { useToast } from '@/hooks/use-toast';


interface MessageProps {
  message: Message;
  onReport: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onBlock: (userId: string) => void;
  onUnblock: (userId: string) => void;
  onSendFriendRequest: (userId: string) => void;
  onReply: (message: Message) => void;
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

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😢', '😠'];

function parseAndRenderMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
  
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // URLs are handled outside this function now
        return null;
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
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <div className="relative mt-2 max-w-xs cursor-pointer">
                        <Image src={url} alt="chat attachment" className="rounded-lg object-contain" width={500} height={500} unoptimized />
                    </div>
                </DialogTrigger>
                <DialogContent className="p-0 border-0 max-w-[90vw] h-auto bg-transparent">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="chat attachment" className="max-h-[90vh] w-auto h-auto object-contain mx-auto" />
                </DialogContent>
            </Dialog>
        );
    }
    if (mediaType === 'video') {
        return <video src={url} controls className="mt-2 rounded-lg max-w-xs" />;
    }
    if (mediaType === 'audio') {
        return <AudioPlayer url={url} />;
    }
    return null;
};


const MessageComponent = ({ message, onReport, onDelete, onBlock, onUnblock, onSendFriendRequest, onReply, isPrivateChat }: MessageProps) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [senderData, setSenderData] = useState<UserData | null>(null);
  const [fireConfetti, setFireConfetti] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);

  const isSender = user?.username === message.senderId;
  const senderRole = senderData?.role || message.role || 'user';
  const canModerate = user?.role === 'moderator' || user?.role === 'developer';
  const hasMedia = message.imageUrl && isValidHttpUrl(message.imageUrl);
  const showLikeButton = message.text && message.text.includes('#');
  const hasLiked = user ? message.likedBy && message.likedBy[user.username] : false;

  useEffect(() => {
    if (message.text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = message.text.match(urlRegex);
        if (match && match[0] && !getMediaType(match[0])) {
            setDetectedUrl(match[0]);
        } else {
            setDetectedUrl(null);
        }
    } else {
        setDetectedUrl(null);
    }
  }, [message.text]);

  useEffect(() => {
    const userRef = ref(db, `users/${message.senderId}`);
    const listener = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
            setSenderData({ ...snapshot.val(), username: message.senderId });
        } else {
            // Fallback to message data if user is not in DB (e.g. deleted account)
            setSenderData({
                username: message.senderId,
                customName: message.senderName,
                profileImageUrl: message.senderProfileUrl,
                role: message.role,
            });
        }
    });
    return () => off(userRef, 'value', listener);
  }, [message.senderId, message.senderName, message.senderProfileUrl, message.role]);

  const getChatId = () => {
    if (!isPrivateChat || !user) return 'public';
    // a message id for private chat has format {chatId}_chat_{messageId}
    const chatIdFromMessage = message.id.split('_chat_')[0];
    return chatIdFromMessage;
  }

  const handleLike = async () => {
    if (!user) return;
    const isPrivilegedUser = user.role === 'moderator' || user.role === 'developer';

    if (!isPrivilegedUser && hasLiked) {
        toast({ title: "You've already liked this message."});
        return;
    }

    const chatIdForLike = getChatId();
    const messageRefPath = isPrivateChat ? `private_chats/${chatIdForLike}/messages/${message.id}` : `public_chat/${message.id}`;
    const messageRef = ref(db, messageRefPath);

    try {
        const updates: any = {};
        updates['likes'] = increment(1);
        if (!isPrivilegedUser) {
            updates[`likedBy/${user.username}`] = true;
        }
        await update(messageRef, updates);

        setFireConfetti(false);
        setTimeout(() => setFireConfetti(true), 10);

    } catch (error) {
        console.error("Error liking message:", error);
        toast({ title: "Error", description: "Could not like the message.", variant: "destructive" });
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;

    const chatIdForReaction = getChatId();
    const messageRefPath = isPrivateChat ? `private_chats/${chatIdForReaction}/messages/${message.id}` : `public_chat/${message.id}`;
    const reactionRef = ref(db, `${messageRefPath}/reactions/${emoji}`);

    const snapshot = await get(reactionRef);
    const existingReactors: string[] = snapshot.val() || [];
    
    if (existingReactors.includes(user.username)) {
        const newReactors = existingReactors.filter(u => u !== user.username);
        if (newReactors.length > 0) {
            await set(reactionRef, newReactors);
        } else {
            await remove(reactionRef);
        }
    } else {
        const newReactors = [...existingReactors, user.username];
        await set(reactionRef, newReactors);
    }
  }

  const isSenderBlocked = senderData?.isBlocked && senderData.blockExpires && senderData.blockExpires > Date.now();
  const chatId = isPrivateChat ? message.id.split('_chat_')[0] : 'public';

    if (senderRole === 'system') {
        return (
            <div className="flex justify-center items-center my-2">
                <div className="flex items-center gap-2 text-center text-sm text-purple-400 font-semibold px-4 py-1 bg-purple-800/80 border border-purple-600 rounded-full">
                    <RoleIcon role="system" className="h-4 w-4" />
                    <span className="font-bold">{senderData?.customName || message.senderName}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{message.text}</span>
                </div>
            </div>
        );
    }
    
  const MessageOptions = () => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={isSender ? "end" : "start"}>
            {!isSender && (
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Smile className="mr-2 h-4 w-4" />
                        <span>React</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <div className="flex gap-1 p-1">
                                {EMOJI_REACTIONS.map(emoji => (
                                    <DropdownMenuItem key={emoji} className="p-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-lg" onClick={() => handleReaction(emoji)}>
                                            {emoji}
                                        </Button>
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
            )}
            {!isSender && !isPrivateChat && <DropdownMenuItem onClick={() => onSendFriendRequest(message.senderId)}><UserPlus className="mr-2 h-4 w-4" /><span>Send Friend Request</span></DropdownMenuItem>}
            {!isSender && <DropdownMenuItem onClick={() => onReply(message)}><CornerUpLeft className="mr-2 h-4 w-4" /><span>Reply</span></DropdownMenuItem>}
            {!isSender && !isPrivateChat && <DropdownMenuItem onClick={() => onReport(message)}><Flag className="mr-2 h-4 w-4" /><span>Report</span></DropdownMenuItem>}
            {(canModerate || isSender) && <DropdownMenuSeparator />}
            {(canModerate || isSender) && <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>}
            {canModerate && !isSender && !isPrivateChat && (
                isSenderBlocked 
                    ? <DropdownMenuItem className="text-green-500" onClick={() => onUnblock(message.senderId)}><ShieldCheck className="mr-2 h-4 w-4" /><span>Unblock User</span></DropdownMenuItem>
                    : <DropdownMenuItem className="text-destructive" onClick={() => onBlock(message.senderId)}><ShieldOff className="mr-2 h-4 w-4" /><span>Block</span></DropdownMenuItem>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
  );

  const ReplyPreview = ({ replyTo }: { replyTo: Message['replyTo']}) => {
    if (!replyTo) return null;
    return (
        <div className="flex items-center gap-2 p-2 rounded-t-lg bg-black/20 text-xs text-muted-foreground border-b border-white/10">
            <CornerUpLeft className="h-3 w-3 flex-shrink-0" />
            <div className="flex-1 overflow-hidden">
                <p className="font-bold text-foreground truncate">{replyTo.senderName}</p>
                <p className="truncate">{replyTo.text || (replyTo.imageUrl ? 'Media' : '...')}</p>
            </div>
        </div>
    );
  };

  return (
    <>
    <Confetti fire={fireConfetti} />
    <div className={cn('flex items-start gap-3 p-2 my-1', isSender ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 border-2 border-muted">
        <AvatarImage src={senderData?.profileImageUrl || message.senderProfileUrl} />
        <AvatarFallback>
          <RoleIcon role={senderRole} />
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col w-fit max-w-md", isSender ? 'items-end' : 'items-start')}>
        <div className={cn("flex items-center gap-1.5", isSender ? 'flex-row-reverse' : 'flex-row')}>
            <span className={cn('text-sm font-semibold', roleStyles[senderRole])}>
                {senderData?.customName || message.senderName}
            </span>
            {senderRole !== 'user' && <RoleIcon role={senderRole} className="h-3 w-3" />}
             <div className="self-start">
                <MessageOptions />
            </div>
        </div>
        
        <div 
            className={cn(
                'rounded-lg relative shadow-md mt-1 flex flex-col', 
                isSender ? 'bg-primary text-primary-foreground rounded-br-none' : `${messageBgStyles[senderRole]} rounded-bl-none`,
            )}
        >
            <ReplyPreview replyTo={message.replyTo} />
            <div className={cn("text-base break-words p-3", message.replyTo ? 'pt-2' : '')}>
                {message.text && parseAndRenderMessage(message.text)}
            </div>
            
            {hasMedia && <div className="p-1 pt-0"><MediaContent url={message.imageUrl!} /></div>}

            <div className={cn("text-[0.6rem] text-muted-foreground mt-1 self-end px-3 pb-2", isSender ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {format(new Date(message.timestamp), 'p')}
            </div>
        </div>

        {detectedUrl && (
            <Button asChild variant="secondary" size="sm" className="mt-1.5 h-auto py-2 text-xs">
                <a href={detectedUrl} target="_blank" rel="noopener noreferrer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Visit Site
                </a>
            </Button>
        )}

        {showLikeButton && (
            <div className="mt-1.5 flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLike}
                    disabled={hasLiked && user?.role === 'user'}
                    className="h-auto p-1.5 rounded-full bg-background/50 hover:bg-background"
                >
                    <Star className={cn("h-4 w-4", hasLiked ? "text-yellow-400 fill-current" : "text-foreground")} />
                </Button>
                {message.likes && message.likes > 0 && <span className="text-xs font-bold">{message.likes}</span>}
            </div>
        )}

        {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1 px-2">
                {Object.entries(message.reactions).map(([emoji, users]) => (
                    <div key={emoji} className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary text-xs">
                        <span className="text-xs">{emoji}</span>
                        <span className="text-xs font-bold">{users.length}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

    </div>
    </>
  );
};

export default memo(MessageComponent);

    
