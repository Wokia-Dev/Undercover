import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';

interface DiscussionScreenProps {
  lang: 'en' | 'fr';
  timerDuration: number;
  onStartElimination: () => void;
}

export default function DiscussionScreen({ lang, timerDuration, onStartElimination }: DiscussionScreenProps) {
  const [seconds, setSeconds] = useState(timerDuration > 0 ? timerDuration : 0);
  const [isActive, setIsActive] = useState(true);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Reset timer state when timerDuration changes (e.g. on new game or reload)
    setSeconds(timerDuration > 0 ? timerDuration : 0);
    setIsActive(true);
  }, [timerDuration]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (timerDuration > 0) {
            // Count down mode
            if (prev <= 1) {
              setIsActive(false);
              return 0;
            }
            return prev - 1;
          } else {
            // Count up stopwatch mode
            return prev + 1;
          }
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timerDuration]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(timerDuration > 0 ? timerDuration : 0);
  };

  // Compute minutes and seconds
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine timer severity styles
  let timerClass = '';
  if (timerDuration > 0) {
    if (seconds <= 10) {
      timerClass = 'danger';
    } else if (seconds <= 30) {
      timerClass = 'warning';
    }
  } else {
    // Pulsing animation in count-up mode when active
    timerClass = isActive ? 'pulsing-timer' : '';
  }

  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'fr' ? 'Étape 3 : Discussion' : 'Phase 3: Discussion'}
          </span>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>
            {lang === 'fr' ? 'Débattez entre vous !' : 'Debate and Compare!'}
          </h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
            {lang === 'fr'
              ? "Discutez pour démasquer les Undercovers et Mr. White. Qui a donné l'indice le plus suspect ?"
              : "Compare clues and find the Undercovers or Mr. White. Who seems to have a different word?"}
          </p>

          <div className="timer-container">
            <div className={`timer-circle ${timerClass}`}>
              <span className="timer-val">{formatTime(seconds)}</span>
            </div>
            {timerDuration === 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⏱️ {lang === 'fr' ? 'Débat Libre (Chronomètre)' : 'Open Debate (Stopwatch)'}
              </div>
            )}
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={resetTimer}
              className="btn btn-secondary btn-icon"
              style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              title={lang === 'fr' ? 'Réinitialiser' : 'Reset'}
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={toggleTimer}
              className={`btn btn-icon ${isActive ? 'btn-secondary' : 'btn-accent'}`}
              style={{ width: '64px', height: '64px', borderRadius: '50%' }}
            >
              {isActive ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '4px' }} />}
            </button>
          </div>
        </div>
      </div>

      <button onClick={onStartElimination} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        {lang === 'fr' ? 'Passer au Vote' : 'Proceed to Vote'}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}
