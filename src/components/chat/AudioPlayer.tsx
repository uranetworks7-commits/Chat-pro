
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, AudioWaveform } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
    url: string;
}

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function AudioPlayer({ url }: AudioPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            setDuration(audio.duration);
            setCurrentTime(audio.currentTime);
        }

        const setAudioTime = () => setCurrentTime(audio.currentTime);

        audio.addEventListener('loadeddata', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);

        return () => {
            audio.removeEventListener('loadeddata', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
        }
    }, []);

    const togglePlayPause = () => {
        if (isPlaying) {
            audioRef.current?.pause();
        } else {
            audioRef.current?.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 max-w-xs mt-2">
            <audio ref={audioRef} src={url} preload="metadata" onEnded={() => setIsPlaying(false)} />
            <Button onClick={togglePlayPause} variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            <div className="flex items-center gap-2 w-full">
                <AudioWaveform className="h-6 w-8 text-muted-foreground" />
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground tabular-nums w-14 text-right">
                {formatTime(duration)}
            </span>
        </div>
    );
}
