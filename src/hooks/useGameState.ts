import { useLocalStorage } from './useLocalStorage';
import { setupPlayers, checkVictory, shuffleArray } from '../utils/gameLogic';
import type { RoleSettings } from '../utils/gameLogic';

export type PlayerRole = 'civil' | 'undercover' | 'mr_white';

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  word: string;
  isAlive: boolean;
  score: number;
}

export type GamePhase =
  | 'setup'
  | 'reveal'
  | 'description'
  | 'discussion'
  | 'elimination'
  | 'mr_white_guess'
  | 'game_over';

export interface WordPair {
  civil: string;
  undercover: string;
}

export interface GameState {
  players: Player[];
  status: GamePhase;
  currentWordPair: WordPair;
  currentCategory: string;
  currentPlayerRevealIndex: number;
  revealState: 'idle' | 'showing' | 'hidden';
  startPlayerId: string;
  descriptionOrder: string[];
  currentDescriberIndex: number;
  eliminatedPlayerId: string | null;
  mrWhiteGuessedCorrectly: boolean | null;
  pointsAwarded: boolean;
  descriptionMode: 'guided' | 'verbal';
  timerDuration: number;
}

const initialGameState: GameState = {
  players: [],
  status: 'setup',
  currentWordPair: { civil: '', undercover: '' },
  currentCategory: '',
  currentPlayerRevealIndex: 0,
  revealState: 'idle',
  startPlayerId: '',
  descriptionOrder: [],
  currentDescriberIndex: 0,
  eliminatedPlayerId: null,
  mrWhiteGuessedCorrectly: null,
  pointsAwarded: false,
  descriptionMode: 'guided',
  timerDuration: 90,
};

