"use client";

import { memo } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Flag, UserPlus, Trash2, ShieldOff, Download, Play, Link as LinkIcon } from 'lucide-react';
import { useUser } from '@/context/UserContext';
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

interface MessageProps {
  message: Message;
  onReport: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onBlock: (userId: string) => void;
  onSendFriendRequest: (userId: string) => void;
}

const roleStyles = {
  user: 'text-foreground',
  moderator: 'text-blue-400 font-bold',
  developer: 'text-green-400 font-bold tracking-wider',
  system: 'text-purple-400 font-semibold',
};

const messageBgStyles = {
    user: 'bg-secondary',
    moderator: 'bg-blue-800/80 border border-blue-600',
    developer: 'bg-green-800/80 border border-green-600',
    system: 'bg-purple-800/80 border border-purple-600',
}

function parseAndRenderMessage(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
  
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        let buttonText = "Visit Site";
        let Icon = LinkIcon;
        let variant: "default" | "secondary" | "destructive" = "secondary";
  
        if (part.includes("youtube.com") || part.includes("youtu.be")) {
          buttonText = "Watch Video";
          Icon = Play;
          variant = "destructive";
        } else if (part.includes("mediafire.com")) {
          buttonText = "Download Now";
          Icon = Download;
          variant = "default";
        }
  
        return (
          <Button key={index} asChild variant={variant} size="sm" className="my-2 h-auto py-2">
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

const MessageComponent = ({ message, onReport, onDelete, onBlock, onSendFriendRequest }: MessageProps) => {
  const { user } = useUser();
  const isSender = user?.username === message.senderId;
  const senderRole = message.role || 'user';
  const canModerate = user?.role === 'moderator' || user?.role === 'developer';

  return (
    <div className={cn('flex items-start gap-3 p-3 my-1 rounded-lg transition-colors', isSender ? 'flex-row-reverse' : 'flex-row')}>
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        <Avatar className="h-10 w-10 border-2 border-muted">
          <AvatarImage src={message.senderProfileUrl} />
          <AvatarFallback>
            <RoleIcon role={senderRole} />
          </AvatarFallback>
        </Avatar>
        {!isSender && (
             <div className="flex items-center gap-1 mt-1">
                <span className={cn('text-xs font-medium truncate', roleStyles[senderRole])}>
                    {message.senderName}
                </span>
                {senderRole !== 'user' && <RoleIcon role={senderRole} className="h-3 w-3" />}
            </div>
        )}
      </div>

      <div className={cn('flex flex-col max-w-[70%]', isSender ? 'items-end' : 'items-start')}>
        <div className={cn(
            'rounded-xl p-3 relative shadow-md', 
            isSender ? 'bg-primary text-primary-foreground rounded-br-none' : `${messageBgStyles[senderRole]} rounded-bl-none`,
        )}>
            <div className="text-sm">{message.text && parseAndRenderMessage(message.text)}</div>
            {message.imageUrl && <img src={message.imageUrl} alt="chat attachment" className="mt-2 rounded-lg max-w-xs" />}
        </div>
        <span className="text-xs text-muted-foreground mt-1 px-1">
            {format(new Date(message.timestamp), 'p')}
        </span>
      </div>

       <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isSender ? "end" : "start"}>
                {!isSender && <DropdownMenuItem onClick={() => onSendFriendRequest(message.senderId)}><UserPlus className="mr-2 h-4 w-4" /><span>Send Friend Request</span></DropdownMenuItem>}
                {!isSender && <DropdownMenuItem onClick={() => onReport(message)}><Flag className="mr-2 h-4 w-4" /><span>Report</span></DropdownMenuItem>}
                {(canModerate || isSender) && <DropdownMenuSeparator />}
                {(canModerate || isSender) && <DropdownMenuItem className="text-destructive" onClick={() => onDelete(message.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem>}
                {canModerate && !isSender && <DropdownMenuItem className="text-destructive" onClick={() => onBlock(message.senderId)}><ShieldOff className="mr-2 h-4 w-4" /><span>Block for 30 min</span></DropdownMenuItem>}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
  );
};

export default memo(MessageComponent);
