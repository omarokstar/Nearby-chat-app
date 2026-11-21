import { useRef, useState, useEffect, useCallback } from 'react';
import { formatDuration } from '../utils';

interface Props {
  onSend: (blob: Blob, durationSec: number) => void;
  disabled?: boolean;
}

function getSupportedMimeType(): string {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

/**
 * In-browser voice audio recorder component.
 * Uses MediaRecorder with fallback audio MIME types to capture microphone streams,
 * track recording duration, and produce compressed audio blobs for message dispatch.
 */
export default function VoiceRecorder({ onSend, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permError, setPermError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startTimeRef = useRef(0);

  // Safely stops recording and terminates active audio tracks upon component unmount
  useEffect(() => {
    return () => {
      stop(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(
    (send: boolean) => {
      clearInterval(timerRef.current);
      const mr = recorderRef.current;
      if (!mr || mr.state === 'inactive') {
        setRecording(false);
        return;
      }

      mr.onstop = () => {
        mr.stream.getTracks().forEach((t) => t.stop());
        if (send && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType });
          const dur = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          onSend(blob, dur);
        }
        chunksRef.current = [];
        recorderRef.current = null;
        setRecording(false);
        setElapsed(0);
      };

      mr.stop();
    },
    [onSend],
  );

  const start = useCallback(async () => {
    setPermError(null);
    const mime = getSupportedMimeType();
    if (!mime) {
      setPermError('Audio recording is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(250);
      recorderRef.current = mr;
      startTimeRef.current = Date.now();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(sec);
        if (sec >= 300) {
          stop(true);
        }
      }, 250);
    } catch {
      setPermError('Microphone access denied. Please allow microphone access and try again.');
    }
  }, [stop]);

  if (permError) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#DD0000] px-2">
        <span>{permError}</span>
        <button
          onClick={() => setPermError(null)}
          className="underline hover:opacity-80"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 w-full px-1">
        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true" />
        <span className="text-xs font-semibold text-rose-500 tabular-nums">
          {formatDuration(elapsed)}
        </span>
        <div className="flex-1" />
        <button
          onClick={() => stop(false)}
          className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#5D5D5D] hover:bg-[#EFEFEF] transition-colors"
          aria-label="Cancel recording"
        >
          Cancel
        </button>
        <button
          onClick={() => stop(true)}
          className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#131313] text-white hover:opacity-85 transition-opacity"
          aria-label="Send recording"
        >
          Send
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={start}
      disabled={disabled}
      className="bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] rounded-[14px] size-9 flex items-center justify-center text-[#292929] dark:text-[#ccc] hover:bg-[#EFEFEF] dark:hover:bg-[#303030] transition-colors disabled:opacity-40 shrink-0"
      aria-label="Record voice message"
      title="Record voice message"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
    </button>
  );
}
