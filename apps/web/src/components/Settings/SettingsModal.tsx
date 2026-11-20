import React from 'react';
import { X, Settings, ShieldCheck, Keyboard, Sliders, Sparkles } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const SettingsModal: React.FC = () => {
  const {
    showSettingsModal,
    setShowSettingsModal,
    preferences,
    updatePreferences
  } = useSettingsStore();

  if (!showSettingsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#151D2B] border border-[#2A384F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A384F]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00B8FF]" />
            <h3 className="font-bold text-white text-base">Ajustes de MiniDJ</h3>
          </div>
          <button
            onClick={() => setShowSettingsModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1C2638] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* YouTube & Premium Notice */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
              <ShieldCheck className="w-4 h-4" />
              <span>Compatibilidad con YouTube Premium</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>¡Tu suscripción de YouTube Premium sí sirve!</strong> Los reproductores de MiniDJ utilizan la interfaz oficial incrustada de YouTube. Si tienes iniciada tu sesión de Google con YouTube Premium en este navegador, los videos se reproducirán <strong>completamente sin anuncios publicitarios</strong> durante tus mezclas.
            </p>
          </div>

          {/* Crossfader Curve */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#00B8FF]" />
              Curva del Crossfader
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updatePreferences({ crossfaderCurve: 'linear' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  preferences.crossfaderCurve === 'linear'
                    ? 'bg-[#00B8FF]/15 border-[#00B8FF] text-white shadow-sm'
                    : 'bg-[#0B101A] border-[#2A384F] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Lineal (DJ Club)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Atenuación suave y equilibrada en el centro.</div>
              </button>
              <button
                onClick={() => updatePreferences({ crossfaderCurve: 'smooth' })}
                className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                  preferences.crossfaderCurve === 'smooth'
                    ? 'bg-[#00B8FF]/15 border-[#00B8FF] text-white shadow-sm'
                    : 'bg-[#0B101A] border-[#2A384F] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold">Smooth (House / Disco)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Ambas canciones mantienen 100% de volumen cerca del centro.</div>
              </button>
            </div>
          </div>

          {/* Default Auto Transition Duration */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF3D91]" />
              Duración Predeterminada de Auto-Transición
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([5, 10, 15] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => updatePreferences({ defaultAutoTransitionSec: sec })}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    preferences.defaultAutoTransitionSec === sec
                      ? 'bg-[#FF3D91]/20 border-[#FF3D91] text-white'
                      : 'bg-[#0B101A] border-[#2A384F] text-slate-400 hover:text-white'
                  }`}
                >
                  {sec} Segundos
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B101A] border border-[#2A384F]">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-xs font-bold text-white block">Atajos de Teclado Activos</span>
                <span className="text-[10px] text-slate-400">Permite controlar reproducción y crossfader con teclas.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.keyboardShortcutsEnabled}
              onChange={(e) => updatePreferences({ keyboardShortcutsEnabled: e.target.checked })}
              className="w-4 h-4 rounded bg-[#1C2638] border-[#2A384F] text-[#00B8FF] focus:ring-0 cursor-pointer"
            />
          </div>

          {/* YouTube Data API Configuration Note */}
          <div className="p-3 bg-[#0B101A] border border-[#2A384F] rounded-xl text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Clave de YouTube Data API (Backend):</span>
            <p className="text-[11px] leading-relaxed">
              La búsqueda utiliza YouTube Data API v3 mediante el servidor backend. Puedes configurar la variable <code className="text-[#00B8FF] bg-[#1C2638] px-1 py-0.5 rounded">YOUTUBE_API_KEY</code> en tu archivo <code className="text-[#00B8FF] bg-[#1C2638] px-1 py-0.5 rounded">.env</code> para habilitar búsquedas ilimitadas dentro de la cuota diaria gratuita de Google Cloud.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2A384F] bg-[#0E1522] flex justify-end">
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-5 py-2 rounded-xl bg-[#00B8FF] hover:bg-[#0096D1] text-black font-bold text-xs transition-all shadow-md"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
