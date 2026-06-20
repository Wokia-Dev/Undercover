import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, FileText, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WordPair } from '../hooks/useGameState';

export interface CustomWordList {
  id: string;
  name: string;
  pairs: WordPair[];
}

interface CustomListEditorProps {
  onBack: () => void;
  lang: 'en' | 'fr';
}

export default function CustomListEditor({ onBack, lang }: CustomListEditorProps) {
  const [customLists, setCustomLists] = useLocalStorage<CustomWordList[]>('undercover_custom_lists', []);
  const [listName, setListName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [parsedPairs, setParsedPairs] = useState<WordPair[]>([]);
  const [errorText, setErrorText] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);

  // Re-parse the bulk text whenever it changes
  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedPairs([]);
      setErrorText('');
      return;
    }

    const lines = bulkText.split(/\r?\n/);
    const pairs: WordPair[] = [];
    const delimiterRegex = /^\s*([^,;\-\n\r]+?)\s*[,;\-]\s*([^,;\-\n\r]+?)\s*$/;
    let malformedCount = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // skip empty lines

      const match = trimmedLine.match(delimiterRegex);
      if (match) {
        const civil = match[1].trim();
        const undercover = match[2].trim();
        if (civil && undercover) {
          pairs.push({ civil, undercover });
        } else {
          malformedCount++;
        }
      } else {
        malformedCount++;
      }
    });

    setParsedPairs(pairs);

    if (pairs.length === 0 && malformedCount > 0) {
      setErrorText(
        lang === 'fr'
          ? "Aucune ligne valide trouvée. Séparez par une virgule, point-virgule ou tiret (ex: Chat, Chien)."
          : "No valid lines found. Separate with comma, semicolon, or dash (e.g. Cat, Dog)."
      );
    } else if (malformedCount > 0) {
      setErrorText(
        lang === 'fr'
          ? `Importation partielle : ${malformedCount} ligne(s) ignorée(s) car malformée(s).`
          : `Partial import: ${malformedCount} line(s) ignored due to formatting errors.`
      );
    } else {
      setErrorText('');
    }
  }, [bulkText, lang]);

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = listName.trim() || `${lang === 'fr' ? 'Liste' : 'List'} #${customLists.length + 1}`;

    if (parsedPairs.length === 0) {
      alert(
        lang === 'fr'
          ? 'Veuillez saisir au moins une paire de mots valide.'
          : 'Please enter at least one valid word pair.'
      );
      return;
    }

    const newList: CustomWordList = {
      id: `list_${Date.now()}`,
      name: trimmedName,
      pairs: parsedPairs,
    };

    setCustomLists([...customLists, newList]);
    setListName('');
    setBulkText('');
    setParsedPairs([]);
    setIsImportMode(false);
  };

  const handleDeleteList = (id: string) => {
    if (
      window.confirm(
        lang === 'fr'
          ? 'Voulez-vous vraiment supprimer cette liste ?'
          : 'Are you sure you want to delete this list?'
      )
    ) {
      setCustomLists(customLists.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={onBack} className="btn btn-secondary btn-icon" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ marginBottom: 0 }}>
            {lang === 'fr' ? 'Listes Personnalisées' : 'Custom Word Lists'}
          </h2>
        </div>

        {!isImportMode ? (
          <div>
            <p style={{ marginBottom: '1.5rem' }}>
              {lang === 'fr'
                ? "Créez vos propres mots secrets pour pimenter la partie ! Importez-les en masse ci-dessous."
                : "Create your own secret words to spice up the game! Import them in bulk below."}
            </p>

            <button onClick={() => setIsImportMode(true)} className="btn btn-accent" style={{ marginBottom: '2rem' }}>
              <Plus size={18} />
              {lang === 'fr' ? 'Créer une Liste (Import en Masse)' : 'Create List (Bulk Import)'}
            </button>

            <h3>
              {lang === 'fr' ? 'Vos listes enregistrées' : 'Your saved lists'} ({customLists.length})
            </h3>
            <div style={{ marginTop: '1rem' }}>
              {customLists.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <FileText size={36} style={{ color: '#64748b', marginBottom: '0.75rem' }} />
                  <p>
                    {lang === 'fr'
                      ? "Aucune liste personnalisée pour l'instant. Ajoutez-en une !"
                      : "No custom lists yet. Add one to get started!"}
                  </p>
                </div>
              ) : (
                customLists.map((list) => (
                  <div key={list.id} className="list-preview-card">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f8fafc' }}>
                        {list.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        {list.pairs.length} {lang === 'fr' ? 'paires de mots' : 'word pairs'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="btn btn-secondary btn-icon"
                      style={{ padding: '0.5rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveList} className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', color: '#f8fafc' }}>
              {lang === 'fr' ? 'Nouvelle Liste de Mots' : 'New Word List'}
            </h3>

            <div className="input-group">
              <label className="input-label">{lang === 'fr' ? 'Nom de la liste' : 'List Name'}</label>
              <input
                type="text"
                className="input-text"
                placeholder={lang === 'fr' ? 'Ex: Soirée Étudiante' : 'e.g. College Party'}
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                {lang === 'fr' ? 'Import en masse (un couple par ligne)' : 'Bulk Import (one pair per line)'}
              </label>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                {lang === 'fr'
                  ? 'Format : MotCivil , MotUndercover (séparateur: , ou ; ou -)'
                  : 'Format: CivilWord , UndercoverWord (separators: , or ; or -)'}
              </div>
              <textarea
                className="textarea-bulk"
                placeholder={
                  lang === 'fr'
                    ? "Chat, Chien\nPomme; Poire\nOrdinateur - Tablette\nFrite-Chips"
                    : "Cat, Dog\nApple; Pear\nComputer - Tablet\nFries-Chips"
                }
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                required
              />
            </div>

            {/* Live Parsing Feedbacks */}
            {parsedPairs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#10b981',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  fontWeight: 600,
                }}
              >
                <CheckCircle size={16} />
                <span>
                  {lang === 'fr'
                    ? `${parsedPairs.length} paires détectées avec succès !`
                    : `${parsedPairs.length} pairs successfully detected!`}
                </span>
              </div>
            )}

            {errorText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  color: '#fbbf24',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{errorText}</span>
              </div>
            )}

            {/* List preview of parsed words */}
            {parsedPairs.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="input-label" style={{ marginBottom: '0.5rem' }}>
                  {lang === 'fr' ? 'Aperçu des paires :' : 'Pairs Preview:'}
                </div>
                <div
                  style={{
                    maxHeight: '120px',
                    overflowY: 'auto',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {parsedPairs.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        borderBottom: idx < parsedPairs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      }}
                    >
                      <span style={{ color: '#10b981' }}>{p.civil}</span>
                      <span style={{ color: '#a855f7' }}>{p.undercover}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsImportMode(false);
                  setBulkText('');
                  setListName('');
                }}
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={parsedPairs.length === 0}>
                {lang === 'fr' ? 'Enregistrer la Liste' : 'Save List'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
