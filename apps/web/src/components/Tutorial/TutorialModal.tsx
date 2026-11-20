import React, { useState } from 'react';
import { X, Headphones, Search, Sliders, Music, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const TutorialModal: React.FC = () => {
  const { showTutorial, setShowTutorial, dismissTutorial } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showTutorial) return null;

  const steps = [
    {
      title: '¡Bienvenido a MiniDJ!',
      subtitle: 'Tu plataforma de mezcla musical con reproductor dual de YouTube y modo DJ profesional.',
      icon: Headphones,
      color: '#00B8FF',
      content: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            MiniDJ combina la agilidad de buscar y reproducir cualquier video musical directamente desde YouTube con controles tradicionales de cabina DJ inspirados en VirtualDJ y YouDJ.
          </p>
          <div className="p-3 bg-[#0B101A] rounded-xl border border-[#2A384F] text-[11px] text-slate-400">
            💡 <strong>Sin descargas ni conversiones:</strong> Todo se reproduce de manera oficial, fluida y con la mejor calidad. Si tienes <strong>YouTube Premium</strong> en tu navegador, disfrutarás de la música sin ningún anuncio publicitario.
          </div>
        </div>
      )
    },
    {
      title: '1. Busca y Carga Canciones',
      subtitle: 'Encuentra cualquier tema musical en segundos.',
      icon: Search,
      color: '#FF3D91',
      content: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            Escribe el nombre de tu artista o canción en la barra superior. Verás los resultados con sus miniaturas y duraciones.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
            <li>Pulsa <strong>Deck A</strong> para cargar en el plato izquierdo (azul).</li>
            <li>Pulsa <strong>Deck B</strong> para cargar en el plato derecho (magenta).</li>
            <li>Pulsa <strong>+</strong> para guardar la canción en tu cola de reproducción.</li>
          </ul>
        </div>
      )
    },
    {
      title: '2. Mezcla con el Crossfader',
      subtitle: 'Transiciones suaves entre ambos platos.',
      icon: Sliders,
      color: '#00B8FF',
      content: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            El mezclador central te permite balancear los volúmenes de ambos reproductores:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
            <li><strong>Izquierda (-1):</strong> Se escucha únicamente el Plato A.</li>
            <li><strong>Centro (0):</strong> Ambos platos suenan al mismo tiempo.</li>
            <li><strong>Derecha (+1):</strong> Se escucha únicamente el Plato B.</li>
            <li><strong>Auto-transiciones:</strong> Pulsa 5s, 10s o 15s para una transición automática perfecta.</li>
          </ul>
        </div>
      )
    },
    {
      title: '3. Modo DJ Local y Efectos',
      subtitle: 'Usa tus archivos MP3 / WAV con Web Audio API.',
      icon: Music,
      color: '#FF3D91',
      content: (
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            Cambia al <strong>Modo DJ Local</strong> en la barra superior para cargar tus propios archivos de música.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
            <li>Visualización de formas de onda en tiempo real.</li>
            <li>Detección automática de BPM y sincronización (SYNC).</li>
            <li>Ecualizador de 3 bandas (Bajos, Medios, Agudos) con botones KILL.</li>
            <li>Filtro LPF/HPF, Eco/Delay y Reverb integrados.</li>
            <li>Loops de 1, 2, 4 y 8 beats.</li>
          </ul>
        </div>
      )
    }
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      dismissTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#151D2B] border border-[#2A384F] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A384F]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${step.color}20`, color: step.color }}
            >
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{step.title}</h3>
              <p className="text-[11px] text-slate-400">{step.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => setShowTutorial(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1C2638] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">{step.content}</div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2A384F] bg-[#0E1522] flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-5 bg-[#00B8FF]' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl bg-[#1C2638] hover:bg-[#2A384F] text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00B8FF] to-[#0096D1] text-black text-xs font-bold flex items-center gap-1 transition-all shadow-md"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  ¡Empezar a mezclar!
                </>
              ) : (
                <>
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
