
"use client";

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type BackgroundSetting = 'default' | 'legacy' | 'none';

interface BackgroundContextType {
  background: BackgroundSetting;
  setBackground: (background: BackgroundSetting) => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [background, setBackground] = useState<BackgroundSetting>('default');

  useEffect(() => {
    const storedBg = localStorage.getItem('publicchat_background') as BackgroundSetting | null;
    if (storedBg && ['default', 'legacy', 'none'].includes(storedBg)) {
      setBackground(storedBg);
    }
  }, []);

  const handleSetBackground = (bg: BackgroundSetting) => {
    localStorage.setItem('publicchat_background', bg);
    setBackground(bg);
  };

  return (
    <BackgroundContext.Provider value={{ background, setBackground: handleSetBackground }}>
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
