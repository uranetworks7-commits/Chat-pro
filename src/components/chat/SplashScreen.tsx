"use client";

import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
            animate={{ 
                rotate: [0, -25, 25, -25, 25, 0],
                transition: { duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }
            }}
            className="p-4 bg-primary rounded-full"
        >
            <Bell className="h-12 w-12 text-primary-foreground" />
        </motion.div>
        <h1 className="text-3xl font-bold font-headline text-primary">Public Chat</h1>
        <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-primary"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
            />
        </div>
      </motion.div>
    </div>
  );
}
