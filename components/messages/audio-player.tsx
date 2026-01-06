import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Spinner, DownloadSimple, ShareNetwork, DotsThreeVertical } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioPlayerProps {
    src: string;
    className?: string;
    variant?: 'sent' | 'received';
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className, variant = 'received' }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Generate random waveform bars (stable across renders)
    const waveformBars = useMemo(() => {
        return Array.from({ length: 40 }, () => Math.floor(Math.random() * 60) + 20);
    }, []);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;
        audio.preload = "metadata";

        // Setup initial source
        audio.src = src;

        let hasTriedFallback = false;

        const updateProgress = () => {
            setCurrentTime(audio.currentTime);
            if (audio.duration && !isNaN(audio.duration)) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const setAudioData = () => {
            setDuration(audio.duration);
            setLoading(false);
            setError(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
        };

        const attemptFallbackLoad = async () => {
            if (hasTriedFallback) {
                setLoading(false);
                setError(true);
                return;
            }

            console.log("Tentando fallback via Blob fetch...");
            hasTriedFallback = true;
            try {
                // Tenta buscar o arquivo como Blob para driblar erros de cache/range do navegador
                const res = await fetch(src);
                if (!res.ok) throw new Error("Fetch failed");
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                audio.src = blobUrl;
                audio.load();
                // O evento canplay ou loadedmetadata vai limpar o erro
            } catch (err) {
                console.error("Fallback falhou:", err);
                setLoading(false);
                setError(true);
            }
        };

        const handleError = (e: any) => {
            console.warn("Audio error (native):", audio.error);
            // Se der erro, tenta o fallback antes de desistir
            attemptFallbackLoad();
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('canplay', () => { setLoading(false); setError(false); });
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Attempt load
        audio.load();

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('canplay', () => setLoading(false));
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.pause();
        };
    }, [src]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percent = Math.min(Math.max(x / width, 0), 1);

        audioRef.current.currentTime = percent * duration;
        setProgress(percent * 100);
    };

    const handleDownload = async () => {
        try {
            console.log("Iniciando download...", src);
            const response = await fetch(src);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `audio-${Date.now()}.ogg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed, using fallback", err);
            window.open(src, '_blank');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Áudio - Gestão Odonto',
                    url: src
                });
            } catch (err) {
                console.error("Share failed", err);
            }
        } else {
            navigator.clipboard.writeText(src);
            alert("Link do áudio copiado!");
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100 min-w-[200px]">
                <span>⚠️ Erro ao carregar áudio</span>
            </div>
        );
    }

    // Variant Logic
    const isSent = variant === 'sent';

    const playBtnClass = isSent
        ? "bg-white/20 hover:bg-white/30 text-white shadow-none"
        : "bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-none";

    const waveActiveColor = isSent ? "bg-white" : "bg-blue-500";
    const waveInactiveColor = isSent ? "bg-white/30" : "bg-gray-300";
    const textColor = isSent ? "text-blue-50" : "text-gray-400";
    const playingTextColor = isSent ? "text-white" : "text-blue-600";

    // Icon color for dropdown trigger
    const menuIconColor = isSent ? "text-blue-100 hover:text-white" : "text-gray-400 hover:text-gray-600";

    return (
        <div className={cn("flex items-center gap-2 py-0.5 px-1 min-w-[200px] select-none group relative", className)}>
            <Button
                size="icon"
                className={cn("h-8 w-8 shrink-0 rounded-full transition-all", playBtnClass)}
                onClick={togglePlay}
                disabled={loading}
            >
                {loading ? (
                    <Spinner className="w-4 h-4 animate-spin" />
                ) : isPlaying ? (
                    <Pause weight="fill" className="w-3 h-3" />
                ) : (
                    <Play weight="fill" className="w-3 h-3 ml-0.5" />
                )}
            </Button>

            <div className="flex flex-col flex-1 gap-1 min-w-[100px] relative">
                <div className="absolute inset-0 z-10 cursor-pointer" onClick={handleWaveformClick} />

                <div className="flex items-center justify-between h-5 gap-[1.5px] opacity-90">
                    {waveformBars.map((height, i) => {
                        const active = (i / waveformBars.length) * 100 <= progress;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "w-0.5 sm:w-1 rounded-full transition-all duration-150",
                                    active ? waveActiveColor : waveInactiveColor
                                )}
                                style={{ height: `${height * 0.8}%` }}
                            />
                        );
                    })}
                </div>

                <div className={cn("flex justify-between text-[9px] font-medium px-0.5 tracking-tight -mt-0.5", textColor)}>
                    <span className={cn("transition-colors", isPlaying ? playingTextColor : "")}>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn("h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity", menuIconColor)}>
                        <DotsThreeVertical weight="bold" className="w-3.5 h-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownload} className="text-xs gap-2 cursor-pointer">
                        <DownloadSimple className="w-3.5 h-3.5" /> Baixar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShare} className="text-xs gap-2 cursor-pointer">
                        <ShareNetwork className="w-3.5 h-3.5" /> Compartilhar
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
