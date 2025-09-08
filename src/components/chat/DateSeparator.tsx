
"use client";

import { cn } from '@/lib/utils';

interface DateSeparatorProps {
  date: string;
}

export default function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex justify-center items-center my-4">
      <div
        className={cn(
          'px-3 py-1 text-xs font-semibold rounded-full',
          'bg-background/60 text-muted-foreground shadow-sm backdrop-blur-sm'
        )}
      >
        {date}
      </div>
    </div>
  );
}
