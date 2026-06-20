import { useState } from 'react';
import { Eye, EyeOff, User } from 'lucide-react';
import type { GameState } from '../hooks/useGameState';

interface RevealScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onNextReveal: () => void;
}

export default function RevealScreen({ lang, gameState, onNextReveal }: RevealScreenProps) {
  const { players, currentPlayerRevealIndex } = gameState;
  const currentPlayer = players[currentPlayerRevealIndex];
  
  const [isFlipped, setIsFlipped] = useState(false);

  if (!currentPlayer) return null;

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDone = () => {
    setIsFlipped(false);
    // Timeout to let card flip back before changing player index
    setTimeout(() => {
      onNextReveal();
    }, 300);
  };


  // Set the theme for the card back based on the role
  let themeClass = 'mr_white-theme';
  if (currentPlayer.role === 'civil') themeClass = 'civil-theme';
  else if (currentPlayer.role === 'undercover') themeClass = 'undercover-theme';

  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'fr' ? 'Étape 1 : Révélation' : 'Phase 1: Secret Reveal'}
          </span>
          <div style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {lang === 'fr' ? `Joueur ${currentPlayerRevealIndex + 1} sur ${players.length}` : `Player ${currentPlayerRevealIndex + 1} of ${players.length}`}
          </div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ fontSize: '1.1rem', color: '#cbd5e1' }}>
            {lang === 'fr' ? 'Passez le téléphone à :' : 'Pass the phone to:'}
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ffffff', margin: '0.5rem 0 1rem 0' }}>
            👤 {currentPlayer.name}
          </div>
          <p style={{ fontSize: '0.9rem' }}>
            {isFlipped
              ? (lang === 'fr' ? "Regardez discrètement puis masquez la carte !" : "Look secretly, then hide the card!")
              : (lang === 'fr' ? "Appuyez sur la carte ci-dessous pour voir votre mot secret." : "Tap the card below to see your secret word.")
            }
          </p>
        </div>

        {/* 3D Flipping Card */}
        <div className="card-container" onClick={handleCardClick}>
          <div className={`reveal-card ${isFlipped ? 'flipped' : ''}`}>
            
            {/* Front of Card: Hidden State */}
            <div className="card-face card-front">
              <div className="card-icon-container">
                <Eye size={36} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', color: '#ffffff', fontWeight: 800 }}>
                {lang === 'fr' ? 'Révéler le secret' : 'Reveal Word'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#a5b4fc', marginTop: '0.5rem' }}>
                {lang === 'fr' ? 'Appuyez pour retourner' : 'Tap to flip'}
              </p>
            </div>

            {/* Back of Card: Revealed State */}
            <div className={`card-face card-back ${themeClass}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                <User size={16} />
                <span>{currentPlayer.name}</span>
              </div>

              {currentPlayer.role === 'mr_white' ? (
                <>
                  <div className="revealed-role-badge role-mr_white">
                    {lang === 'fr' ? 'Mr. White' : 'Mr. White'}
                  </div>
                  <div className="revealed-word" style={{ fontSize: '1.75rem', color: '#f8fafc' }}>
                    {lang === 'fr' ? 'Vous êtes Mr. White' : 'You are Mr. White'}
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {lang === 'fr'
                      ? "Vous n'avez aucun mot secret. Mentez et improvisez pour vous fondre dans la masse !"
                      : "You do not have a secret word. Blather and improvise to blend in with Civils!"}
                  </p>
                </>
              ) : (
                <>
                  <div className={`revealed-role-badge ${currentPlayer.role === 'civil' ? 'role-civil' : 'role-undercover'}`}>
                    {lang === 'fr' ? 'Agent Secret' : 'Secret Agent'}
                  </div>
                  <div className="revealed-word" style={{ color: currentPlayer.role === 'civil' ? '#10b981' : '#a855f7' }}>
                    {currentPlayer.word}
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                    {lang === 'fr'
                      ? "Décrivez ce mot en un mot ou une courte phrase sans éveiller les soupçons !"
                      : "Describe this word in a single word or short phrase without raising suspicion!"}
                  </p>
                </>
              )}

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1.5rem' }}>
                {lang === 'fr' ? 'Appuyez pour masquer' : 'Tap to hide'}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div>
        {isFlipped ? (
          <button onClick={handleDone} className="btn btn-primary">
            <EyeOff size={18} />
            {lang === 'fr' ? 'Masquer & Continuer' : 'Hide & Continue'}
          </button>
        ) : (
          <button onClick={handleCardClick} className="btn btn-secondary">
            <Eye size={18} />
            {lang === 'fr' ? 'Révéler' : 'Reveal'}
          </button>
        )}
      </div>
    </div>
  );
}
