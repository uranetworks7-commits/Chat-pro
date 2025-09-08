
"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type BackgroundValue = 'bg-chat-1' | 'bg-chat-2' | 'bg-chat-none';

interface BackgroundContextType {
  background: BackgroundValue;
  setBackground: (background: BackgroundValue) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackgroundState] = useState<BackgroundValue>('bg-chat-1');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedBackground = localStorage.getItem('publicchat_background') as BackgroundValue;
      if (storedBackground) {
        setBackgroundState(storedBackground);
      }
    } catch (error) {
      console.error("Failed to load background from localStorage", error);
    } finally {
        setIsLoaded(true);
    }
  }, []);

  const setBackground = (newBackground: BackgroundValue) => {
    if (isLoaded) {
      try {
        localStorage.setItem('publicchat_background', newBackground);
        setBackgroundState(newBackground);
      } catch (error) {
        console.error("Failed to save background to localStorage", error);
      }
    }
  };

  return (
    <BackgroundContext.Provider value={{ background, setBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
