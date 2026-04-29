import { useState, useEffect, useRef } from 'react';
import { BellRing, X, Volume2, VolumeX } from 'lucide-react';
import './AlarmNotification.css';

const DEFAULT_ALARM_SOUND = '/tuturu_1.mp3';

interface AlarmNotificationProps {
  blockTitle: string;
  minutesUntilStart: number;
  blockStartTime: string;
  alarmSoundPath: string | null;
  onDismiss: () => void;
}

export default function AlarmNotification({ blockTitle, minutesUntilStart, blockStartTime, alarmSoundPath, onDismiss }: AlarmNotificationProps) {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Use custom sound if provided, otherwise fall back to default tuturu_1.mp3
    const src = alarmSoundPath ?? DEFAULT_ALARM_SOUND;
    const audio = new Audio(src);
    audio.loop = true;
    audioRef.current = audio;

    audio.play().catch(() => {
      // Autoplay may be blocked on first interaction
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [alarmSoundPath]);

  const handleDismiss = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    onDismiss();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  return (
    <div className="alarm-overlay">
      <div className="alarm-popup">
        <div className="alarm-glow" />
        
        <div className="alarm-icon-container">
          <div className="alarm-icon-ring">
            <BellRing size={32} className="alarm-bell-icon" />
          </div>
        </div>

        <div className="alarm-body">
          <span className="alarm-badge">
            {minutesUntilStart <= 0 ? '¡Ahora!' : `En ${minutesUntilStart} min`}
          </span>
          <h2 className="alarm-title">{blockTitle}</h2>
          <p className="alarm-time">Comienza a las {blockStartTime}</p>
        </div>

        <div className="alarm-actions">
          <button className="alarm-btn alarm-btn-mute" onClick={toggleMute} title={isMuted ? 'Activar sonido' : 'Silenciar'}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button className="alarm-btn alarm-btn-dismiss" onClick={handleDismiss}>
            <X size={18} />
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
