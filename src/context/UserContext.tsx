"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { UserData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, off, set, get } from 'firebase/database';

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userRef: any;
    const loadUser = async () => {
      try {
        const storedUserJson = localStorage.getItem('publicchat_user');
        if (storedUserJson) {
          const storedUser: UserData = JSON.parse(storedUserJson);
          
          // Verify user exists in Firebase
          const dbUserRef = ref(db, `users/${storedUser.username}`);
          const snapshot = await get(dbUserRef);

          if (snapshot.exists()) {
            const latestUserData = snapshot.val();
            setUserState(latestUserData);
            localStorage.setItem('publicchat_user', JSON.stringify(latestUserData));

            // Set up listener for real-time updates
            userRef = dbUserRef;
            onValue(userRef, (snapshot) => {
              const updatedUser = snapshot.val();
              if (updatedUser) {
                setUserState(updatedUser);
                localStorage.setItem('publicchat_user', JSON.stringify(updatedUser));
              }
            });

          } else {
            // User in localStorage doesn't exist in DB, clear it
            localStorage.removeItem('publicchat_user');
          }
        }
      } catch (error) {
        console.error("Failed to parse or verify user from localStorage", error);
        localStorage.removeItem('publicchat_user');
      } finally {
        setLoading(false);
      }
    };
    loadUser();

    return () => {
        if (userRef) {
            off(userRef);
        }
    }
  }, []);

  const setUser = (userData: UserData | null) => {
    setUserState(userData);
    if (userData) {
      localStorage.setItem('publicchat_user', JSON.stringify(userData));
    } else {
      // on logout, remove from local storage
      const storedUserJson = localStorage.getItem('publicchat_user');
      if (storedUserJson) {
        const storedUser: UserData = JSON.parse(storedUserJson);
        const userRef = ref(db, `users/${storedUser.username}`);
        off(userRef); // Turn off listener
      }
      localStorage.removeItem('publicchat_user');
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
