"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { UserData } from '@/lib/types';
import { db } from '@/lib/firebase';
import { ref, onValue, off, set } from 'firebase/database';

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
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('publicchat_user');
        if (storedUser) {
          const parsedUser: UserData = JSON.parse(storedUser);
          setUserState(parsedUser);

          userRef = ref(db, `users/${parsedUser.username}`);
          onValue(userRef, (snapshot) => {
            const updatedUser = snapshot.val();
            if (updatedUser) {
              setUserState(updatedUser);
              localStorage.setItem('publicchat_user', JSON.stringify(updatedUser));
            }
          });
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
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
      const userRef = ref(db, `users/${userData.username}`);
      set(userRef, userData);
    } else {
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
