import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

interface VoiceMessagePlayerProps {
  url?: string;
  duration?: number;
  waveform?: number[];
  isOwn: boolean;
}

const DEFAULT_WAVEFORM = [
  0.2, 0.35, 0.55, 0.4, 0.75, 0.9, 0.6, 0.35, 0.7, 0.85, 0.55, 0.4, 0.8, 0.65,
  0.3, 0.5, 0.85, 0.7, 0.45, 0.6, 0.9, 0.5, 0.35, 0.55, 0.4, 0.25,
];

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  url,
  duration = 5,
  waveform = DEFAULT_WAVEFORM,
  isOwn,
}) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [actualDuration, setActualDuration] = useState<number>(duration);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setActualDuration(duration);
  }, [duration]);

  const togglePlay = async () => {
    setErrorMsg(null);
    const audio = audioRef.current;
    if (!url || !audio) {
      setErrorMsg('Немає аудіофайлу');
      return;
    }

    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        // Pause any other playing audio elements on the page
        document.querySelectorAll('audio').forEach((el) => {
          if (el !== audio) el.pause();
        });
        audio.playbackRate = speed;
        await audio.play();
        setPlaying(true);
      }
    } catch (err) {
      console.error('Audio play error:', err);
      setErrorMsg('Помилка відтворення');
      setPlaying(false);
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSpeed: 1 | 1.5 | 2 = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleBarClick = (index: number) => {
    const ratio = index / waveform.length;
    setProgress(ratio);
    const audio = audioRef.current;
    if (audio) {
      const total =
        audio.duration && isFinite(audio.duration)
          ? audio.duration
          : actualDuration;
      if (total > 0) {
        audio.currentTime = ratio * total;
        setCurrentTime(audio.currentTime);
      }
    }
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.round(sec));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  const displayedSec = playing || currentTime > 0 ? currentTime : actualDuration;

  return (
    <div className={`kolo-voice-player ${isOwn ? 'own' : 'incoming'}`}>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (d && isFinite(d) && d > 0) {
              setActualDuration(d);
            }
          }}
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            const total =
              el.duration && isFinite(el.duration) && el.duration > 0
                ? el.duration
                : actualDuration;
            setCurrentTime(el.currentTime);
            if (total > 0) {
              setProgress(Math.min(1, el.currentTime / total));
            }
          }}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setCurrentTime(0);
          }}
        />
      )}

      <button
        type="button"
        className="kolo-voice-play-btn"
        onClick={togglePlay}
        title={playing ? 'Пауза' : 'Відтворити голосове'}
      >
        {playing ? (
          <Pause size={18} />
        ) : (
          <Play size={18} style={{ marginLeft: 2 }} />
        )}
      </button>

      <div className="kolo-voice-body">
        <div className="kolo-voice-waveform">
          {waveform.map((val, idx) => {
            const active = idx / waveform.length <= progress;
            return (
              <span
                key={idx}
                onClick={() => handleBarClick(idx)}
                className={`kolo-wave-bar ${active ? 'active' : ''}`}
                style={{ height: `${Math.max(16, Math.round(val * 100))}%` }}
              />
            );
          })}
        </div>
        <div className="kolo-voice-meta">
          <span>
            {errorMsg ? (
              errorMsg
            ) : (
              <>
                <Volume2
                  size={11}
                  style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }}
                />
                {formatTime(displayedSec)}
              </>
            )}
          </span>
          <button
            type="button"
            className="kolo-voice-speed-btn"
            onClick={cycleSpeed}
            title="Швидкість відтворення"
          >
            {speed}x
          </button>
        </div>
      </div>
    </div>
  );
};