export function useGameState() {
  const [gameState, setGameState] = useLocalStorage<GameState>('undercover_game_state', initialGameState);
  const [leaderboard, setLeaderboard] = useLocalStorage<Record<string, number>>('undercover_leaderboard', {});
  const [activeLanguage, setActiveLanguage] = useLocalStorage<'en' | 'fr'>('undercover_language', 'fr');

  // Start a new game
  const startGame = (
    playerNames: string[],
    roles: RoleSettings,
    wordPair: WordPair,
    categoryName: string,
    descriptionMode: 'guided' | 'verbal',
    timerDuration: number
  ) => {
    // Generate fresh players with roles and words
    const newPlayers = setupPlayers(playerNames, roles, wordPair);

    // Hydrate scores from leaderboard if players with the same name exist
    const hydratedPlayers = newPlayers.map(p => ({
      ...p,
      score: leaderboard[p.name.trim()] || 0,
    }));

    // Choose random starting player among alive players
    const randomStartPlayer = hydratedPlayers[Math.floor(Math.random() * hydratedPlayers.length)];

    // Create description order starting with the random starting player, then others shuffled
    const descriptionOrder = [
      randomStartPlayer.id,
      ...shuffleArray(hydratedPlayers.filter(p => p.id !== randomStartPlayer.id).map(p => p.id)),
    ];

    setGameState({
      players: hydratedPlayers,
      status: 'reveal',
      currentWordPair: wordPair,
      currentCategory: categoryName,
      currentPlayerRevealIndex: 0,
      revealState: 'idle',
      startPlayerId: randomStartPlayer.id,
      descriptionOrder,
      currentDescriberIndex: 0,
      eliminatedPlayerId: null,
      mrWhiteGuessedCorrectly: null,
      pointsAwarded: false,
      descriptionMode,
      timerDuration,
    });
  };

  // Next player reveals their word
  const nextReveal = () => {
    setGameState(prev => {
      const nextIndex = prev.currentPlayerRevealIndex + 1;
      if (nextIndex < prev.players.length) {
        return {
          ...prev,
          currentPlayerRevealIndex: nextIndex,
          revealState: 'idle',
        };
      } else {
        // All players revealed, transition to Description phase
        return {
          ...prev,
          status: 'description',
          currentPlayerRevealIndex: 0,
          currentDescriberIndex: 0,
        };
      }
    });
  };

  // Toggle reveal state (showing word vs hidden)
  const setRevealState = (state: 'idle' | 'showing' | 'hidden') => {
    setGameState(prev => ({
      ...prev,
      revealState: state,
    }));
  };

  // Turn-based description loop
  const nextDescriber = () => {
    setGameState(prev => {
      const nextIndex = prev.currentDescriberIndex + 1;
      if (prev.descriptionMode === 'guided' && nextIndex < prev.descriptionOrder.length) {
        return {
          ...prev,
          currentDescriberIndex: nextIndex,
        };
      } else {
        // Everyone described (or Verbal mode bypass) -> transition to discussion
        return {
          ...prev,
          status: 'discussion',
        };
      }
    });
  };

  // Transition helper from discussion to elimination voting
  const startElimination = () => {
    setGameState(prev => ({
      ...prev,
      status: 'elimination',
      eliminatedPlayerId: null,
    }));
  };

  // Process player elimination
  const eliminatePlayer = (playerId: string) => {
    setGameState(prev => {
      // Mark player as dead
      const updatedPlayers = prev.players.map(p =>
        p.id === playerId ? { ...p, isAlive: false } : p
      );

      const eliminatedPlayer = prev.players.find(p => p.id === playerId);
      
      // If Mr. White is eliminated, they get a chance to guess
      if (eliminatedPlayer?.role === 'mr_white') {
        return {
          ...prev,
          players: updatedPlayers,
          status: 'mr_white_guess',
          eliminatedPlayerId: playerId,
        };
      }

      // Otherwise, evaluate standard victory conditions
      const victory = checkVictory(updatedPlayers, null);
      if (victory.outcome !== 'ongoing') {
        // Update local leaderboard and player scores
        const newLeaderboard = { ...leaderboard };
        const finalPlayers = updatedPlayers.map(p => {
          const points = victory.scores[p.id] || 0;
          if (points > 0) {
            const cleanName = p.name.trim();
            newLeaderboard[cleanName] = (newLeaderboard[cleanName] || 0) + points;
            return { ...p, score: p.score + points };
          }
          return p;
        });

        setLeaderboard(newLeaderboard);

        return {
          ...prev,
          players: finalPlayers,
          status: 'game_over',
          eliminatedPlayerId: playerId,
          pointsAwarded: true,
        };
      }

      // Game goes on -> start a new description round
      // Re-generate description order with only alive players
      const alivePlayers = updatedPlayers.filter(p => p.isAlive);
      const randomStart = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const nextOrder = [
        randomStart.id,
        ...shuffleArray(alivePlayers.filter(p => p.id !== randomStart.id).map(p => p.id)),
      ];

      return {
        ...prev,
        players: updatedPlayers,
        status: 'description',
        descriptionOrder: nextOrder,
        currentDescriberIndex: 0,
        eliminatedPlayerId: playerId,
        startPlayerId: randomStart.id,
      };
    });
  };

  // Submit Mr. White guess and conclude match
  const submitMrWhiteGuess = (guessCorrect: boolean) => {
    setGameState(prev => {
      // Evaluate victory based on Mr. White's guess
      const victory = checkVictory(prev.players, guessCorrect);
      
      const newLeaderboard = { ...leaderboard };
      const finalPlayers = prev.players.map(p => {
        const points = victory.scores[p.id] || 0;
        if (points > 0) {
          const cleanName = p.name.trim();
          newLeaderboard[cleanName] = (newLeaderboard[cleanName] || 0) + points;
          return { ...p, score: p.score + points };
        }
        return p;
      });

      setLeaderboard(newLeaderboard);

      return {
        ...prev,
        players: finalPlayers,
        status: 'game_over',
        mrWhiteGuessedCorrectly: guessCorrect,
        pointsAwarded: true,
      };
    });
  };

  // Return to setup configuration screen
  const resetGame = () => {
    setGameState(prev => ({
      ...initialGameState,
      players: prev.players.map(p => ({
        ...p,
        isAlive: true,
        role: 'civil',
        word: '',
      })),
      status: 'setup',
    }));
  };

  // Reset all cumulative points
  const clearLeaderboard = () => {
    setLeaderboard({});
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => ({ ...p, score: 0 })),
    }));
  };

  // Skip elimination phase to do another round of clues
  const skipElimination = () => {
    setGameState(prev => {
      // Re-generate description order with only alive players
      const alivePlayers = prev.players.filter(p => p.isAlive);
      const randomStart = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
      const nextOrder = [
        randomStart.id,
        ...shuffleArray(alivePlayers.filter(p => p.id !== randomStart.id).map(p => p.id)),
      ];

      return {
        ...prev,
        status: 'description',
        descriptionOrder: nextOrder,
        currentDescriberIndex: 0,
        eliminatedPlayerId: null,
        startPlayerId: randomStart.id,
      };
    });
  };

  return {
    gameState,
    leaderboard,
    activeLanguage,
    setActiveLanguage,
    startGame,
    nextReveal,
    setRevealState,
    nextDescriber,
    startElimination,
    eliminatePlayer,
    submitMrWhiteGuess,
    skipElimination,
    resetGame,
    clearLeaderboard,
  };
}
