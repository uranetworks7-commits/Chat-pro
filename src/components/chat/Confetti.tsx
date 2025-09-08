
"use client";

import React, { useState, useEffect } from 'react';
import ReactConfetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiProps {
  fire: boolean;
}

export default function Confetti({ fire }: ConfettiProps) {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (fire) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
      }, 5000); // Confetti disappears after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [fire]);

  if (!show) return null;

  return (
    <ReactConfetti
      width={width}
      height={height}
      numberOfPieces={200}
      recycle={false}
      gravity={0.15}
    />
  );
}
