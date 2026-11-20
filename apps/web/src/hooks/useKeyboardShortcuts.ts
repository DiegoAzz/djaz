import { useEffect } from 'react';
import { useDjStore } from '../stores/useDjStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export const useKeyboardShortcuts = () => {
  const { preferences, setShowShortcutsModal } = useSettingsStore();
  const {
    togglePlayDeck,
    cueDeck,
    setCrossfader,
    centerCrossfader,
    setLoop,
    deckA,
    deckB,
    appMode
  } = useDjStore();

  useEffect(() => {
    if (!preferences.keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        // Deck A Play / Pause
        case 'Space':
          e.preventDefault();
          togglePlayDeck('A');
          break;

        // Deck B Play / Pause
        case 'Enter':
          e.preventDefault();
          togglePlayDeck('B');
          break;

        // Deck A Cue
        case 'KeyQ':
          e.preventDefault();
          cueDeck('A');
          break;

        // Deck B Cue
        case 'KeyP':
          e.preventDefault();
          cueDeck('B');
          break;

        // Crossfader Left
        case 'KeyX':
          e.preventDefault();
          setCrossfader(-1);
          break;

        // Crossfader Center
        case 'KeyC':
          e.preventDefault();
          centerCrossfader();
          break;

        // Crossfader Right
        case 'KeyV':
          e.preventDefault();
          setCrossfader(1);
          break;

        // Deck A Loops (Local mode)
        case 'Digit1':
          if (appMode === 'local' && deckA.bpm) {
            const beatSec = 60 / deckA.bpm;
            const now = deckA.currentTime;
            setLoop('A', { active: true, beats: 1, startTime: now, endTime: now + beatSec });
          }
          break;
        case 'Digit2':
          if (appMode === 'local' && deckA.bpm) {
            const beatSec = (60 / deckA.bpm) * 2;
            const now = deckA.currentTime;
            setLoop('A', { active: true, beats: 2, startTime: now, endTime: now + beatSec });
          }
          break;
        case 'Digit3':
          if (appMode === 'local' && deckA.bpm) {
            const beatSec = (60 / deckA.bpm) * 4;
            const now = deckA.currentTime;
            setLoop('A', { active: true, beats: 4, startTime: now, endTime: now + beatSec });
          }
          break;
        case 'Digit4':
          if (appMode === 'local' && deckA.bpm) {
            const beatSec = (60 / deckA.bpm) * 8;
            const now = deckA.currentTime;
            setLoop('A', { active: true, beats: 8, startTime: now, endTime: now + beatSec });
          }
          break;

        // Show shortcuts dialog on '?'
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            setShowShortcutsModal(true);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    preferences.keyboardShortcutsEnabled,
    togglePlayDeck,
    cueDeck,
    setCrossfader,
    centerCrossfader,
    setLoop,
    deckA,
    deckB,
    appMode,
    setShowShortcutsModal
  ]);
};
