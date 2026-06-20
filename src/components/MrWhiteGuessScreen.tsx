import { useState } from 'react';
import { Check, X, ShieldAlert } from 'lucide-react';
import type { GameState } from '../hooks/useGameState';

interface MrWhiteGuessScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onSubmitGuess: (correct: boolean) => void;
}

export default function MrWhiteGuessScreen({ lang, gameState, onSubmitGuess }: MrWhiteGuessScreenProps) {
  const { players, currentWordPair, eliminatedPlayerId } = gameState;
  const eliminatedPlayer = players.find(p => p.id === eliminatedPlayerId);
  const civilWord = currentWordPair.civil;

  const [revealCivilWord, setRevealCivilWord] = useState(false);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--color-mr-white-bg)',
            border: '1px solid var(--color-mr-white-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            boxShadow: '0 0 15px var(--color-mr-white-border)',
          }}
        >
          <ShieldAlert size={28} style={{ color: 'var(--color-mr-white)' }} />
        </div>

        <h2 style={{ fontSize: '1.4rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
          {lang === 'fr' ? 'Élimination de Mr. White !' : 'Mr. White Voted Out!'}
        </h2>
        <div style={{ color: 'var(--color-mr-white)', fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem' }}>
          👤 {eliminatedPlayer?.name}
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          {lang === 'fr'
            ? "Mr. White a une dernière chance de voler la victoire ! Il doit deviner à haute voix le mot secret des Civils."
            : "Mr. White has one last chance to steal victory! He must guess the Civils' secret word aloud."}
        </p>

        {/* Civils Word reveal area for validation */}
        <div
          className="glass-card"
          style={{
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.05)',
            border: '1px dashed var(--glass-border-focus)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            {lang === 'fr' ? "Le mot secret des Civils était :" : "The Civils' secret word was:"}
          </div>
          
          {revealCivilWord ? (
            <div
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--color-civil)',
                textShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              {civilWord}
            </div>
          ) : (
            <button
              onClick={() => setRevealCivilWord(true)}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: 'auto' }}
            >
              {lang === 'fr' ? 'Afficher le mot secret' : 'Show Secret Word'}
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {lang === 'fr'
            ? "Mr. White a-t-il deviné le bon mot ?"
            : "Did Mr. White guess the word correctly?"}
        </div>

        {/* Action Validation buttons */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => onSubmitGuess(false)}
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', flex: 1 }}
          >
            <X size={18} />
            {lang === 'fr' ? 'Non' : 'No'}
          </button>
          <button
            onClick={() => onSubmitGuess(true)}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', flex: 1 }}
          >
            <Check size={18} />
            {lang === 'fr' ? 'Oui, gagné !' : 'Yes, correct!'}
          </button>
        </div>
      </div>
    </div>
  );
}
