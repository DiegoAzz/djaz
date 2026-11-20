import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Search,
  X,
  Globe,
  HardDrive,
  Settings,
  Keyboard,
  HelpCircle,
  Loader2,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { useDjStore } from '../../stores/useDjStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { apiService, HealthResponse } from '../../services/api';

interface HeaderProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  layoutMode?: 'left' | 'bottom';
  onToggleLayout?: (mode: 'left' | 'bottom') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  isSearching,
  searchQuery,
  setSearchQuery
}) => {
  const { appMode, setAppMode } = useDjStore();
  const {
    setShowSettingsModal,
    setShowShortcutsModal,
    setShowTutorial
  } = useSettingsStore();

  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    apiService.checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null));

    const interval = setInterval(() => {
      apiService.checkHealth().then(setHealth).catch(() => setHealth(null));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const term = searchQuery.trim() || 'DJ mix hits';
      onSearch(term);
    }
  };

  const handleSearchClick = () => {
    const term = searchQuery.trim() || 'DJ mix hits';
    onSearch(term);
  };

  return (
    <header className="h-16 bg-[#0e131d] border-b border-[#242f42] px-2 sm:px-5 flex items-center justify-between gap-2 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#FF6B00] to-[#FF0055] p-0.5 flex items-center justify-center shadow-lg">
          <div className="w-full h-full bg-[#090d14] rounded-[10px] flex items-center justify-center">
            <Headphones className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className="hidden xs:block sm:block">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="font-black text-lg sm:text-xl tracking-tight text-white">Dj</span>
            <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-[#FF6B00] to-[#FF0055] bg-clip-text text-transparent">Az</span>
          </div>
          <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-slate-400 block -mt-1 font-semibold">
            Live Streaming Engine
          </span>
        </div>
      </div>

      {/* Main Music Search Bar with BUSCAR Button */}
      <div className="flex-1 max-w-2xl mx-1 sm:mx-3">
        {appMode === 'youtube' ? (
          <div className="relative flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-2.5 sm:left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar cualquier canción o artista..."
                className="w-full bg-[#090d14] border border-[#242f42] rounded-xl pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all shadow-inner"
              />
              {searchQuery && !isSearching && (
                <button
                  onClick={handleClear}
                  className="absolute right-2 sm:right-3 text-slate-400 hover:text-white"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Glowing Action Button: BUSCAR */}
            <button
              onClick={handleSearchClick}
              disabled={isSearching}
              className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white text-[11px] sm:text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 disabled:opacity-60 transition-all shadow-md flex items-center gap-1 sm:gap-1.5 shrink-0"
              title="Buscar canciones"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  <span className="hidden sm:inline">Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  <span>BUSCAR</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-400 bg-[#090d14] py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl border border-[#242f42]/60 flex items-center justify-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span className="truncate">Modo DJ Local activo — Carga tus archivos MP3 / WAV</span>
          </div>
        )}
      </div>

      {/* Right Controls: Mode Selector & Tool Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mode Selector */}
        <div className="flex items-center bg-[#090d14] p-0.5 sm:p-1 rounded-xl border border-[#242f42]">
          <button
            onClick={() => setAppMode('youtube')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              appMode === 'youtube'
                ? 'bg-[#00B8FF] text-black shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mezclar música online en streaming"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </button>
          <button
            onClick={() => setAppMode('local')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              appMode === 'local'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Mezclar con tus archivos MP3/WAV"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Local</span>
          </button>
        </div>

        {/* Status Badge */}
        <div
          className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-xl bg-[#090d14] border border-[#242f42]"
          title={health ? `API Uptime: ${health.uptimeSeconds}s | Conexión directa activa` : 'Verificando servicio...'}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-300">
            {health?.status === 'ok' ? 'Stream Online' : 'Conectando'}
          </span>
        </div>

        {/* Shortcuts Button */}
        <button
          onClick={() => setShowShortcutsModal(true)}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-[#090d14] hover:bg-[#1a2333] rounded-xl border border-[#242f42] transition-colors"
          title="Atajos de teclado"
        >
          <Keyboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettingsModal(true)}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-[#090d14] hover:bg-[#1a2333] rounded-xl border border-[#242f42] transition-colors"
          title="Configuración"
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Tutorial Button */}
        <button
          onClick={() => setShowTutorial(true)}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-white bg-[#090d14] hover:bg-[#1a2333] rounded-xl border border-[#242f42] transition-colors hidden sm:block"
          title="Guía de uso rápido"
        >
          <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
};
