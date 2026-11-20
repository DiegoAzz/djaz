import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setShowShortcutsModal } = useSettingsStore();

  if (!showShortcutsModal) return null;

  const shortcuts = [
    { section: 'PLATO A (AZUL)', items: [
      { key: 'Barra Espaciadora', desc: 'Play / Pausa Plato A' },
      { key: 'Q', desc: 'Punto CUE Plato A' },
      { key: '1, 2, 3, 4', desc: 'Activar Loops (1, 2, 4, 8 beats) en Modo Local' }
    ]},
    { section: 'PLATO B (MAGENTA)', items: [
      { key: 'Enter', desc: 'Play / Pausa Plato B' },
      { key: 'P', desc: 'Punto CUE Plato B' },
      { key: '7, 8, 9, 0', desc: 'Activar Loops (1, 2, 4, 8 beats) en Modo Local' }
    ]},
    { section: 'MEZCLADOR & CROSSFADER', items: [
      { key: 'X', desc: 'Mover Crossfader al extremo izquierdo (100% Plato A)' },
      { key: 'C', desc: 'Centrar Crossfader (50% Plato A / 50% Plato B)' },
      { key: 'V', desc: 'Mover Crossfader al extremo derecho (100% Plato B)' }
    ]},
    { section: 'GENERAL', items: [
      { key: 'Shift + ?', desc: 'Abrir esta ventana de atajos' },
      { key: 'Esc', desc: 'Cerrar cualquier ventana flotante' }
    ]}
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#151D2B] border border-[#2A384F] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A384F]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#00B8FF]" />
            <h3 className="font-bold text-white text-base">Atajos de Teclado</h3>
          </div>
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1C2638] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {shortcuts.map((group) => (
            <div key={group.section} className="space-y-1.5">
              <h4 className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                {group.section}
              </h4>
              <div className="bg-[#0B101A] border border-[#2A384F] rounded-xl divide-y divide-[#1C2638]">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-slate-300">{item.desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-[#1C2638] border border-[#2A384F] font-mono text-[11px] font-bold text-white">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2A384F] bg-[#0E1522] flex justify-end">
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="px-4 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#2A384F] text-white font-bold text-xs transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
