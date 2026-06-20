import type { Player, PlayerRole, WordPair } from '../hooks/useGameState';


export interface RoleSettings {
  civil: number;
  undercover: number;
  mrWhite: number;
}

/**
 * Suggests a balanced distribution of roles based on the total number of players.
 */
export function getRecommendedRoles(totalPlayers: number): RoleSettings {
  if (totalPlayers < 3) {
    return { civil: 2, undercover: 1, mrWhite: 0 };
  }

  switch (totalPlayers) {
    case 3:
      return { civil: 2, undercover: 1, mrWhite: 0 };
    case 4:
      return { civil: 3, undercover: 1, mrWhite: 0 };
    case 5:
      return { civil: 3, undercover: 1, mrWhite: 1 };
    case 6:
      return { civil: 4, undercover: 1, mrWhite: 1 };
    case 7:
      return { civil: 5, undercover: 1, mrWhite: 1 };
    case 8:
      return { civil: 5, undercover: 2, mrWhite: 1 };
    case 9:
      return { civil: 6, undercover: 2, mrWhite: 1 };
    case 10:
      return { civil: 6, undercover: 2, mrWhite: 2 };
    case 11:
      return { civil: 7, undercover: 2, mrWhite: 2 };
    case 12:
      return { civil: 8, undercover: 2, mrWhite: 2 };
    default: {
      const undercover = Math.max(2, Math.floor(totalPlayers * 0.2));
      const mrWhite = Math.max(1, Math.floor(totalPlayers * 0.15));
      const civil = totalPlayers - undercover - mrWhite;
      return { civil, undercover, mrWhite };
    }
  }
}

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates and shuffles players and roles.
 */
export function setupPlayers(
  playerNames: string[],
  settings: RoleSettings,
  wordPair: WordPair
): Player[] {
  const { civil, undercover, mrWhite } = settings;
  
  // Create lists of roles
  const roles: PlayerRole[] = [];
  for (let i = 0; i < civil; i++) roles.push('civil');
  for (let i = 0; i < undercover; i++) roles.push('undercover');
  for (let i = 0; i < mrWhite; i++) roles.push('mr_white');

  // Shuffle roles
  const shuffledRoles = shuffleArray(roles);

  // Map to player objects
  return playerNames.map((name, index) => {
    const role = shuffledRoles[index];
    let word = '';
    if (role === 'civil') {
      word = wordPair.civil;
    } else if (role === 'undercover') {
      word = wordPair.undercover;
    } else {
      word = ''; // Mr. White has no word
    }

    return {
      id: `player_${index}_${Date.now()}`,
      name: name || `Player ${index + 1}`,
      role,
      word,
      isAlive: true,
      score: 0, // Cumulative score will be merged from existing players
    };
  });
}

export type VictoryOutcome = 'ongoing' | 'civils_win' | 'infiltrators_win' | 'mr_white_guess_win';

export interface VictoryResult {
  outcome: VictoryOutcome;
  winners: PlayerRole[];
  scores: Record<string, number>; // Maps player IDs to points awarded in this round
}

/**
 * Checks the victory condition of the game.
 * 
 * - Civils Win: All Undercovers and Mr. Whites are eliminated. (Civils get 2 points each).
 * - Infiltrators Win: Only 1 Civil remains alive. (Undercovers get 10 points each, Mr. Whites get 6 points each).
 * - Mr. White Guess Win: Handled externally when Mr. White guesses the civil word correctly.
 */
export function checkVictory(
  players: Player[],
  mrWhiteGuessedCorrectly: boolean | null
): VictoryResult {
  if (mrWhiteGuessedCorrectly === true) {
    // Mr. White guessed the Civil word correctly! Immediately wins 6 points for Mr. Whites
    const scores: Record<string, number> = {};
    players.forEach(p => {
      if (p.role === 'mr_white') {
        scores[p.id] = 6;
      } else {
        scores[p.id] = 0;
      }
    });

    return {
      outcome: 'mr_white_guess_win',
      winners: ['mr_white'],
      scores,
    };
  }

  const alivePlayers = players.filter(p => p.isAlive);
  const aliveCivils = alivePlayers.filter(p => p.role === 'civil').length;
  const aliveUndercovers = alivePlayers.filter(p => p.role === 'undercover').length;
  const aliveMrWhites = alivePlayers.filter(p => p.role === 'mr_white').length;

  const totalInfiltratorsAlive = aliveUndercovers + aliveMrWhites;

  // 1. Civils Win: All infiltrators are dead
  if (totalInfiltratorsAlive === 0) {
    const scores: Record<string, number> = {};
    players.forEach(p => {
      if (p.role === 'civil') {
        scores[p.id] = 2;
      } else {
        scores[p.id] = 0;
      }
    });

    return {
      outcome: 'civils_win',
      winners: ['civil'],
      scores,
    };
  }

  // 2. Infiltrators Win: Only 1 Civil remains alive
  if (aliveCivils <= 1) {
    const scores: Record<string, number> = {};
    const winners: PlayerRole[] = [];
    
    // Check if there are any alive undercovers or mr whites to declare winners
    // (If they win, both undercovers and mr whites get points according to their role scores)
    if (players.some(p => p.role === 'undercover')) winners.push('undercover');
    if (players.some(p => p.role === 'mr_white')) winners.push('mr_white');

    players.forEach(p => {
      if (p.role === 'undercover') {
        scores[p.id] = 10;
      } else if (p.role === 'mr_white') {
        scores[p.id] = 6;
      } else {
        scores[p.id] = 0;
      }
    });

    return {
      outcome: 'infiltrators_win',
      winners,
      scores,
    };
  }

  // 3. Game is still ongoing
  return {
    outcome: 'ongoing',
    winners: [],
    scores: {},
  };
}
