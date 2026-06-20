import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, FileText, CheckCircle, AlertCircle, Plus, Pencil } from 'lucide-react';
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
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // Re-parse the bulk text whenever it changes
  useEffect(() => {
    if (!bulkText.trim()) {
      setParsedPairs([]);
      setErrorText('');
      return;
    }

    const lines = bulkText.split(/\r?\n/);
    const pairs: WordPair[] = [];
    let malformedCount = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // skip empty lines

      // Custom multi-stage parsing to support optional hint and preserve internal commas in hint
      const firstComma = trimmedLine.indexOf(',');
      const firstSemi = trimmedLine.indexOf(';');
      const firstDashSpaced = trimmedLine.indexOf(' - ');
      const firstDash = firstDashSpaced !== -1 ? firstDashSpaced : trimmedLine.indexOf('-');
      const dashChar = firstDashSpaced !== -1 ? ' - ' : '-';

      const delimiters = [
        { char: ';', index: firstSemi },
        { char: dashChar, index: firstDash },
        { char: ',', index: firstComma }
      ].filter(d => d.index !== -1);

      if (delimiters.length === 0) {
        malformedCount++;
        return;
      }

      delimiters.sort((a, b) => a.index - b.index);
      const delimiter = delimiters[0].char;
      const firstIdx = delimiters[0].index;

      const part1 = trimmedLine.substring(0, firstIdx).trim();
      const rest = trimmedLine.substring(firstIdx + delimiter.length);

      const secondIdx = rest.indexOf(delimiter);
      if (secondIdx === -1) {
        // Only 2 items: Civil, Undercover
        const part2 = rest.trim();
        if (part1 && part2) {
          pairs.push({ civil: part1, undercover: part2 });
        } else {
          malformedCount++;
        }
      } else {
        // 3 items: Civil, Undercover, Hint (supports internal delimiters in hint)
        const part2 = rest.substring(0, secondIdx).trim();
        const hint = rest.substring(secondIdx + delimiter.length).trim();
        if (part1 && part2) {
          pairs.push({ civil: part1, undercover: part2, hint: hint || undefined });
        } else {
          malformedCount++;
        }
      }
    });

    setParsedPairs(pairs);

    if (pairs.length === 0 && malformedCount > 0) {
      setErrorText(
        lang === 'fr'
          ? "Aucune ligne valide trouvée. Séparez par une virgule, point-virgule ou tiret (ex: Chat, Chien ou Chat, Chien, Indice)."
          : "No valid lines found. Separate with comma, semicolon, or dash (e.g. Cat, Dog or Cat, Dog, Hint)."
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

    if (editingListId) {
      const updatedLists = customLists.map((list) => {
        if (list.id === editingListId) {
          return {
            ...list,
            name: trimmedName,
            pairs: parsedPairs,
          };
        }
        return list;
      });
      setCustomLists(updatedLists);
      setEditingListId(null);
    } else {
      const newList: CustomWordList = {
        id: `list_${Date.now()}`,
        name: trimmedName,
        pairs: parsedPairs,
      };
      setCustomLists([...customLists, newList]);
    }

    setListName('');
    setBulkText('');
    setParsedPairs([]);
    setIsImportMode(false);
  };

  const handleEditList = (list: CustomWordList) => {
    setEditingListId(list.id);
    setListName(list.name);
    // Reverse-serialize WordPair[] back into raw string format inside bulkText:
    const serializedPairs = list.pairs.map(p => `${p.civil}, ${p.undercover}${p.hint ? `, ${p.hint}` : ''}`).join('\n');
    setBulkText(serializedPairs);
    setIsImportMode(true);
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
                  <FileText size={36} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
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
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                        {list.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                        {list.pairs.length} {lang === 'fr' ? 'paires de mots' : 'word pairs'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleEditList(list)}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '0.5rem' }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteList(list.id)}
                        className="btn btn-secondary btn-icon"
                        style={{ padding: '0.5rem', color: 'var(--color-eliminated)', borderColor: 'var(--color-eliminated-border)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveList} className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>
              {editingListId
                ? (lang === 'fr' ? 'Modifier la Liste de Mots' : 'Edit Word List')
                : (lang === 'fr' ? 'Nouvelle Liste de Mots' : 'New Word List')}
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
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                {lang === 'fr'
                  ? 'Format : MotCivil , MotUndercover [, IndiceOptionnel] (séparateur: , ou ; ou -)'
                  : 'Format: CivilWord , UndercoverWord [, OptionalHint] (separators: , or ; or -)'}
              </div>
              <textarea
                className="textarea-bulk"
                placeholder={
                  lang === 'fr'
                    ? "Chat, Chien, Animaux domestiques\nPomme; Poire\nOrdinateur - Tablette - Technologie\nFrite-Chips-Snack"
                    : "Cat, Dog, Pets\nApple; Pear\nComputer - Tablet - Technology\nFries-Chips-Snack"
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
                  color: 'var(--color-civil)',
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
                  color: 'var(--color-eliminated)',
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
                    background: 'rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {parsedPairs.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '0.35rem 0.5rem',
                        borderBottom: idx < parsedPairs.length - 1 ? '1px solid var(--glass-border)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--color-civil)', fontWeight: 600 }}>{p.civil}</span>
                        <span style={{ color: 'var(--color-undercover)', fontWeight: 600 }}>{p.undercover}</span>
                      </div>
                      {p.hint && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <span>💡</span>
                          <span>{p.hint}</span>
                        </div>
                      )}
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
                  setEditingListId(null);
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
