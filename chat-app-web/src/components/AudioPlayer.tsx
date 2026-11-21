import { useRef, useState, useEffect, useCallback } from 'react';
import { useAudioBlob } from '../hooks/useAudioBlob';
import { formatDuration } from '../utils';

interface Props {
  messageId: string;
  audioUrl: string | null;
  durationSec: number | null;
}

/**
 * Audio playback component for voice notes.
 * Fetches authenticated audio blobs via object URL, renders interactive timeline seek bar,
 * and tracks real-time elapsed playback position.
 */
export default function AudioPlayer({ messageId, audioUrl, durationSec }: Props) {
  const { objectUrl, loading, error, load } = useAudioBlob(messageId, audioUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
    } else {
      // Audio playback initiated on user action; catches and silences browser autoplay restrictions
      a.play().catch(() => {});
    }
  }, [playing]);

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    setProgress((a.currentTime / a.duration) * 100);
    setCurrentTime(a.currentTime);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
  };

  if (error) {
    return <span className="text-xs text-[#DD0000] italic">{error}</span>;
  }

  if (loading || !objectUrl) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#868686]">
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        Loading voice message…
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] py-0.5">
      <audio
        ref={audioRef}
        src={objectUrl}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-[#131313] text-white dark:bg-white dark:text-[#131313] flex items-center justify-center transition-opacity hover:opacity-85 shrink-0"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div
          className="h-1.5 rounded-full bg-[#E3E3E3] dark:bg-[#333] cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="absolute inset-y-0 left-0 bg-[#131313] dark:bg-white rounded-full transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] text-[#868686] tabular-nums font-medium">
          {playing || currentTime > 0
            ? formatDuration(currentTime)
            : formatDuration(durationSec ?? 0)}
        </span>
      </div>
    </div>
  );
}
