
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { db } from '@/lib/firebase';
import { ref, set, push, serverTimestamp, update } from 'firebase/database';
import type { UserData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function blockUser(userToBlock: UserData, systemMessageText: string) {
    if (!userToBlock) return;

    const blockDuration = 30 * 60 * 1000; // 30 minutes
    const expiry = Date.now() + blockDuration;
    const userRef = ref(db, `users/${userToBlock.username}`);
    
    try {
        await update(userRef, {
            isBlocked: true,
            blockExpires: expiry
        });

        const systemMessage = {
            text: systemMessageText,
            senderId: "system",
            senderName: "URA System",
            role: "system",
            timestamp: serverTimestamp(),
        };
        const messagesRef = ref(db, 'public_chat');
        await push(messagesRef, systemMessage);
    } catch (e) {
        console.error("Failed to block user:", e);
    }
}

export async function unblockUser(userToUnblock: UserData, systemMessageText: string) {
    if (!userToUnblock) return;
    const userRef = ref(db, `users/${userToUnblock.username}`);
    try {
        await update(userRef, {
            isBlocked: null,
            blockExpires: null
        });

        const systemMessage = {
            text: systemMessageText,
            senderId: "system",
            senderName: "URA System",
            role: "system",
            timestamp: serverTimestamp(),
        };
        const messagesRef = ref(db, 'public_chat');
        await push(messagesRef, systemMessage);

    } catch(e) {
        console.error("Failed to unblock user:", e);
    }
}
