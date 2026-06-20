import { useState } from 'react';
import { UserMinus, Check } from 'lucide-react';
import type { GameState, Player } from '../hooks/useGameState';

interface EliminationScreenProps {
  lang: 'en' | 'fr';
  gameState: GameState;
  onEliminatePlayer: (playerId: string) => void;
  onSkipElimination: () => void;
}

export default function EliminationScreen({ lang, gameState, onEliminatePlayer, onSkipElimination }: EliminationScreenProps) {
  const { players } = gameState;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (player: Player) => {
    if (!player.isAlive) return;
    setSelectedId(player.id === selectedId ? null : player.id);
  };

  const handleConfirm = () => {
    if (!selectedId) {
      alert(
        lang === 'fr'
          ? 'Veuillez sélectionner le joueur éliminé par le vote.'
          : 'Please select the player who was voted out.'
      );
      return;
    }
    onEliminatePlayer(selectedId);
  };


  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'fr' ? 'Étape 4 : Élimination' : 'Phase 4: Elimination'}
          </span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', textAlign: 'center' }}>
            {lang === 'fr' ? 'Qui est éliminé ?' : 'Who is voted out?'}
          </h2>
          <p style={{ fontSize: '0.9rem', textAlign: 'center' }}>
            {lang === 'fr'
              ? 'Sélectionnez le joueur ayant récolté la majorité des votes puis validez.'
              : 'Tap the player who received the most votes to eliminate them.'}
          </p>
        </div>

        <div className="elimination-grid">
          {players.map((player) => {
            const isSelected = player.id === selectedId;
            const isAlive = player.isAlive;

            return (
              <div
                key={player.id}
                onClick={() => handleSelect(player)}
                className={`vote-card ${isSelected ? 'selected' : ''} ${!isAlive ? 'eliminated' : ''}`}
              >
                {!isAlive && (
                  <div className="vote-card-dead-label">
                    {lang === 'fr' ? 'Éliminé' : 'Eliminated'}
                  </div>
                )}
                
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--color-eliminated)' : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  <UserMinus size={18} style={{ color: isSelected ? '#ffffff' : '#cbd5e1' }} />
                </div>

                <div className="vote-card-name">{player.name}</div>
                <div className="vote-card-score">{player.score} pts</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={handleConfirm} className="btn btn-danger">
          <Check size={18} />
          {lang === 'fr' ? `Confirmer l'élimination` : 'Confirm Elimination'}
        </button>
        <button onClick={onSkipElimination} className="btn btn-secondary">
          {lang === 'fr' ? 'Sauter le vote / Faire un autre tour' : 'Skip Elimination / Do Another Round'}
        </button>
      </div>
    </div>
  );
}
