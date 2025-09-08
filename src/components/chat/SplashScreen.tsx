"use client";

import { Bell } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 bg-primary/30 rounded-full animate-ping" />
        <div className="absolute h-20 w-20 bg-primary/50 rounded-full animate-ping delay-150" />
        <div className="relative p-6 bg-primary rounded-full shadow-lg">
          <Bell className="h-12 w-12 text-primary-foreground animate-pulse" />
        </div>
      </div>
      <h1 className="mt-8 text-4xl font-bold font-headline text-primary tracking-widest animate-pulse">
        EchoSphere
      </h1>
      <p className="mt-2 text-muted-foreground">Connecting worlds...</p>
    </div>
  );
}
