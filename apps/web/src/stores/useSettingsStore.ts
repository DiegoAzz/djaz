import { create } from 'zustand';
import { UserPreferences } from '../types';

interface SettingsState {
  preferences: UserPreferences;
  showSettingsModal: boolean;
  showShortcutsModal: boolean;
  showTutorial: boolean;
  hasSeenTutorial: boolean;

  updatePreferences: (partial: Partial<UserPreferences>) => void;
  setShowSettingsModal: (open: boolean) => void;
  setShowShortcutsModal: (open: boolean) => void;
  setShowTutorial: (open: boolean) => void;
  dismissTutorial: () => void;
}

const STORAGE_KEY = 'minidj_settings_v1';

const defaultPreferences: UserPreferences = {
  autoCue: true,
  crossfaderCurve: 'linear',
  defaultAutoTransitionSec: 10,
  keyboardShortcutsEnabled: true,
  theme: 'dark'
};

const getInitialPreferences = (): UserPreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultPreferences, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultPreferences;
};

const getHasSeenTutorial = (): boolean => {
  try {
    return localStorage.getItem('minidj_tutorial_seen') === 'true';
  } catch {
    return false;
  }
};

export const useSettingsStore = create<SettingsState>((set, get) => {
  const seenTutorial = getHasSeenTutorial();

  return {
    preferences: getInitialPreferences(),
    showSettingsModal: false,
    showShortcutsModal: false,
    showTutorial: !seenTutorial,
    hasSeenTutorial: seenTutorial,

    updatePreferences: (partial) => {
      const updated = { ...get().preferences, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      set({ preferences: updated });
    },

    setShowSettingsModal: (open) => set({ showSettingsModal: open }),
    setShowShortcutsModal: (open) => set({ showShortcutsModal: open }),
    setShowTutorial: (open) => set({ showTutorial: open }),
    dismissTutorial: () => {
      try {
        localStorage.setItem('minidj_tutorial_seen', 'true');
      } catch {}
      set({ showTutorial: false, hasSeenTutorial: true });
    }
  };
});
