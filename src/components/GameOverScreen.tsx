import { Trophy, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import type { GameState } from '../hooks/useGameState';
import { checkVictory } from '../utils/gameLogic';

interface GameOverScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onPlayAgain: () => void;
}

export default function GameOverScreen({ lang, gameState, onPlayAgain }: GameOverScreenProps) {
  const { players, currentWordPair, mrWhiteGuessedCorrectly } = gameState;
  
  // Re-run victory logic to get precise score distribution details for display
  const victory = checkVictory(players, mrWhiteGuessedCorrectly);

  // Render winner text and header styling
  let winnerTitle = '';
  let winnerSubtitle = '';
  let headerColor = 'var(--color-primary)';
  let HeaderIcon = Trophy;

  if (victory.outcome === 'civils_win') {
    winnerTitle = lang === 'fr' ? 'Victoire des Civils ! 🟢' : 'Civils Win! 🟢';
    winnerSubtitle = lang === 'fr' 
      ? 'Tous les infiltrés ont été éliminés.' 
      : 'All infiltrators have been voted out.';
    headerColor = 'var(--color-civil)';
    HeaderIcon = CheckCircle;
  } else if (victory.outcome === 'infiltrators_win') {
    winnerTitle = lang === 'fr' ? 'Victoire des Infiltrés ! 🟣' : 'Infiltrators Win! 🟣';
    winnerSubtitle = lang === 'fr'
      ? 'Il ne reste plus qu\'un seul Civil en vie.'
      : 'Only one Civil remains alive.';
    headerColor = 'var(--color-undercover)';
    HeaderIcon = Trophy;
  } else if (victory.outcome === 'mr_white_guess_win') {
    winnerTitle = lang === 'fr' ? 'Victoire de Mr. White ! ⚪' : 'Mr. White Wins! ⚪';
    winnerSubtitle = lang === 'fr'
      ? 'Mr. White a deviné le mot secret des Civils !'
      : 'Mr. White successfully guessed the Civils\' secret word!';
    headerColor = 'var(--color-mr-white)';
    HeaderIcon = ShieldAlert;
  }

  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'fr' ? 'Fin de Partie' : 'Game Over'}
          </span>
        </div>

        {/* Victory Header */}
        <div className="glass-card" style={{ textAlign: 'center', borderColor: headerColor, padding: '2rem 1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${headerColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
            }}
          >
            <HeaderIcon size={32} style={{ color: headerColor }} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.5rem' }}>
            {winnerTitle}
          </h2>
          <p style={{ color: '#cbd5e1' }}>{winnerSubtitle}</p>
        </div>

        {/* Word reveal summary */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)' }}>
            🔑 {lang === 'fr' ? 'Mots Secrets' : 'Secret Words'}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>🟢 {lang === 'fr' ? 'Civils : ' : 'Civils: '}</span>
              <strong style={{ color: '#10b981' }}>{currentWordPair.civil}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>🟣 {lang === 'fr' ? 'Undercover : ' : 'Undercover: '}</span>
              <strong style={{ color: '#a855f7' }}>{currentWordPair.undercover}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Players List with results */}
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
          🎭 {lang === 'fr' ? 'Rôles & Scores' : 'Roles & Scores'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {players.map((p) => {
            const pointsEarned = victory.scores[p.id] || 0;
            const isWinner = pointsEarned > 0;
            
            let roleBadgeLabel = '';
            let roleBadgeClass = '';
            if (p.role === 'civil') {
              roleBadgeLabel = lang === 'fr' ? 'Civil' : 'Civil';
              roleBadgeClass = 'role-civil';
            } else if (p.role === 'undercover') {
              roleBadgeLabel = lang === 'fr' ? 'Undercover' : 'Undercover';
              roleBadgeClass = 'role-undercover';
            } else {
              roleBadgeLabel = 'Mr. White';
              roleBadgeClass = 'role-mr_white';
            }

            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  margin: 0,
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderColor: isWinner ? headerColor : 'var(--glass-border)',
                  background: isWinner ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.1)',
                  opacity: p.isAlive ? 1 : 0.75,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ffffff' }}>
                      {p.name}
                    </span>
                    {!p.isAlive && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'var(--color-eliminated-bg)',
                          border: '1px solid var(--color-eliminated-border)',
                          color: 'var(--color-eliminated)',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {lang === 'fr' ? 'Éliminé' : 'Out'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span className={`revealed-role-badge ${roleBadgeClass}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', margin: 0 }}>
                      {roleBadgeLabel}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {p.role === 'mr_white' ? '' : `(${p.word})`}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: isWinner ? '#fbbf24' : '#cbd5e1' }}>
                    {pointsEarned > 0 ? `+${pointsEarned}` : '0'} pts
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {lang === 'fr' ? 'Total :' : 'Total:'} {p.score} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={onPlayAgain} className="btn btn-primary" style={{ marginTop: '2rem' }}>
        <RefreshCw size={18} />
        {lang === 'fr' ? 'Rejouer' : 'Play Again'}
      </button>
    </div>
  );
}
