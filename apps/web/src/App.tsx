import React, { useState, useEffect, useCallback } from 'react';
import { TopWaveformBar } from './components/Header/TopWaveformBar';
import { Deck } from './components/Deck/Deck';
import { Mixer } from './components/Mixer/Mixer';
import { SidebarSongBrowser } from './components/Explorer/SidebarSongBrowser';
import { AmbientClubBackground } from './components/Background/AmbientClubBackground';
import { DjCursorTrail } from './components/Effects/DjCursorTrail';
import { CasualGamesGallery } from './components/Game/CasualGamesGallery';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ShortcutsModal } from './components/Settings/ShortcutsModal';
import { TutorialModal } from './components/Tutorial/TutorialModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { apiService, SearchApiResponse } from './services/api';
import {
  Globe,
  HardDrive,
  Keyboard,
  Settings,
  HelpCircle,
  Disc,
  ListMusic,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { useDjStore } from './stores/useDjStore';
import { useSettingsStore } from './stores/useSettingsStore';

const SEARCH_CACHE_KEY = 'djaz_search_cache_v5';

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

  const { appMode, setAppMode, deckA, deckB } = useDjStore();
  const {
    setShowSettingsModal,
    setShowShortcutsModal,
    setShowTutorial
  } = useSettingsStore();

  const savedSearch = getSavedSearch();
  const [searchQuery, setSearchQuery] = useState(savedSearch.query);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<SearchApiResponse | null>(savedSearch.response);
  const [mobileActiveView, setMobileActiveView] = useState<'browser' | 'decks'>('decks');

  // Dynamic window resizing & stretching controls
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const savedW = localStorage.getItem('djaz_sidebar_width');
      if (savedW) return parseInt(savedW, 10);
    } catch {}
    return 360;
  });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [showGamesGallery, setShowGamesGallery] = useState(true);
  const [enableDjCursor, setEnableDjCursor] = useState(true);

  const handleSidebarDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(260, Math.min(640, startW + deltaX));
      setSidebarWidth(newWidth);
      try {
        localStorage.setItem('djaz_sidebar_width', newWidth.toString());
      } catch {}
    };

    const onPointerUp = () => {
      setIsDraggingSidebar(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Protection against accidental reload while songs are loaded or playing
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

      {/* Interactive DJ Animated Cursor Trail (Neon Stardust, Floating Notes & Beat Shockwaves) */}
      {enableDjCursor && <DjCursorTrail />}

      {/* Mobile Toggle Bar on small screens (< md) */}
      <div className="md:hidden shrink-0 bg-[#090d14] p-1.5 border-b border-white/10 flex items-center justify-between z-30">
        <button
          onClick={() => setMobileActiveView('browser')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === 'browser'
              ? 'bg-[#FF6B00] text-black font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
          <span>Explorador de Canciones</span>
        </button>
        <button
          onClick={() => setMobileActiveView('decks')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileActiveView === 'decks'
              ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Cabina DJ (Platos)</span>
        </button>
      </div>

      {/* Main App Body: Left Sidebar (Full-Height Song Explorer) + Drag Splitter + Right Section (Cabina DJ & Arcade) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden relative z-10">
        {/* 1. LEFT SIDEBAR: FULL-HEIGHT SONG EXPLORER WITH RESIZABLE WIDTH */}
        <div
          style={{ width: undefined }}
          className={`h-full shrink-0 ${
            mobileActiveView === 'browser' ? 'block w-full' : 'hidden md:block'
          }`}
        >
          <div
            style={{ width: `${sidebarWidth}px` }}
            className="h-full hidden md:block max-w-[85vw]"
          >
            <SidebarSongBrowser
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
          </div>
          {/* Mobile Full Width */}
          <div className="h-full md:hidden w-full">
            <SidebarSongBrowser
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
          </div>
        </div>

        {/* Vertical Draggable Splitter Handle between Sidebar and Cabina */}
        <div
          onPointerDown={handleSidebarDragStart}
          onDoubleClick={() => setSidebarWidth(360)}
          className={`hidden md:flex items-center justify-center w-2 hover:w-2.5 bg-[#121722]/80 hover:bg-[#00B8FF]/40 border-r border-white/10 cursor-col-resize select-none transition-all group z-20 ${
            isDraggingSidebar ? 'bg-[#00B8FF] w-2.5' : ''
          }`}
          title="Arrastra para agrandar o achicar el explorador de canciones (Doble clic para restablecer)"
        >
          <div className="w-0.5 h-8 bg-slate-500/50 group-hover:bg-white rounded-full transition-colors" />
        </div>

        {/* 2. RIGHT SECTION: DJ MIXING CABINA & CASUAL ARCADE GALLERY */}
        <div className={`flex-1 min-h-0 flex flex-col overflow-y-auto bg-[#090d14]/60 backdrop-blur-md ${
          mobileActiveView === 'decks' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Continuous Top Dual Waveform Bar */}
          <div className="shrink-0 bg-[#090d14]/90 border-b border-white/5">
            <TopWaveformBar />
          </div>

          {/* Sleek Tool Header Strip (Mode, Layout Resize Presets & Settings) */}
          <div className="shrink-0 bg-[#090d14]/80 border-b border-white/10 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                MODO:
              </span>
              <div className="flex items-center bg-[#131924] p-0.5 rounded-lg border border-[#242f42]">
                <button
                  onClick={() => setAppMode('youtube')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    appMode === 'youtube'
                      ? 'bg-[#00B8FF] text-black font-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Música Online en streaming"
                >
                  <Globe className="w-3 h-3" />
                  <span>Online</span>
                </button>
                <button
                  onClick={() => setAppMode('local')}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    appMode === 'local'
                      ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mezclar archivos locales MP3/WAV"
                >
                  <HardDrive className="w-3 h-3" />
                  <span>DJ Local</span>
                </button>
              </div>

              {/* Sidebar Quick Width Presets */}
              <div className="hidden lg:flex items-center gap-1 bg-[#131924] px-1.5 py-0.5 rounded-lg border border-[#242f42] text-[10px] text-slate-400 font-mono">
                <span className="text-[9px] uppercase font-bold text-slate-500 mr-0.5">Lista:</span>
                <button
                  onClick={() => setSidebarWidth(280)}
                  className={`px-1.5 py-0.5 rounded ${sidebarWidth === 280 ? 'bg-white/20 text-white font-bold' : 'hover:text-white'}`}
                  title="Lista compacta (280px)"
                >
                  280
                </button>
                <button
                  onClick={() => setSidebarWidth(360)}
                  className={`px-1.5 py-0.5 rounded ${sidebarWidth === 360 ? 'bg-white/20 text-white font-bold' : 'hover:text-white'}`}
                  title="Lista normal (360px)"
                >
                  360
                </button>
                <button
                  onClick={() => setSidebarWidth(480)}
                  className={`px-1.5 py-0.5 rounded ${sidebarWidth === 480 ? 'bg-white/20 text-white font-bold' : 'hover:text-white'}`}
                  title="Lista ancha (480px)"
                >
                  480
                </button>
              </div>
            </div>

            {/* Quick Feature Toggles (Arcade Gallery & DJ Cursor) + Modals */}
            <div className="flex items-center gap-1.5">
              {/* Toggle Casual Games Gallery */}
              <button
                onClick={() => setShowGamesGallery(!showGamesGallery)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                  showGamesGallery
                    ? 'bg-gradient-to-r from-[#FF6B00]/20 to-[#FF0055]/20 text-[#FF6B00] border-[#FF6B00]/50'
                    : 'bg-[#131924] text-slate-400 border-[#242f42] hover:text-white'
                }`}
                title="Mostrar u ocultar la galería de juegos casuales"
              >
                <Gamepad2 className="w-3 h-3" />
                <span>JUEGOS {showGamesGallery ? 'ON' : 'OFF'}</span>
              </button>

              {/* Toggle Animated DJ Cursor */}
              <button
                onClick={() => setEnableDjCursor(!enableDjCursor)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                  enableDjCursor
                    ? 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/40 shadow-sm'
                    : 'bg-[#131924] text-slate-400 border-[#242f42] hover:text-white'
                }`}
                title="Efecto de puntero láser DJ en vivo"
              >
                <Sparkles className="w-3 h-3" />
                <span>CURSOR DJ</span>
              </button>

              <button
                onClick={() => setShowShortcutsModal(true)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#131924] rounded-lg border border-[#242f42] transition-colors"
                title="Atajos de teclado"
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#131924] rounded-lg border border-[#242f42] transition-colors"
                title="Configuración"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTutorial(true)}
                className="p-1.5 text-slate-400 hover:text-white bg-[#131924] rounded-lg border border-[#242f42] transition-colors hidden sm:block"
                title="Ayuda rápida"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. The 3 DJ Cabina Columns (Deck A | Mixer | Deck B) */}
          <div className="shrink-0 p-2 sm:p-2.5 flex flex-col lg:flex-row gap-2 items-stretch">
            {/* Deck A */}
            <div className="w-full lg:flex-1">
              <Deck deckId="A" />
            </div>

            {/* Center Mixer with TikTok Live Game & Audio Spectrum */}
            <div className="w-full lg:w-auto">
              <Mixer />
            </div>

            {/* Deck B */}
            <div className="w-full lg:flex-1">
              <Deck deckId="B" />
            </div>
          </div>

          {/* 4. Casual Arcade Games Gallery (The organized games zone requested by user!) */}
          {showGamesGallery && (
            <div className="p-2 sm:p-2.5 pt-0">
              <CasualGamesGallery />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SettingsModal />
      <ShortcutsModal />
      <TutorialModal />
    </div>
  );
};
