import React, { useState, useEffect, useCallback } from 'react';
import { TopWaveformBar } from './components/Header/TopWaveformBar';
import { Header } from './components/Header/Header';
import { Deck } from './components/Deck/Deck';
import { Mixer } from './components/Mixer/Mixer';
import { YouDjExplorer } from './components/Explorer/YouDjExplorer';
import { AmbientClubBackground } from './components/Background/AmbientClubBackground';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ShortcutsModal } from './components/Settings/ShortcutsModal';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { apiService, SearchApiResponse } from './services/api';
import { Gamepad2, Disc } from 'lucide-react';
import { useDjStore } from './stores/useDjStore';

const SEARCH_CACHE_KEY = 'djaz_search_cache_v4';

interface SavedSearchState {
  query: string;
  response: SearchApiResponse | null;
}

const getSavedSearch = (): SavedSearchState => {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { query: 'tiktok viral hits 2026', response: null };
};

const saveSearchToStorage = (query: string, response: SearchApiResponse | null) => {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({ query, response }));
  } catch {}
};

export const App: React.FC = () => {
  useKeyboardShortcuts();

  const { deckA, deckB } = useDjStore();

  const savedSearch = getSavedSearch();
  const [searchQuery, setSearchQuery] = useState(savedSearch.query);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchApiResponse | null>(savedSearch.response);
  const [mobileDeckTab, setMobileDeckTab] = useState<'all' | 'A' | 'mixer' | 'B'>('all');

  // Hardcore protection against accidental reload while songs are loaded or playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isPlaying = deckA.state === 'PLAYING' || deckB.state === 'PLAYING';
      if (isPlaying) {
        if (e.key === 'F5' || (e.ctrlKey && e.key.toLowerCase() === 'r')) {
          e.preventDefault();
          e.stopPropagation();
          const confirmReload = window.confirm(
            '⚠️ Hay música reproduciéndose en DjAz.\n\nSi recargas la página se detendrá el audio de tu Live. ¿Deseas recargar de todos modos?'
          );
          if (confirmReload) {
            window.location.reload();
          }
        }
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const isPlaying = deckA.state === 'PLAYING' || deckB.state === 'PLAYING';
      const hasTracks = !!deckA.track || !!deckB.track;
      if (isPlaying || hasTracks) {
        e.preventDefault();
        e.returnValue = 'Hay música cargada en DjAz. Si sales o recargas se pausará el audio.';
        return e.returnValue;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [deckA.state, deckB.state, deckA.track, deckB.track]);

  // Debounce search query by 400ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search function that permanently saves results to localStorage
  const executeSearch = useCallback(async (query: string, pageToken?: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    setIsSearching(true);
    try {
      const data = await apiService.search(trimmed, pageToken);
      setSearchResponse((prev) => {
        let updated: SearchApiResponse;
        if (pageToken && prev) {
          updated = {
            ...data,
            items: [...prev.items, ...data.items]
          };
        } else {
          updated = data;
        }
        saveSearchToStorage(trimmed, updated);
        return updated;
      });
    } catch (err: any) {
      console.error('[Search Execution Error]', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Execute search when debounced text changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      executeSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, executeSearch]);

  // If no saved search exists, load initial curated DJ hits once
  useEffect(() => {
    if (!savedSearch.response) {
      executeSearch('tiktok viral hits 2026');
    }
  }, [savedSearch.response, executeSearch]);

  return (
    <div className="relative h-screen max-h-screen overflow-hidden flex flex-col bg-[#080b12] text-white select-none">
      {/* Dynamic Ambient Club Atmosphere (0 KB GPU-Accelerated) */}
      <AmbientClubBackground />

      {/* 1. Signature YouDJ Top Dual Waveform & Center BPM Banner (FIXED) */}
      <div className="shrink-0 relative z-10 bg-[#090d14]/90 backdrop-blur-md">
        <TopWaveformBar />
      </div>

      {/* 2. Main Header (FIXED) */}
      <div className="shrink-0 relative z-10 bg-[#090d14]/75 backdrop-blur-md border-b border-white/10">
        <Header
          onSearch={(q) => executeSearch(q)}
          isSearching={isSearching}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            saveSearchToStorage(q, searchResponse);
          }}
        />
      </div>

      {/* 3. Central Console: Mobile View Switcher on small screens */}
      <div className="lg:hidden px-3 pt-1.5 shrink-0 relative z-10">
        <div className="flex items-center justify-between bg-[#121722]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[11px] font-bold">
          <button
            onClick={() => setMobileDeckTab('A')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mobileDeckTab === 'A' ? 'bg-[#FF6B00] text-black font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>DECK A</span>
          </button>
          <button
            onClick={() => setMobileDeckTab('mixer')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mobileDeckTab === 'mixer'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white font-black shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>TIKTOK LIVE</span>
          </button>
          <button
            onClick={() => setMobileDeckTab('B')}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              mobileDeckTab === 'B' ? 'bg-[#FF0055] text-white font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>DECK B</span>
          </button>
          <button
            onClick={() => setMobileDeckTab('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              mobileDeckTab === 'all' ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
            }`}
            title="Ver todos los paneles verticalmente"
          >
            TODO
          </button>
        </div>
      </div>

      {/* Main Container: Fixed Mixing Console (~40% height) + Expansive YouDJ Song Explorer (~60% height) */}
      <main className="flex-1 min-h-0 p-2 sm:p-2.5 flex flex-col gap-2 max-w-[1780px] w-full mx-auto overflow-hidden relative z-10">
        {/* DJ MIXING CONSOLE ROW: FIXED ON SCREEN (NEVER LOST FROM SIGHT) */}
        <div className="shrink-0 flex flex-col lg:flex-row gap-2 items-stretch">
          {/* Deck A */}
          <div className={`w-full lg:flex-1 ${mobileDeckTab !== 'all' && mobileDeckTab !== 'A' ? 'hidden lg:block' : 'block'}`}>
            <Deck deckId="A" />
          </div>

          {/* Center Mixer with TikTok Live Game, Auto Mix & Master Spectrum */}
          <div className={`w-full lg:w-auto ${mobileDeckTab !== 'all' && mobileDeckTab !== 'mixer' ? 'hidden lg:block' : 'block'}`}>
            <Mixer />
          </div>

          {/* Deck B */}
          <div className={`w-full lg:flex-1 ${mobileDeckTab !== 'all' && mobileDeckTab !== 'B' ? 'hidden lg:block' : 'block'}`}>
            <Deck deckId="B" />
          </div>
        </div>

        {/* 4. YouDJ-Style Two-Column Explorer & Song Browser (FILLS SCREEN AND SCROLLS SMOOTHLY) */}
        <YouDjExplorer
          searchResults={searchResponse?.items || []}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSearch={(q) => executeSearch(q)}
          isSearching={isSearching}
          hasNextPage={Boolean(searchResponse?.nextPageToken)}
          onLoadMore={() => {
            if (searchQuery && searchResponse?.nextPageToken) {
              executeSearch(searchQuery, searchResponse.nextPageToken);
            }
          }}
        />
      </main>

      {/* Modals */}
      <SettingsModal />
      <ShortcutsModal />
      <TutorialModal />
    </div>
  );
};
