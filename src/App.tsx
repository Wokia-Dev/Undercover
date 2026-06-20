import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import SetupScreen from './components/SetupScreen';
import RevealScreen from './components/RevealScreen';
import DescriptionScreen from './components/DescriptionScreen';
import DiscussionScreen from './components/DiscussionScreen';
import EliminationScreen from './components/EliminationScreen';
import MrWhiteGuessScreen from './components/MrWhiteGuessScreen';
import GameOverScreen from './components/GameOverScreen';
import CustomListEditor from './components/CustomListEditor';
import { Download, Globe } from 'lucide-react';
import './styles/main.css';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function App() {
  const {
    gameState,
    leaderboard,
    activeLanguage,
    setActiveLanguage,
    startGame,
    nextReveal,
    nextDescriber,
    startElimination,
    eliminatePlayer,
    submitMrWhiteGuess,
    skipElimination,
    resetGame,
    clearLeaderboard,
  } = useGameState();

  const [currentView, setCurrentView] = useState<'game' | 'custom_lists'>('game');
  
  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Render correct screen content based on state status machine
  const renderScreen = () => {
    if (currentView === 'custom_lists') {
      return (
        <CustomListEditor
          lang={activeLanguage}
          onBack={() => setCurrentView('game')}
        />
      );
    }

    switch (gameState.status) {
      case 'setup':
        return (
          <SetupScreen
            lang={activeLanguage}
            onStartGame={startGame}
            onOpenCustomLists={() => setCurrentView('custom_lists')}
            leaderboard={leaderboard}
            onClearLeaderboard={clearLeaderboard}
          />
        );
      case 'reveal':
        return (
          <RevealScreen
            lang={activeLanguage}
            gameState={gameState}
            onNextReveal={nextReveal}
          />
        );
      case 'description':
        return (
          <DescriptionScreen
            lang={activeLanguage}
            gameState={gameState}
            onNextDescriber={nextDescriber}
          />
        );
      case 'discussion':
        return (
          <DiscussionScreen
            lang={activeLanguage}
            timerDuration={gameState.timerDuration}
            onStartElimination={startElimination}
          />
        );
      case 'elimination':
        return (
          <EliminationScreen
            lang={activeLanguage}
            gameState={gameState}
            onEliminatePlayer={eliminatePlayer}
            onSkipElimination={skipElimination}
          />
        );
      case 'mr_white_guess':
        return (
          <MrWhiteGuessScreen
            lang={activeLanguage}
            gameState={gameState}
            onSubmitGuess={submitMrWhiteGuess}
          />
        );
      case 'game_over':
        return (
          <GameOverScreen
            lang={activeLanguage}
            gameState={gameState}
            onPlayAgain={resetGame}
          />
        );
      default:
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Error loading state</h2>
            <button onClick={resetGame} className="btn btn-primary">
              Reset
            </button>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Top Header Controls: Language switcher and PWA installer */}
      {gameState.status === 'setup' && currentView === 'game' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <Globe size={14} />
            <span>Language:</span>
          </div>
          <div className="lang-switcher">
            <button
              onClick={() => setActiveLanguage('en')}
              className={`lang-btn ${activeLanguage === 'en' ? 'active' : ''}`}
            >
              EN
            </button>
            <button
              onClick={() => setActiveLanguage('fr')}
              className={`lang-btn ${activeLanguage === 'fr' ? 'active' : ''}`}
            >
              FR
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Banner */}
      {showInstallBanner && gameState.status === 'setup' && (
        <div className="pwa-banner">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
              {activeLanguage === 'fr' ? 'Installer l\'application' : 'Install App'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {activeLanguage === 'fr' ? 'Jouez hors-ligne à tout moment !' : 'Play offline at any time!'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleInstallClick}
              className="btn btn-accent"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', gap: '0.25rem' }}
            >
              <Download size={14} />
              {activeLanguage === 'fr' ? 'Installer' : 'Install'}
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
            >
              {activeLanguage === 'fr' ? 'Plus tard' : 'Later'}
            </button>
          </div>
        </div>
      )}

      {/* Render Active Game Component */}
      {renderScreen()}
    </div>
  );
}
