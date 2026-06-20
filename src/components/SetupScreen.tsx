import { useState, useEffect } from 'react';
import { Plus, Trash2, Sliders, Play, ListPlus, RotateCcw, Settings } from 'lucide-react';
import { DEFAULT_CATEGORIES_EN, DEFAULT_CATEGORIES_FR } from '../data/defaultWords';
import type { CustomWordList } from './CustomListEditor';
import { getRecommendedRoles } from '../utils/gameLogic';
import type { RoleSettings } from '../utils/gameLogic';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WordPair } from '../hooks/useGameState';

interface SetupScreenProps {
  lang: 'en' | 'fr';
  onStartGame: (
    playerNames: string[],
    roles: RoleSettings,
    wordPair: WordPair,
    categoryName: string,
    descriptionMode: 'guided' | 'verbal',
    timerDuration: number,
    categoryId: string
  ) => void;
  onOpenCustomLists: () => void;
  leaderboard: Record<string, number>;
  onClearLeaderboard: () => void;
}

export default function SetupScreen({
  lang,
  onStartGame,
  onOpenCustomLists,
  leaderboard,
  onClearLeaderboard,
}: SetupScreenProps) {
  // Load custom lists from local storage
  const [customLists] = useLocalStorage<CustomWordList[]>('undercover_custom_lists', []);
  
  // Custom game preferences persisted locally
  const [descriptionMode, setDescriptionMode] = useLocalStorage<'guided' | 'verbal'>('undercover_setup_description_mode', 'guided');
  const [timerDuration, setTimerDuration] = useLocalStorage<number>('undercover_setup_timer_duration', 90);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Set default names or fetch from previous state
  const [playerNames, setPlayerNames] = useLocalStorage<string[]>('undercover_setup_names', [
    'Alice',
    'Bob',
    'Charlie',
    'David',
  ]);

  const [selectedCategoryId, setSelectedCategoryId] = useState('animaux');
  
  // Role configurations
  const [roles, setRoles] = useState<RoleSettings>({ civil: 3, undercover: 1, mrWhite: 0 });
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Sync categories depending on language
  const categories = lang === 'fr' ? DEFAULT_CATEGORIES_FR : DEFAULT_CATEGORIES_EN;

  // Set default category when language changes or categories update
  useEffect(() => {
    const ids = [
      ...categories.map(c => c.id),
      ...customLists.map(l => l.id)
    ];
    if (!ids.includes(selectedCategoryId)) {
      setSelectedCategoryId(categories[0]?.id || 'animaux');
    }
  }, [lang, categories, customLists, selectedCategoryId]);

  // Adjust roles automatically when player count changes, unless overridden manually
  useEffect(() => {
    if (!isManualOverride) {
      const rec = getRecommendedRoles(playerNames.length);
      setRoles(rec);
    }
  }, [playerNames.length, isManualOverride]);

  // Player management
  const handleAddPlayer = () => {
    const defaultName = lang === 'fr' ? `Joueur ${playerNames.length + 1}` : `Player ${playerNames.length + 1}`;
    setPlayerNames([...playerNames, defaultName]);
  };

  const handleRemovePlayer = (index: number) => {
    if (playerNames.length <= 3) {
      alert(
        lang === 'fr'
          ? 'Il faut au moins 3 joueurs pour jouer à Undercover.'
          : 'You need at least 3 players to play Undercover.'
      );
      return;
    }
    const updated = playerNames.filter((_, idx) => idx !== index);
    setPlayerNames(updated);
  };

  const handleNameChange = (index: number, value: string) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  // Adjust specific role count manually
  const handleRoleChange = (roleKey: keyof RoleSettings, value: number) => {
    setIsManualOverride(true);
    const targetRoles = { ...roles, [roleKey]: value };

    // Total must equal playerNames.length
    const totalRemaining = playerNames.length;
    if (roleKey === 'undercover') {
      const mrWhite = targetRoles.mrWhite;
      const undercover = Math.min(value, totalRemaining - mrWhite - 1); // Ensure at least 1 Civil
      const civil = totalRemaining - undercover - mrWhite;
      setRoles({ civil, undercover, mrWhite });
    } else if (roleKey === 'mrWhite') {
      const undercover = targetRoles.undercover;
      const mrWhite = Math.min(value, totalRemaining - undercover - 1); // Ensure at least 1 Civil
      const civil = totalRemaining - undercover - mrWhite;
      setRoles({ civil, undercover, mrWhite });
    } else if (roleKey === 'civil') {
      const civil = Math.max(1, Math.min(value, totalRemaining - 1)); // Ensure at least 1 infiltrator
      // distribute difference to undercover
      const rem = totalRemaining - civil;
      const mrWhite = Math.min(roles.mrWhite, rem);
      const undercover = rem - mrWhite;
      setRoles({ civil, undercover, mrWhite });
    }
  };

  // Select a word pair and category details to pass to start
  const handleLaunch = () => {
    // 1. Gather all word lists (default categories + custom lists)
    let selectedPairs: [string, string][] = [];
    let catName = '';

    const customList = customLists.find(l => l.id === selectedCategoryId);
    if (customList) {
      selectedPairs = customList.pairs.map(p => [p.civil, p.undercover]);
      catName = customList.name;
    } else {
      const defaultCategory = categories.find(c => c.id === selectedCategoryId);
      if (defaultCategory) {
        selectedPairs = defaultCategory.pairs;
        catName = defaultCategory.name;
      }
    }

    if (selectedPairs.length === 0) {
      alert(
        lang === 'fr'
          ? "Aucun mot disponible dans cette catégorie !"
          : "No words available in this category!"
      );
      return;
    }

    // 2. Pick a random word pair
    const randomIdx = Math.floor(Math.random() * selectedPairs.length);
    const rawPair = selectedPairs[randomIdx];
    const wordPair: WordPair = {
      civil: rawPair[0],
      undercover: rawPair[1],
    };

    // 3. Launch game state
    onStartGame(playerNames, roles, wordPair, catName, descriptionMode, timerDuration, selectedCategoryId);
  };

  const handleResetRoles = () => {
    setIsManualOverride(false);
    const rec = getRecommendedRoles(playerNames.length);
    setRoles(rec);
  };

  const hasScores = Object.keys(leaderboard).length > 0;

  const handleClearLeaderboard = () => {
    const confirmed = window.confirm(
      lang === 'fr'
        ? "Voulez-vous vraiment réinitialiser tous les scores ?"
        : "Are you sure you want to reset all scores?"
    );
    if (confirmed) {
      onClearLeaderboard();
    }
  };

  return (
    <div className="screen-wrapper">
      <div>
        <h1>Undercover</h1>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {lang === 'fr' ? 'Jeu d\'ambiance et d\'infiltration' : 'A game of words and infiltration'}
        </p>

        {/* Categories Selectors */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--color-text-primary)' }}>
              {lang === 'fr' ? '📁 Catégorie de Mots' : '📁 Word Category'}
            </h3>
            <button
              onClick={onOpenCustomLists}
              className="btn btn-secondary btn-icon"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem', width: 'auto' }}
            >
              <ListPlus size={14} />
              {lang === 'fr' ? 'Gérer' : 'Manage'}
            </button>
          </div>

          <select
            className="input-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          >
            <optgroup label={lang === 'fr' ? 'Catégories par défaut' : 'Default Categories'}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.pairs.length} {lang === 'fr' ? 'mots' : 'words'})
                </option>
              ))}
            </optgroup>
            {customLists.length > 0 && (
              <optgroup label={lang === 'fr' ? 'Vos listes perso' : 'Your custom lists'}>
                {customLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    ✨ {list.name} ({list.pairs.length} {lang === 'fr' ? 'mots' : 'words'})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {/* Players Config */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ color: 'var(--color-text-primary)' }}>
              {lang === 'fr' ? '👥 Joueurs' : '👥 Players'} ({playerNames.length})
            </h3>
            <button
              onClick={handleAddPlayer}
              className="btn btn-secondary btn-icon"
              style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="player-setup-list">
            {playerNames.map((name, index) => (
              <div key={index} className="player-setup-row">
                <input
                  type="text"
                  className="input-text"
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.95rem' }}
                  value={name}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  placeholder={`Player ${index + 1}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemovePlayer(index)}
                  className="btn btn-secondary btn-icon"
                  style={{
                    padding: '0.65rem',
                    color: playerNames.length <= 3 ? '#475569' : '#f43f5e',
                    borderColor: 'transparent',
                    background: 'rgba(255, 255, 255, 0.02)',
                    width: '38px',
                    height: '38px',
                  }}
                  disabled={playerNames.length <= 3}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Role Counters */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--color-text-primary)' }}>
              <Sliders size={16} style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              {lang === 'fr' ? '🎭 Rôles et Infiltrés' : '🎭 Roles Distribution'}
            </h3>
            {isManualOverride && (
              <button
                onClick={handleResetRoles}
                className="btn btn-secondary btn-icon"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem', width: 'auto' }}
              >
                <RotateCcw size={12} />
                {lang === 'fr' ? 'Auto' : 'Auto'}
              </button>
            )}
          </div>

          {/* Civils Slider */}
          <div className="slider-container">
            <div className="slider-header">
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                🟢 {lang === 'fr' ? 'Civils' : 'Civils'}
              </span>
              <span className="slider-val" style={{ color: 'var(--color-civil)' }}>{roles.civil}</span>
            </div>
            <input
              type="range"
              min="1"
              max={playerNames.length - 1}
              value={roles.civil}
              onChange={(e) => handleRoleChange('civil', parseInt(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Undercovers Slider */}
          <div className="slider-container">
            <div className="slider-header">
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                🟣 {lang === 'fr' ? 'Undercovers' : 'Undercovers'}
              </span>
              <span className="slider-val" style={{ color: 'var(--color-undercover)' }}>{roles.undercover}</span>
            </div>
            <input
              type="range"
              min="0"
              max={playerNames.length - roles.mrWhite - 1}
              value={roles.undercover}
              onChange={(e) => handleRoleChange('undercover', parseInt(e.target.value))}
              className="slider-input"
            />
          </div>

          {/* Mr Whites Slider */}
          <div className="slider-container" style={{ marginBottom: 0 }}>
            <div className="slider-header">
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                ⚪ {lang === 'fr' ? 'Mr. Whites' : 'Mr. Whites'}
              </span>
              <span className="slider-val" style={{ color: 'var(--color-mr-white)' }}>{roles.mrWhite}</span>
            </div>
            <input
              type="range"
              min="0"
              max={playerNames.length - roles.undercover - 1}
              value={roles.mrWhite}
              onChange={(e) => handleRoleChange('mrWhite', parseInt(e.target.value))}
              className="slider-input"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="glass-card">
          <div
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <h3 style={{ color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Settings size={16} />
              {lang === 'fr' ? '⚙️ Options Avancées' : '⚙️ Advanced Settings'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#a5b4fc', fontWeight: 700 }}>
              {showAdvanced ? (lang === 'fr' ? 'Masquer' : 'Hide') : (lang === 'fr' ? 'Afficher' : 'Show')}
            </span>
          </div>

          {showAdvanced && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
              {/* Description Mode */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  {lang === 'fr' ? 'Mode de Description' : 'Description Mode'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setDescriptionMode('guided')}
                    className={`btn ${descriptionMode === 'guided' ? 'btn-accent' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {lang === 'fr' ? 'Guidé' : 'Guided'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescriptionMode('verbal')}
                    className={`btn ${descriptionMode === 'verbal' ? 'btn-accent' : 'btn-secondary'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {lang === 'fr' ? 'Verbal (Direct)' : 'Verbal (Direct)'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--color-text-muted)' }}>
                  {descriptionMode === 'guided'
                    ? (lang === 'fr' ? 'Chaque joueur passe le téléphone pour voir son tour de description.' : 'Players pass the phone turn-by-turn to enter their clues on-screen.')
                    : (lang === 'fr' ? 'Description libre à haute voix autour de la table. Plus rapide.' : 'Players say their clues aloud face-to-face immediately. Faster flow.')
                  }
                </p>
              </div>

              {/* Discussion Timer */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">
                  {lang === 'fr' ? 'Temps du Débat' : 'Debate Timer'}
                </label>
                <select
                  className="input-select"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value))}
                  style={{ marginTop: '0.25rem' }}
                >
                  <option value={30}>30s</option>
                  <option value={60}>1m</option>
                  <option value={90}>1m 30s</option>
                  <option value={120}>2m</option>
                  <option value={180}>3m</option>
                  <option value={0}>{lang === 'fr' ? 'Pas de limite / Libre' : 'No Limit / Open'}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Global Leaderboard Panel */}
        {hasScores && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ color: '#fbbf24' }}>🏆 {lang === 'fr' ? 'Scoreboard Général' : 'General Leaderboard'}</h3>
              <button
                onClick={handleClearLeaderboard}
                className="btn btn-secondary btn-icon"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f43f5e', width: 'auto' }}
              >
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </button>
            </div>
            <div className="leaderboard-container">
              {Object.entries(leaderboard)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5) // Show top 5
                .map(([name, score], idx) => {
                  let podiumClass = '';
                  if (idx === 0) podiumClass = 'podium-1';
                  else if (idx === 1) podiumClass = 'podium-2';
                  else if (idx === 2) podiumClass = 'podium-3';

                  return (
                    <div key={name} className={`leaderboard-row ${podiumClass}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge-place place-${idx + 1}`}>{idx + 1}</span>
                        <span style={{ fontWeight: 600 }}>{name}</span>
                      </div>
                      <span style={{ fontWeight: 800 }}>{score} pts</span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <button onClick={handleLaunch} className="btn btn-primary" style={{ marginTop: '1rem' }}>
        <Play size={18} />
        {lang === 'fr' ? 'Lancer la Partie' : 'Start Match'}
      </button>
    </div>
  );
}
