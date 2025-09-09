
"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type BackgroundValue = string; // Can be a class name or a url()

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
      const storedBackground = localStorage.getItem('publicchat_background');
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
        // Handle potential storage errors, e.g., quota exceeded
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
           alert("Could not save the background. Your browser storage might be full. Please clear some space and try again.");
        }
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
