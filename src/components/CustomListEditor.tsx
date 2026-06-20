import { useState, useEffect } from 'react';
import { ChevronLeft, Trash2, FileText, CheckCircle, AlertCircle, Plus, Pencil, EyeOff, Eye, ArrowRight, Package } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { WordPair } from '../hooks/useGameState';

export interface CustomWordList {
  id: string;
  name: string;
  pairs: WordPair[];
  isBlind?: boolean;
}

interface CustomListEditorProps {
  onBack: () => void;
  lang: 'en' | 'fr';
}

type CreationMode = 'none' | 'standard' | 'blind';
type BlindStep = 'civil' | 'undercover' | 'hint' | 'success';

export default function CustomListEditor({ onBack, lang }: CustomListEditorProps) {
  const [customLists, setCustomLists] = useLocalStorage<CustomWordList[]>('undercover_custom_lists', []);
  const [listName, setListName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [parsedPairs, setParsedPairs] = useState<WordPair[]>([]);
  const [errorText, setErrorText] = useState('');
  const [isImportMode, setIsImportMode] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [creationMode, setCreationMode] = useState<CreationMode>('none');

  // Blind mode state
  const [blindStep, setBlindStep] = useState<BlindStep>('civil');
  const [blindCivil, setBlindCivil] = useState('');
  const [blindUndercover, setBlindUndercover] = useState('');
  const [blindHint, setBlindHint] = useState('');
  const [blindPairs, setBlindPairs] = useState<WordPair[]>([]);
  const [blindListId, setBlindListId] = useState<string | null>(null);

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
        isBlind: false,
      };
      setCustomLists([...customLists, newList]);
    }

    setListName('');
    setBulkText('');
    setParsedPairs([]);
    setIsImportMode(false);
    setCreationMode('none');
  };

  const handleEditList = (list: CustomWordList) => {
    if (list.isBlind) {
      // For blind lists: open the blind wizard in append-only mode
      setBlindListId(list.id);
      setListName(list.name);
      setBlindPairs([]); // Don't load existing pairs into memory
      setBlindStep('civil');
      setBlindCivil('');
      setBlindUndercover('');
      setBlindHint('');
      setCreationMode('blind');
      setIsImportMode(true);
    } else {
      setEditingListId(list.id);
      setListName(list.name);
      // Reverse-serialize WordPair[] back into raw string format inside bulkText:
      const serializedPairs = list.pairs.map(p => `${p.civil}, ${p.undercover}${p.hint ? `, ${p.hint}` : ''}`).join('\n');
      setBulkText(serializedPairs);
      setCreationMode('standard');
      setIsImportMode(true);
    }
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

  // --- Blind Mode Handlers ---

  const handleBlindNextStep = () => {
    if (blindStep === 'civil') {
      if (!blindCivil.trim()) return;
      setBlindStep('undercover');
    } else if (blindStep === 'undercover') {
      if (!blindUndercover.trim()) return;
      setBlindStep('hint');
    }
  };

  const handleBlindAddPair = () => {
    const newPair: WordPair = {
      civil: blindCivil.trim(),
      undercover: blindUndercover.trim(),
      hint: blindHint.trim() || undefined,
    };

    if (blindListId) {
      // Append to existing blind list directly in localStorage
      const updatedLists = customLists.map((list) => {
        if (list.id === blindListId) {
          return { ...list, pairs: [...list.pairs, newPair] };
        }
        return list;
      });
      setCustomLists(updatedLists);
    } else {
      setBlindPairs(prev => [...prev, newPair]);
    }

    // Clear inputs and show success
    setBlindCivil('');
    setBlindUndercover('');
    setBlindHint('');
    setBlindStep('success');
  };

  const handleBlindNextPair = () => {
    setBlindStep('civil');
  };

  const handleBlindSaveList = () => {
    const trimmedName = listName.trim() || `${lang === 'fr' ? 'Liste Surprise' : 'Surprise List'} #${customLists.length + 1}`;

    if (blindListId) {
      // Already appended pairs live, just update name if changed
      const updatedLists = customLists.map((list) => {
        if (list.id === blindListId) {
          return { ...list, name: trimmedName };
        }
        return list;
      });
      setCustomLists(updatedLists);
    } else {
      if (blindPairs.length === 0) {
        alert(
          lang === 'fr'
            ? 'Veuillez ajouter au moins une paire de mots.'
            : 'Please add at least one word pair.'
        );
        return;
      }
      const newList: CustomWordList = {
        id: `list_${Date.now()}`,
        name: trimmedName,
        pairs: blindPairs,
        isBlind: true,
      };
      setCustomLists([...customLists, newList]);
    }

    resetBlindState();
  };

  const handleBlindClearList = () => {
    if (!blindListId) return;
    if (
      window.confirm(
        lang === 'fr'
          ? 'Voulez-vous vraiment effacer toutes les paires de cette liste et recommencer ?'
          : 'Are you sure you want to clear all pairs in this list and start over?'
      )
    ) {
      const updatedLists = customLists.map((list) => {
        if (list.id === blindListId) {
          return { ...list, pairs: [] };
        }
        return list;
      });
      setCustomLists(updatedLists);
    }
  };

  const resetBlindState = () => {
    setBlindStep('civil');
    setBlindCivil('');
    setBlindUndercover('');
    setBlindHint('');
    setBlindPairs([]);
    setBlindListId(null);
    setListName('');
    setIsImportMode(false);
    setCreationMode('none');
    setEditingListId(null);
  };

  const resetAllState = () => {
    setIsImportMode(false);
    setBulkText('');
    setListName('');
    setEditingListId(null);
    setCreationMode('none');
    resetBlindState();
  };

  // Calculate current blind pair count
  const getBlindPairCount = (): number => {
    if (blindListId) {
      const list = customLists.find(l => l.id === blindListId);
      return list ? list.pairs.length : 0;
    }
    return blindPairs.length;
  };

  // --- Render: Mode Selection ---
  const renderModeSelection = () => (
    <div>
      <p style={{ marginBottom: '1.5rem' }}>
        {lang === 'fr'
          ? "Créez vos propres mots secrets pour pimenter la partie ! Choisissez votre mode de création."
          : "Create your own secret words to spice up the game! Choose your creation mode."}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
        <button
          onClick={() => {
            setCreationMode('standard');
            setIsImportMode(true);
          }}
          className="btn btn-accent"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Eye size={18} />
          {lang === 'fr' ? 'Liste Standard (Import en Masse)' : 'Standard List (Bulk Import)'}
        </button>

        <button
          onClick={() => {
            setCreationMode('blind');
            setIsImportMode(true);
          }}
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, var(--color-undercover) 0%, #581c87 100%)',
          }}
        >
          <EyeOff size={18} />
          {lang === 'fr' ? 'Liste Surprise (Mode Aveugle 🎭)' : 'Surprise List (Blind Mode 🎭)'}
        </button>
      </div>
    </div>
  );

  // --- Render: Blind Wizard ---
  const renderBlindWizard = () => {
    const pairCount = getBlindPairCount();
    const isEditing = !!blindListId;

    return (
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <EyeOff size={18} style={{ color: 'var(--color-undercover)' }} />
          {isEditing
            ? (lang === 'fr' ? 'Ajouter des paires secrètes' : 'Add Secret Pairs')
            : (lang === 'fr' ? 'Nouvelle Liste Surprise' : 'New Surprise List')}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
          {lang === 'fr'
            ? 'Les mots sont masqués après ajout. Personne ne peut tricher !'
            : 'Words are hidden after adding. Nobody can cheat!'}
        </p>

        {/* List name input (only for new lists) */}
        {!isEditing && (
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label className="input-label">{lang === 'fr' ? 'Nom de la liste' : 'List Name'}</label>
            <input
              type="text"
              className="input-text"
              placeholder={lang === 'fr' ? 'Ex: Soirée Surprise' : 'e.g. Mystery Night'}
              value={listName}
              onChange={(e) => setListName(e.target.value)}
            />
          </div>
        )}

        {/* Pair counter badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.25rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          color: 'var(--color-undercover)',
        }}>
          <Package size={16} />
          {pairCount} {lang === 'fr' ? 'paire(s) secrète(s) ajoutée(s)' : 'secret pair(s) added'}
        </div>

        {/* Step-by-step wizard */}
        {blindStep === 'civil' && (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ color: 'var(--color-civil)', fontWeight: 700 }}>
                🟢 {lang === 'fr' ? 'Mot des Civils' : 'Civil Word'}
              </label>
              <input
                type="text"
                className="input-text"
                placeholder={lang === 'fr' ? 'Tapez le mot civil...' : 'Type the civil word...'}
                value={blindCivil}
                onChange={(e) => setBlindCivil(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlindNextStep(); } }}
              />
            </div>
            <button
              type="button"
              className="btn btn-accent"
              disabled={!blindCivil.trim()}
              onClick={handleBlindNextStep}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {lang === 'fr' ? 'Suivant' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {blindStep === 'undercover' && (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ color: 'var(--color-undercover)', fontWeight: 700 }}>
                🟣 {lang === 'fr' ? "Mot de l'Undercover" : 'Undercover Word'}
              </label>
              <input
                type="text"
                className="input-text"
                placeholder={lang === 'fr' ? 'Tapez le mot undercover...' : 'Type the undercover word...'}
                value={blindUndercover}
                onChange={(e) => setBlindUndercover(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlindNextStep(); } }}
              />
            </div>
            <button
              type="button"
              className="btn btn-accent"
              disabled={!blindUndercover.trim()}
              onClick={handleBlindNextStep}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {lang === 'fr' ? 'Suivant' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {blindStep === 'hint' && (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label" style={{ fontWeight: 700 }}>
                💡 {lang === 'fr' ? 'Indice (Facultatif)' : 'Hint (Optional)'}
              </label>
              <input
                type="text"
                className="input-text"
                placeholder={lang === 'fr' ? 'Un indice pour les infiltrés...' : 'A hint for infiltrators...'}
                value={blindHint}
                onChange={(e) => setBlindHint(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBlindAddPair(); } }}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleBlindAddPair}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, var(--color-undercover) 0%, #581c87 100%)',
              }}
            >
              <Plus size={16} />
              {lang === 'fr' ? 'Ajouter la paire' : 'Add Pair'}
            </button>
          </div>
        )}

        {blindStep === 'success' && (
          <div style={{ animation: 'fadeIn 0.2s ease-out', textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-civil) 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--color-text-primary)' }}>
              {lang === 'fr' ? 'Paire ajoutée avec succès !' : 'Pair added successfully!'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {lang === 'fr'
                ? 'Passez le téléphone au joueur suivant.'
                : 'Pass the phone to the next player.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-accent"
                onClick={handleBlindNextPair}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} />
                {lang === 'fr' ? 'Ajouter une autre paire' : 'Add Another Pair'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBlindSaveList}
                style={{ width: '100%' }}
              >
                {lang === 'fr' ? 'Terminer et Enregistrer' : 'Finish & Save'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom actions (cancel / clear) - shown except on success step */}
        {blindStep !== 'success' && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetAllState}
              style={{ flex: 1 }}
            >
              {lang === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBlindClearList}
                style={{ flex: 1, color: 'var(--color-eliminated)' }}
              >
                <Trash2 size={14} />
                {lang === 'fr' ? 'Tout effacer' : 'Clear All'}
              </button>
            )}
            {(pairCount > 0 || isEditing) && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleBlindSaveList}
                style={{ flex: 1 }}
              >
                {lang === 'fr' ? 'Terminer' : 'Finish'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // --- Render: Standard Form ---
  const renderStandardForm = () => (
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
          onClick={resetAllState}
        >
          {lang === 'fr' ? 'Annuler' : 'Cancel'}
        </button>
        <button type="submit" className="btn btn-primary" disabled={parsedPairs.length === 0}>
          {lang === 'fr' ? 'Enregistrer la Liste' : 'Save List'}
        </button>
      </div>
    </form>
  );

  // --- Render: List Overview ---
  const renderListOverview = () => (
    <div>
      {renderModeSelection()}

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
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {list.isBlind && <EyeOff size={14} style={{ color: 'var(--color-undercover)' }} />}
                  {list.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {list.isBlind
                    ? `📦 ${list.pairs.length} ${lang === 'fr' ? 'paires secrètes créées' : 'secret pairs created'}`
                    : `${list.pairs.length} ${lang === 'fr' ? 'paires de mots' : 'word pairs'}`}
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
  );

  return (
    <div className="screen-wrapper">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button onClick={isImportMode ? resetAllState : onBack} className="btn btn-secondary btn-icon" style={{ width: '40px', height: '40px', borderRadius: '50%' }}>
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ marginBottom: 0 }}>
            {lang === 'fr' ? 'Listes Personnalisées' : 'Custom Word Lists'}
          </h2>
        </div>

        {!isImportMode
          ? renderListOverview()
          : creationMode === 'blind'
            ? renderBlindWizard()
            : renderStandardForm()
        }
      </div>
    </div>
  );
}
