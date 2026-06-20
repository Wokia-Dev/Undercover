import { useState } from 'react';
import { Volume2, ChevronRight, Eye } from 'lucide-react';
import type { GameState } from '../hooks/useGameState';

interface DescriptionScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onNextDescriber: () => void;
}

export default function DescriptionScreen({ lang, gameState, onNextDescriber }: DescriptionScreenProps) {
  const { players, descriptionOrder, currentDescriberIndex, descriptionMode, startPlayerId } = gameState;
  const currentDescriberId = descriptionOrder[currentDescriberIndex];
  const currentDescriber = players.find(p => p.id === currentDescriberId);

  const [isPeeking, setIsPeeking] = useState(false);

  if (!currentDescriber) return null;

  const handlePeekStart = () => setIsPeeking(true);
  const handlePeekEnd = () => setIsPeeking(false);

  const isLastDescriber = currentDescriberIndex === descriptionOrder.length - 1;

  // Verbal Mode screen layout
  if (descriptionMode === 'verbal') {
    // Dynamically retrieve the starting player based on startPlayerId or the first element in descriptionOrder
    const startPlayer = players.find(p => p.id === startPlayerId) || players.find(p => p.id === descriptionOrder[0]) || players[0];

    return (
      <div className="screen-wrapper">
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {lang === 'fr' ? 'Étape 2 : Description' : 'Phase 2: Description'}
            </span>
            <div style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              {lang === 'fr' ? 'Mode Verbal Direct' : 'Direct Verbal Mode'}
            </div>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <div className="card-icon-container" style={{ margin: '0 auto 1.5rem auto' }}>
              <Volume2 size={36} style={{ color: 'var(--color-accent)' }} />
            </div>

            <div className="turn-indicator" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#ffffff' }}>
                {lang === 'fr' ? '📢 À toi de commencer !' : "📢 It's your turn to start!"}
              </h2>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--color-accent)',
                  textShadow: '0 0 25px var(--color-accent-glow)',
                  margin: '0.75rem 0',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {startPlayer?.name}
              </div>
            </div>

            {/* Structured Step Instructions */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🗣️</span>
                <span>
                  {lang === 'fr'
                    ? "Parlez à voix haute autour de la table."
                    : "Speak out loud around the table."}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🔄</span>
                <span>
                  {lang === 'fr'
                    ? `Tournez dans le sens horaire à partir de `
                    : `Go clockwise from `}
                  <strong>{startPlayer?.name}</strong>.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>🔑</span>
                <span>
                  {lang === 'fr'
                    ? "Chacun donne exactement UN seul indice."
                    : "Everyone gives exactly ONE clue."}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: '#fbbf24', fontWeight: 600 }}>
                <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>⚪</span>
                <span>
                  {lang === 'fr'
                    ? "Mr. White, vous devez improviser !"
                    : "Mr. White, you must improvise!"}
                </span>
              </div>
            </div>
          </div>

          {/* Table order preview */}
          <div className="glass-card" style={{ padding: '1rem' }}>
            <div className="input-label" style={{ marginBottom: '0.5rem', fontSize: '0.75rem' }}>
              {lang === 'fr' ? 'Ordre de passage :' : 'Clue Order:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {descriptionOrder.map((id, idx) => {
                const player = players.find(p => p.id === id);
                const isStart = id === startPlayerId || id === (startPlayer?.id);
                return (
                  <span
                    key={id}
                    style={{
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-full)',
                      background: isStart ? 'var(--color-accent-glow)' : 'rgba(255, 255, 255, 0.05)',
                      border: isStart ? '1px solid var(--color-accent)' : '1px solid var(--glass-border)',
                      fontSize: '0.8rem',
                      fontWeight: isStart ? 700 : 500,
                      color: isStart ? '#ffffff' : '#cbd5e1',
                    }}
                  >
                    {idx + 1}. {player?.name}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <button onClick={onNextDescriber} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          {lang === 'fr' ? 'Tout le monde a décrit ? Lancer le débat ⏱️' : 'Everyone described? Start Discussion ⏱️'}
        </button>
      </div>
    );
  }

  // Guided Mode screen layout (default turn-based)
  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'fr' ? 'Étape 2 : Description' : 'Phase 2: Description'}
          </span>
          <div style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.25rem' }}>
            {lang === 'fr' ? `Clue ${currentDescriberIndex + 1} sur ${descriptionOrder.length}` : `Clue ${currentDescriberIndex + 1} of ${descriptionOrder.length}`}
          </div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div className="card-icon-container" style={{ margin: '0 auto 1.5rem auto' }}>
            <Volume2 size={36} style={{ color: 'var(--color-accent)' }} />
          </div>

          <div className="turn-indicator">
            <span style={{ fontSize: '0.9rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {lang === 'fr' ? "C'est le tour de :" : "Active Player:"}
            </span>
            <div className="describer-name">{currentDescriber.name}</div>
          </div>

          <p style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '2rem' }}>
            {lang === 'fr'
              ? "Donnez un mot ou indice verbal à haute voix pour décrire votre mot secret !"
              : "Give a single word or short phrase clue aloud to describe your secret word!"}
          </p>

          {/* Discreet Hold to Peek */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onMouseDown={handlePeekStart}
              onMouseUp={handlePeekEnd}
              onMouseLeave={handlePeekEnd}
              onTouchStart={handlePeekStart}
              onTouchEnd={handlePeekEnd}
              className="btn btn-secondary"
              style={{
                width: 'auto',
                padding: '0.6rem 1.25rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
              }}
            >
              <Eye size={16} />
              {lang === 'fr' ? "Maintenir pour voir mon mot" : "Hold to Peek Word"}
            </button>

            <div style={{ minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPeeking && (
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: currentDescriber.role === 'civil' ? '#10b981' : currentDescriber.role === 'undercover' ? '#a855f7' : '#e2e8f0',
                    animation: 'fadeIn 0.15s ease-out',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '0.25rem 1rem',
                    borderRadius: '4px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {currentDescriber.role === 'mr_white'
                    ? (lang === 'fr' ? '⚪ Vous êtes Mr. White' : '⚪ You are Mr. White')
                    : `🔑 ${currentDescriber.word}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Turn Progress dots */}
        <div className="clue-progress">
          {descriptionOrder.map((playerId, idx) => {
            const player = players.find(p => p.id === playerId);
            let stateClass = '';
            if (idx === currentDescriberIndex) stateClass = 'active';
            else if (idx < currentDescriberIndex) stateClass = 'passed';
            
            return (
              <div
                key={playerId}
                className={`progress-dot ${stateClass}`}
                title={player?.name}
              />
            );
          })}
        </div>
      </div>

      <button onClick={onNextDescriber} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
        {isLastDescriber ? (lang === 'fr' ? 'Lancer le Débat' : 'Start Debate') : (lang === 'fr' ? 'Joueur Suivant' : 'Next Player')}
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
