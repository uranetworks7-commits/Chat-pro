"use client";

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}

const reportReasons = [
  { id: 'abusive', label: 'Abusive Language (in Hindi or English)' },
  { id: 'hacking', label: 'Hacking or Cheating' },
  { id: 'scamming', label: 'Scamming or Phishing' },
  { id: 'spam', label: 'Spam or Unwanted Content' },
  { id: 'other', label: 'Other' },
];

export default function ReportDialog({ open, onOpenChange, onSubmit }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState(reportReasons[0].id);

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Report Message</AlertDialogTitle>
          <AlertDialogDescription>
            Please select a reason for reporting this message. Your report helps us keep the community safe.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="my-4 space-y-2">
          {reportReasons.map((reason) => (
            <div key={reason.id} className="flex items-center space-x-2">
              <RadioGroupItem value={reason.id} id={reason.id} />
              <Label htmlFor={reason.id}>{reason.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={!selectedReason}>
            Submit Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
