import { useLocalStorage } from './useLocalStorage';
import { setupPlayers, checkVictory, shuffleArray } from '../utils/gameLogic';
import type { RoleSettings } from '../utils/gameLogic';
import { DEFAULT_CATEGORIES_EN, DEFAULT_CATEGORIES_FR } from '../data/defaultWords';

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
  hint?: string;
}

export interface GameState {
  players: Player[];
  status: GamePhase;
  currentWordPair: WordPair;
  currentCategory: string;
  currentCategoryId: string;
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
  enableHints?: boolean;
  hintTarget?: 'undercover' | 'mr_white' | 'both';
  playedWordIndices: Record<string, number[]>;
}

const initialGameState: GameState = {
  players: [],
  status: 'setup',
  currentWordPair: { civil: '', undercover: '' },
  currentCategory: '',
  currentCategoryId: '',
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
  enableHints: false,
  hintTarget: 'undercover',
  playedWordIndices: {},
};

export function getWordPairsForCategory(
  categoryId: string,
  lang: 'en' | 'fr'
): WordPair[] {
  let customLists: any[] = [];
  try {
    const stored = window.localStorage.getItem('undercover_custom_lists');
    if (stored) {
      customLists = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Error reading custom lists from localStorage:', e);
  }

  const customList = customLists.find(l => l.id === categoryId);
  if (customList) {
    return customList.pairs;
  }
  const categories = lang === 'fr' ? DEFAULT_CATEGORIES_FR : DEFAULT_CATEGORIES_EN;
  const defaultCategory = categories.find(c => c.id === categoryId);
  if (defaultCategory) {
    return defaultCategory.pairs.map(p => ({
      civil: p[0],
      undercover: p[1],
      hint: p[2]
    }));
  }
  return [];
}

export function pickWordPairWithExhaustionPool(
  categoryId: string,
  lang: 'en' | 'fr',
  currentPlayedMap: Record<string, number[]>
): { wordPair: WordPair; updatedMap: Record<string, number[]> } {
  let selectedPairs = getWordPairsForCategory(categoryId, lang);
  let activeCategoryId = categoryId;

  if (selectedPairs.length === 0) {
    const categories = lang === 'fr' ? DEFAULT_CATEGORIES_FR : DEFAULT_CATEGORIES_EN;
    selectedPairs = categories.flatMap(c => c.pairs.map(p => ({ civil: p[0], undercover: p[1] })));
    activeCategoryId = 'all_fallback';
  }

  const totalPairs = selectedPairs.length;
  let playedIndices = currentPlayedMap[activeCategoryId] || [];

  const hasOutOfBounds = playedIndices.some(idx => idx < 0 || idx >= totalPairs);
  if (playedIndices.length >= totalPairs || hasOutOfBounds) {
    playedIndices = [];
  }

  const unplayedIndices: number[] = [];
  for (let i = 0; i < totalPairs; i++) {
    if (!playedIndices.includes(i)) {
      unplayedIndices.push(i);
    }
  }

  let finalUnplayed = unplayedIndices;
  if (finalUnplayed.length === 0) {
    finalUnplayed = Array.from({ length: totalPairs }, (_, i) => i);
    playedIndices = [];
  }

  const randomUnplayedIdx = Math.floor(Math.random() * finalUnplayed.length);
  const pickedIndex = finalUnplayed[randomUnplayedIdx];

  const updatedPlayedIndices = [...playedIndices, pickedIndex];
  const wordPair = selectedPairs[pickedIndex];

  return {
    wordPair,
    updatedMap: {
      ...currentPlayedMap,
      [activeCategoryId]: updatedPlayedIndices,
    },
  };
}

export function useGameState() {
  const [gameState, setGameState] = useLocalStorage<GameState>('undercover_game_state', initialGameState);
  const [leaderboard, setLeaderboard] = useLocalStorage<Record<string, number>>('undercover_leaderboard', {});
  const [activeLanguage, setActiveLanguage] = useLocalStorage<'en' | 'fr'>('undercover_language', 'fr');

  // Start a new game
  const startGame = (
    playerNames: string[],
    roles: RoleSettings,
    categoryName: string,
    descriptionMode: 'guided' | 'verbal',
    timerDuration: number,
    categoryId: string,
    enableHints?: boolean,
    hintTarget?: 'undercover' | 'mr_white' | 'both'
  ) => {
    const playedMap = gameState.playedWordIndices || {};
    const { wordPair, updatedMap } = pickWordPairWithExhaustionPool(
      categoryId,
      activeLanguage,
      playedMap
    );

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
      currentCategoryId: categoryId,
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
      enableHints: enableHints || false,
      hintTarget: hintTarget || 'undercover',
      playedWordIndices: updatedMap,
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
      playedWordIndices: prev.playedWordIndices || {},
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

  // Play again (re-runs match directly using current configurations, keeping cumulative scores)
  const playAgain = () => {
    const categoryId = gameState.currentCategoryId || '';

    const playedMap = gameState.playedWordIndices || {};
    const { wordPair, updatedMap } = pickWordPairWithExhaustionPool(
      categoryId,
      activeLanguage,
      playedMap
    );

    const roleCounts = { civil: 0, undercover: 0, mrWhite: 0 };
    gameState.players.forEach(p => {
      if (p.role === 'civil') roleCounts.civil++;
      else if (p.role === 'undercover') roleCounts.undercover++;
      else if (p.role === 'mr_white') roleCounts.mrWhite++;
    });

    if (roleCounts.civil === 0 && roleCounts.undercover === 0 && roleCounts.mrWhite === 0) {
      roleCounts.civil = Math.max(1, gameState.players.length - 1);
      roleCounts.undercover = 1;
    }

    const playerNames = gameState.players.map(p => p.name);
    const newPlayers = setupPlayers(playerNames, roleCounts, wordPair);

    const hydratedPlayers = newPlayers.map(p => ({
      ...p,
      score: leaderboard[p.name.trim()] || 0,
    }));

    const randomStartPlayer = hydratedPlayers[Math.floor(Math.random() * hydratedPlayers.length)];

    const descriptionOrder = [
      randomStartPlayer.id,
      ...shuffleArray(hydratedPlayers.filter(p => p.id !== randomStartPlayer.id).map(p => p.id)),
    ];

    setGameState(prev => ({
      ...prev,
      players: hydratedPlayers,
      status: 'reveal',
      currentWordPair: wordPair,
      currentPlayerRevealIndex: 0,
      revealState: 'idle',
      startPlayerId: randomStartPlayer.id,
      descriptionOrder,
      currentDescriberIndex: 0,
      eliminatedPlayerId: null,
      mrWhiteGuessedCorrectly: null,
      pointsAwarded: false,
      playedWordIndices: updatedMap,
    }));
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
    playAgain,
  };
}
