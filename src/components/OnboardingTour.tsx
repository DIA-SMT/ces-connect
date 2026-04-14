import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// ── Tour step definitions ─────────────────────────────────────────────────────

interface TourStep {
  targetId: string | null;
  title: string;
  description: string;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right';
  emoji?: string;
}

// Steps shown to ADMIN users (full tour with create actions)
const ADMIN_STEPS: TourStep[] = [
  {
    targetId: null,
    title: '¡Bienvenido a CES Connect!',
    description: 'Este es el sistema de gestión de comisiones y reuniones. Te vamos a mostrar las funcionalidades principales para que puedas empezar rápidamente.',
    emoji: '👋',
  },
  {
    targetId: 'tour-btn-nueva-comision',
    title: 'Crear una Comisión',
    description: 'Las comisiones son el núcleo del sistema. Cada comisión agrupa un conjunto de reuniones relacionadas. Hacé clic aquí para crear una nueva comisión definiendo su nombre, descripción e ícono.',
    preferredPosition: 'bottom',
    emoji: '🏙️',
  },
  {
    targetId: 'tour-categoria-card',
    title: 'Explorar una Comisión',
    description: 'Hacé clic en cualquier tarjeta de comisión para ver sus reuniones. Desde adentro también podés crear nuevas reuniones, agregar participantes y gestionar todo el contenido.',
    preferredPosition: 'bottom',
    emoji: '📂',
  },
  {
    targetId: 'tour-nav-reuniones',
    title: 'Vista Global de Reuniones',
    description: 'Desde "Reuniones" podés ver todas las reuniones del sistema. Dentro de cada reunión encontrás: debate, aportes, participantes, archivos, resultados e IA.',
    preferredPosition: 'bottom',
    emoji: '📅',
  },
  {
    targetId: 'tour-nav-participantes',
    title: 'Directorio de Participantes',
    description: 'Aquí gestionás el directorio de todos los participantes. Podés crear nuevos y asignarlos a reuniones específicas desde la pestaña "Participantes" de cada reunión.',
    preferredPosition: 'bottom',
    emoji: '👥',
  },
  {
    targetId: 'virtual-assistant-fab',
    title: 'Asistente Virtual IA',
    description: 'Este botón abre el asistente virtual conectado a la base de datos. Podés hacerle preguntas como "¿cuántas comisiones hay?", "¿cuándo es la próxima reunión?" o "¿qué se discutió en tal reunión?"',
    preferredPosition: 'top',
    emoji: '🤖',
  },
  {
    targetId: null,
    title: '¡Listo para empezar!',
    description: 'Ya conocés las funcionalidades principales de CES Connect. Podés volver a ver este tour en cualquier momento usando el botón "?" en el menú superior. ¡Mucho éxito!',
    emoji: '🚀',
  },
];

// Steps shown to COMMON users (read-only, focused on navigation and participation)
const COMMON_STEPS: TourStep[] = [
  {
    targetId: null,
    title: '¡Bienvenido a CES Connect!',
    description: 'Sistema de gestión de comisiones y reuniones. En este tour rápido te mostramos dónde encontrar todo lo que necesitás.',
    emoji: '👋',
  },
  {
    targetId: 'tour-categoria-card',
    title: 'Comisiones',
    description: 'Cada tarjeta es una comisión temática. Hacé clic en una para ver sus reuniones asociadas, sus debates y los aportes realizados.',
    preferredPosition: 'bottom',
    emoji: '🏙️',
  },
  {
    targetId: 'tour-nav-reuniones',
    title: 'Reuniones',
    description: 'Desde aquí podés ver todas las reuniones del sistema. Entrá a cada una para participar en el debate, subir aportes o archivos.',
    preferredPosition: 'bottom',
    emoji: '📅',
  },
  {
    targetId: 'tour-nav-participantes',
    title: 'Participantes',
    description: 'El directorio de todos los participantes registrados en el sistema.',
    preferredPosition: 'bottom',
    emoji: '👥',
  },
  {
    targetId: 'virtual-assistant-fab',
    title: 'Asistente Virtual IA',
    description: 'Preguntále al asistente cualquier cosa sobre el sistema: "¿cuándo es la próxima reunión?", "¿qué se discutió en tal reunión?", etc. Está conectado a la base de datos en tiempo real.',
    preferredPosition: 'top',
    emoji: '🤖',
  },
  {
    targetId: null,
    title: '¡Todo listo!',
    description: '¡Ya sabés cómo navegar CES Connect! Si tenés dudas, usá el botón "?" del menú para volver a ver este tour.',
    emoji: '🚀',
  },
];

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_W = 340;
const MARGIN = 16;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

