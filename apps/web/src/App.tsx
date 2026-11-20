import React, { useState, useEffect, useCallback } from 'react';
import { TopWaveformBar } from './components/Header/TopWaveformBar';
import { Header } from './components/Header/Header';
import { Deck } from './components/Deck/Deck';
import { Mixer } from './components/Mixer/Mixer';
import { SearchResults } from './components/Search/SearchResults';
import { Playlist } from './components/Playlist/Playlist';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ShortcutsModal } from './components/Settings/ShortcutsModal';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { apiService, SearchApiResponse } from './services/api';
import { Search, ListMusic, Sparkles, Gamepad2, Disc } from 'lucide-react';
import { useDjStore } from './stores/useDjStore';

const SEARCH_CACHE_KEY = 'minidj_search_cache_v3';

interface SavedSearchState {
  query: string;
  response: SearchApiResponse | null;
}

const getSavedSearch = (): SavedSearchState => {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { query: '', response: null };
};

const saveSearchToStorage = (query: string, response: SearchApiResponse | null) => {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({ query, response }));
  } catch {}
};

export const App: React.FC = () => {
  useKeyboardShortcuts();

  const { appMode, deckA, deckB } = useDjStore();

  const savedSearch = getSavedSearch();
  const [searchQuery, setSearchQuery] = useState(savedSearch.query);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchApiResponse | null>(savedSearch.response);
  const [activeBottomTab, setActiveBottomTab] = useState<'search' | 'playlist'>('search');
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
            '⚠️ Hay música reproduciéndose en MiniDJ.\n\nSi recargas la página se detendrá el audio de tu Live. ¿Deseas recargar de todos modos?'
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
        e.returnValue = 'Hay música cargada en MiniDJ. Si sales o recargas se pausará el audio.';
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

  // Debounce search query by 500ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

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
      setActiveBottomTab('search');
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
      executeSearch('DJ mix hits');
    }
  }, [savedSearch.response, executeSearch]);

  return (
    <div className="min-h-screen flex flex-col bg-[#090d14] text-white">
      {/* 1. Signature YouDJ Top Dual Waveform & Center BPM Banner */}
      <TopWaveformBar />

      {/* 2. Main Header */}
      <Header
        onSearch={(q) => executeSearch(q)}
        isSearching={isSearching}
        searchQuery={searchQuery}
        setSearchQuery={(q) => {
          setSearchQuery(q);
          saveSearchToStorage(q, searchResponse);
        }}
      />

      {/* 3. Central Console: Mobile View Switcher on small screens */}
      <div className="lg:hidden px-3 pt-2">
        <div className="flex items-center justify-between bg-[#121722] p-1 rounded-xl border border-[#242f42] text-[11px] font-bold">
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

      {/* Main Console: [DECK A | MIXER & GAME | DECK B] */}
      <main className="flex-1 p-2 sm:p-4 flex flex-col gap-3 max-w-[1750px] w-full mx-auto">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          {/* Deck A */}
          <div className={`w-full lg:flex-1 ${mobileDeckTab !== 'all' && mobileDeckTab !== 'A' ? 'hidden lg:block' : 'block'}`}>
            <Deck deckId="A" />
          </div>

          {/* Center Mixer with Casual Game & Auto Mix */}
          <div className={`w-full lg:w-auto ${mobileDeckTab !== 'all' && mobileDeckTab !== 'mixer' ? 'hidden lg:block' : 'block'}`}>
            <Mixer />
          </div>

          {/* Deck B */}
          <div className={`w-full lg:flex-1 ${mobileDeckTab !== 'all' && mobileDeckTab !== 'B' ? 'hidden lg:block' : 'block'}`}>
            <Deck deckId="B" />
          </div>
        </div>

        {/* 4. Bottom Song Browser Section (100% Persisted) */}
        <section className="bg-[#121722] rounded-2xl border border-[#242f42] p-2.5 sm:p-3.5 flex flex-col gap-3 shadow-2xl">
          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[#242f42] pb-2.5">
            <div className="flex items-center gap-2">
              {appMode === 'youtube' && (
                <button
                  onClick={() => setActiveBottomTab('search')}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    activeBottomTab === 'search'
                      ? 'bg-[#FF6B00]/25 text-[#FF6B00] border border-[#FF6B00]/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscador de Música</span>
                  {searchResponse?.items?.length ? (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FF6B00] text-[9px] text-black font-extrabold">
                      {searchResponse.items.length}
                    </span>
                  ) : null}
                </button>
              )}

              <button
                onClick={() => setActiveBottomTab('playlist')}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  activeBottomTab === 'playlist' || appMode === 'local'
                    ? 'bg-[#FF0055]/25 text-[#FF0055] border border-[#FF0055]/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Cola de Canciones</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Resultados guardados permanentemente • Pulsa <strong>DECK A</strong> o <strong>DECK B</strong></span>
            </div>
          </div>

          {/* Content */}
          <div className="pt-0.5">
            {activeBottomTab === 'search' && appMode === 'youtube' ? (
              <SearchResults
                results={searchResponse?.items || []}
                warning={searchResponse?.warning}
                source={searchResponse?.source}
                isLoading={isSearching}
                hasNextPage={Boolean(searchResponse?.nextPageToken)}
                onLoadMore={() => {
                  if (searchQuery && searchResponse?.nextPageToken) {
                    executeSearch(searchQuery, searchResponse.nextPageToken);
                  }
                }}
              />
            ) : (
              <Playlist />
            )}
          </div>
        </section>
      </main>

      {/* Modals */}
      <SettingsModal />
      <ShortcutsModal />
      <TutorialModal />
    </div>
  );
};
