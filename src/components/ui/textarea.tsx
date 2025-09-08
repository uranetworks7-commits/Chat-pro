
import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref || internalRef) as React.RefObject<HTMLTextAreaElement>;

    React.useLayoutEffect(() => {
      const textarea = combinedRef.current;
      if (textarea) {
        // Reset height to 'auto' to shrink back down when text is deleted
        textarea.style.height = 'auto';
        // Set the height to the scroll height to expand
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [props.value, combinedRef]);

    return (
      <textarea
        className={cn(
          'flex min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-y-hidden',
          className
        )}
        ref={combinedRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