// ── Smart tooltip positioning ─────────────────────────────────────────────────

function computeTooltipPlacement(
  spotlight: SpotlightRect,
  preferred: 'top' | 'bottom' | 'left' | 'right',
  vw: number,
  vh: number,
): { style: React.CSSProperties; maxHeight: number } {
  const centerX = spotlight.left + spotlight.width / 2;
  const spaceBelow = vh - (spotlight.top + spotlight.height) - MARGIN * 2;
  const spaceAbove = spotlight.top - MARGIN * 2;

  let pos = preferred;
  if (pos === 'bottom' && spaceBelow < 180) pos = spaceAbove > spaceBelow ? 'top' : 'bottom';
  if (pos === 'top' && spaceAbove < 180) pos = spaceBelow > spaceAbove ? 'bottom' : 'top';

  const w = Math.min(TOOLTIP_W, vw - MARGIN * 2);
  let style: React.CSSProperties = { width: w };
  let maxHeight: number;

  if (pos === 'bottom') {
    const top = spotlight.top + spotlight.height + MARGIN;
    style.top = top;
    style.left = Math.max(MARGIN, Math.min(centerX - w / 2, vw - w - MARGIN));
    maxHeight = Math.max(150, vh - top - MARGIN);
  } else {
    // top: place tooltip above the element
    const availableAbove = Math.max(150, spaceAbove);
    const top = Math.max(MARGIN, spotlight.top - SPOTLIGHT_PADDING - availableAbove - MARGIN);
    style.top = top;
    style.left = Math.max(MARGIN, Math.min(centerX - w / 2, vw - w - MARGIN));
    maxHeight = Math.max(150, spotlight.top - SPOTLIGHT_PADDING - top - MARGIN);
  }

  return { style, maxHeight };
}

// ── Tour Context ──────────────────────────────────────────────────────────────

interface TourContextType {
  startTour: () => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

// ── Provider + Tour Widget combined ──────────────────────────────────────────

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [tooltipMaxHeight, setTooltipMaxHeight] = useState(400);
  const [visible, setVisible] = useState(false);
  
  // Track if we need to fall back to a centered modal for a missing element
  const [isFallbackCentered, setIsFallbackCentered] = useState(false);

  const tourKey = user?.email ? `ces-tour-done-${user.email}` : null;
  const TOUR_STEPS = user?.role === 'admin' ? ADMIN_STEPS : COMMON_STEPS;

