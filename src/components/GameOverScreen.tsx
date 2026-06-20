import { Trophy, RefreshCw, CheckCircle, ShieldAlert } from 'lucide-react';
import type { GameState } from '../hooks/useGameState';
import { checkVictory } from '../utils/gameLogic';

interface GameOverScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onResetScores: () => void;
}

export default function GameOverScreen({
  lang,
  gameState,
  onPlayAgain,
  onBackToMenu,
  onResetScores,
}: GameOverScreenProps) {
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

  // Sort players by cumulative score descending, then alphabetically by name if tied
  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });

  const handleResetScores = () => {
    const confirmed = window.confirm(
      lang === 'fr'
        ? "Voulez-vous vraiment réinitialiser tous les scores ?"
        : "Are you sure you want to reset all scores?"
    );
    if (confirmed) {
      onResetScores();
    }
  };

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
          <h2 style={{ fontSize: '1.8rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
            {winnerTitle}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{winnerSubtitle}</p>
        </div>

        {/* Word reveal summary */}
        <div className="glass-card" style={{ padding: '1rem 1.25rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)' }}>
            🔑 {lang === 'fr' ? 'Mots Secrets' : 'Secret Words'}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>🟢 {lang === 'fr' ? 'Civils : ' : 'Civils: '}</span>
              <strong style={{ color: 'var(--color-civil)' }}>{currentWordPair.civil}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)' }}>🟣 {lang === 'fr' ? 'Undercover : ' : 'Undercover: '}</span>
              <strong style={{ color: 'var(--color-undercover)' }}>{currentWordPair.undercover}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Players List with results */}
        <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
          🎭 {lang === 'fr' ? 'Scoreboard Final' : 'Final Scoreboard'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedPlayers.map((p, idx) => {
            const pointsEarned = victory.scores[p.id] || 0;
            
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

            // Determine ranking/podium badging
            let podiumBadge = '';
            let rankBorder = 'var(--glass-border)';
            let backgroundStyle = 'rgba(0, 0, 0, 0.1)';

            if (idx === 0) {
              podiumBadge = '🥇';
              rankBorder = 'rgba(251, 191, 36, 0.4)';
              backgroundStyle = 'rgba(251, 191, 36, 0.03)';
            } else if (idx === 1) {
              podiumBadge = '🥈';
              rankBorder = 'rgba(226, 232, 240, 0.3)';
              backgroundStyle = 'rgba(226, 232, 240, 0.02)';
            } else if (idx === 2) {
              podiumBadge = '🥉';
              rankBorder = 'rgba(217, 119, 6, 0.3)';
              backgroundStyle = 'rgba(217, 119, 6, 0.02)';
            }

            // Role-themed color variables for point indicators
            let pointsBadgeBg = 'rgba(255, 255, 255, 0.1)';
            let pointsBadgeColor = '#ffffff';
            if (p.role === 'civil') {
              pointsBadgeBg = 'rgba(16, 185, 129, 0.15)';
              pointsBadgeColor = 'var(--color-civil)';
            } else if (p.role === 'undercover') {
              pointsBadgeBg = 'rgba(168, 85, 247, 0.15)';
              pointsBadgeColor = 'var(--color-undercover)';
            } else if (p.role === 'mr_white') {
              pointsBadgeBg = 'rgba(226, 232, 240, 0.15)';
              pointsBadgeColor = 'var(--color-mr-white)';
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
                  borderColor: rankBorder,
                  background: backgroundStyle,
                  opacity: p.isAlive ? 1 : 0.65,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {podiumBadge && <span style={{ fontSize: '1.2rem', marginRight: '0.15rem' }}>{podiumBadge}</span>}
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                      {p.name}
                    </span>
                    {!p.isAlive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>💀</span>
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
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                    <span className={`revealed-role-badge ${roleBadgeClass}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', margin: 0 }}>
                      {roleBadgeLabel}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {p.role === 'mr_white' ? '' : `(${p.word})`}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    {pointsEarned > 0 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: pointsBadgeBg,
                          color: pointsBadgeColor,
                          border: `1px solid ${pointsBadgeColor}33`,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '12px',
                        }}
                      >
                        +{pointsEarned}
                      </span>
                    )}
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                      {p.score} pts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                    {lang === 'fr' ? 'Total' : 'Total'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
        <button onClick={onPlayAgain} className="btn btn-primary" style={{ width: '100%' }}>
          <RefreshCw size={18} />
          {lang === 'fr' ? 'Rejouer (Garder les scores) 🔁' : 'Play Again (Keep Scores) 🔁'}
        </button>

        <button onClick={onBackToMenu} className="btn btn-secondary" style={{ width: '100%' }}>
          {lang === 'fr' ? 'Retour au Menu Principal 🏠' : 'Back to Main Menu 🏠'}
        </button>

        <button
          onClick={handleResetScores}
          className="btn btn-secondary"
          style={{
            width: '100%',
            borderColor: 'transparent',
            background: 'transparent',
            color: '#f43f5e',
            fontSize: '0.85rem',
            padding: '0.5rem',
            marginTop: '0.5rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          🛑 {lang === 'fr' ? 'Réinitialiser tous les scores' : 'Reset All Scores'}
        </button>
      </div>
    </div>
  );
}
