
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

  useEffect(() => {
    document.body.classList.remove('bg-default', 'bg-legacy', 'bg-none');
    document.body.classList.add(`bg-${background}`);
    localStorage.setItem('publicchat_background', background);
  }, [background]);

  const handleSetBackground = (bg: BackgroundSetting) => {
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