  // ── Lock body scroll ────────────────────────────────────────────────────

  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [active]);

  // ── Auto-start on first login ──────────────────────────────────────────

  useEffect(() => {
    if (isLoading || !user || !tourKey) return;
    const done = localStorage.getItem(tourKey);
    if (!done) {
      const t = setTimeout(() => { setActive(true); setStep(0); }, 800);
      return () => clearTimeout(t);
    }
  }, [user, isLoading, tourKey]);

  // ── Manual start ───────────────────────────────────────────────────────

  const startTour = useCallback(() => {
    setStep(0);
    setActive(true);
  }, []);

  // ── Compute positions ──────────────────────────────────────────────────

  const computePositions = useCallback(() => {
    const currentStep = TOUR_STEPS[step];
    if (!currentStep?.targetId) {
      setSpotlightRect(null);
      setTooltipStyle({});
      setIsFallbackCentered(false);
      return;
    }

    const el = document.getElementById(currentStep.targetId);
    if (!el) {
      // Element not found (e.g. hidden), fallback to centered
      setSpotlightRect(null);
      setTooltipStyle({});
      setIsFallbackCentered(true);
      return;
    }

    setIsFallbackCentered(false);
    const rect = el.getBoundingClientRect();
    const spotlight: SpotlightRect = {
      top: rect.top - SPOTLIGHT_PADDING,
      left: rect.left - SPOTLIGHT_PADDING,
      width: rect.width + SPOTLIGHT_PADDING * 2,
      height: rect.height + SPOTLIGHT_PADDING * 2,
      borderRadius: 16,
    };
    setSpotlightRect(spotlight);

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const preferred = currentStep.preferredPosition ?? 'bottom';
    const { style, maxHeight } = computeTooltipPlacement(spotlight, preferred, vw, vh);
    setTooltipStyle(style);
    setTooltipMaxHeight(maxHeight);
  }, [step, TOUR_STEPS]);

  useEffect(() => {
    if (!active) return;
    setVisible(false);
    const t = setTimeout(() => { computePositions(); setVisible(true); }, 80);
    const onResize = () => computePositions();
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [active, step, computePositions]);

  // Scroll element into center, then recompute
  useEffect(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    const id = currentStep?.targetId;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const t = setTimeout(() => computePositions(), 450);
      return () => clearTimeout(t);
    }
  }, [active, step, computePositions, TOUR_STEPS]);

  // ── Handlers ────────────────────────────────────────────────────────────

  function finish() {
    if (tourKey) localStorage.setItem(tourKey, '1');
    setActive(false);
    setSpotlightRect(null);
    setStep(0);
  }

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  }

  function handlePrev() {
    if (step > 0) setStep((s) => s - 1);
  }

  const currentStep = TOUR_STEPS[step];
  const isCentered = active && (!currentStep?.targetId || isFallbackCentered);
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}

      {active && (
        <>
          {/* ── Overlay ───────────────────────────────── */}
          <div className="fixed inset-0 z-[9998]" onClick={finish}>
            {spotlightRect ? (
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <defs>
                  <mask id="tour-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={spotlightRect.left} y={spotlightRect.top}
                      width={spotlightRect.width} height={spotlightRect.height}
                      rx={spotlightRect.borderRadius} fill="black"
                    />
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tour-mask)" />
                <rect
                  x={spotlightRect.left - 2} y={spotlightRect.top - 2}
                  width={spotlightRect.width + 4} height={spotlightRect.height + 4}
                  rx={spotlightRect.borderRadius + 2}
                  fill="none" stroke="hsl(206 100% 42%)" strokeWidth="2"
                  strokeDasharray="6 3" opacity={0.9}
                />
              </svg>
            ) : (
              <div className="absolute inset-0 bg-black/65" />
            )}
          </div>

          {/* ── Tooltip / Modal ───────────────────────── */}
          {isCentered ? (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ pointerEvents: 'none' }}>
              <div
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-sm"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
                  transition: 'opacity 0.25s ease, transform 0.25s ease',
                }}
              >
                <div className="bg-white rounded-3xl p-7 shadow-2xl shadow-black/25 border border-slate-200">
                  <TourCard step={currentStep} stepIndex={step} total={TOUR_STEPS.length}
                    isLast={isLast} isFirst={isFirst} onNext={handleNext} onPrev={handlePrev} onSkip={finish} />
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed z-[9999] pointer-events-auto overflow-y-auto"
              style={{
                ...tooltipStyle,
                maxHeight: tooltipMaxHeight,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                borderRadius: '1rem',
              }}
            >
              <div className="bg-white rounded-2xl p-5 shadow-2xl shadow-black/25 border border-slate-200">
                <TourCard step={currentStep} stepIndex={step} total={TOUR_STEPS.length}
                  isLast={isLast} isFirst={isFirst} onNext={handleNext} onPrev={handlePrev} onSkip={finish} />
              </div>
            </div>
          )}
        </>
      )}
    </TourContext.Provider>
  );
}

// ── Default export for backwards compat ───────────────────────────────────────
export default OnboardingTourProvider;

// ── Tour Card ─────────────────────────────────────────────────────────────────

interface TourCardProps {
  step: TourStep;
  stepIndex: number;
  total: number;
  isLast: boolean;
  isFirst: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TourCard({ step, stepIndex, total, isLast, isFirst, onNext, onPrev, onSkip }: TourCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {step.emoji && <span className="text-2xl leading-none">{step.emoji}</span>}
          <div>
            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-0.5">
              Paso {stepIndex + 1} de {total}
            </p>
            <h3 className="text-base font-bold text-foreground leading-tight">{step.title}</h3>
          </div>
        </div>
        <button onClick={onSkip}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          aria-label="Cerrar tour">
          <X className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === stepIndex ? 'w-5 bg-primary' : i < stepIndex ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Saltar tour
        </button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={onPrev} className="rounded-xl h-8 gap-1 text-xs">
              <ChevronLeft className="w-3.5 h-3.5" />Anterior
            </Button>
          )}
          <Button size="sm" onClick={onNext} className="rounded-xl h-8 gap-1 text-xs shadow-md shadow-primary/20">
            {isLast ? (
              <><Sparkles className="w-3.5 h-3.5" />¡Empezar!</>
            ) : (
              <>Siguiente<ChevronRight className="w-3.5 h-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
