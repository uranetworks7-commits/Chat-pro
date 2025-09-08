export type UserRole = 'user' | 'moderator' | 'developer' | 'system';

export interface UserData {
  username: string; // Unique, permanent ID
  customName: string; // Display name
  role: UserRole;
  profileImageUrl?: string;
  friends?: Record<string, boolean>;
  friendRequests?: Record<string, 'pending' | 'sent'>;
  isBlocked?: boolean;
  blockExpires?: number;
  privateChats?: Record<string, PrivateChatMetadata>;
}

export interface Message {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  senderName: string;
  senderProfileUrl?: string;
  role: UserRole;
  timestamp: number;
}

export interface PrivateChatMetadata {
  lastMessage: string;
  timestamp: number;
  participants: {
    [key: string]: {
      customName: string;
      profileImageUrl: string;
    }
  }
}
