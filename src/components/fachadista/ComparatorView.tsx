import { useRef, useCallback, useState, useEffect } from "react";
import { ArrowRightLeft, ImageIcon, Sparkles, Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface ComparatorViewProps {
  beforeImage: string | null;
  afterImage: string | null;
  setBeforeImage: (v: string | null) => void;
  setAfterImage: (v: string | null) => void;
  beforeInputRef: React.RefObject<HTMLInputElement | null>;
  afterInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => void;
}

const ComparatorView = ({
  beforeImage, afterImage, setBeforeImage, setAfterImage,
  beforeInputRef, afterInputRef, onFileUpload
}: ComparatorViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(100, Math.max(0, position)));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  }, [updatePosition]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4 md:px-8 lg:px-12 md:py-8 flex flex-col gap-5 md:gap-10 animate-in fade-in duration-500">
      <div className="text-center space-y-1.5 md:space-y-3">
        <h2 className="text-xl md:text-4xl font-black uppercase tracking-tighter text-foreground">Comparador de Render</h2>
        <p className="text-[9px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Visualize a evolução do seu projeto</p>
      </div>

      {!beforeImage || !afterImage ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-10 max-w-5xl mx-auto w-full">
          {/* Before card */}
          <div
            onClick={() => beforeInputRef.current?.click()}
            className="bg-surface border border-border rounded-2xl md:rounded-[45px] p-6 md:p-12 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:border-primary/30 transition-all group relative overflow-hidden shadow-lg md:shadow-xl shadow-muted/20 md:shadow-muted/30"
          >
            {beforeImage ? (
              <>
                <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Antes" />
                <div className="z-10 bg-surface/90 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md border border-border shadow-xl">
                  <Check className="w-7 h-7 md:w-10 md:h-10 text-green-500" />
                </div>
                <p className="z-10 mt-3 md:mt-6 font-black uppercase tracking-[0.2em] text-foreground text-xs">Sketch / Base OK</p>
              </>
            ) : (
              <>
                <div className="bg-secondary p-5 md:p-8 rounded-full mb-4 md:mb-8 group-hover:scale-110 transition-transform shadow-md border border-border">
                  <ImageIcon className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm md:text-xl font-black uppercase text-foreground mb-1.5 md:mb-3">Snapshot Antes</h3>
                <p className="text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground text-center leading-relaxed mb-2 md:mb-4">Arraste seu rascunho ou snapshot</p>
                <div className="bg-secondary/80 px-3 py-1.5 rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-widest border border-border/50">
                  Ou Ctrl+V
                </div>
              </>
            )}
          </div>

          {/* After card */}
          <div
            onClick={() => afterInputRef.current?.click()}
            className="bg-surface border border-border rounded-2xl md:rounded-[45px] p-6 md:p-12 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:border-primary/30 transition-all group relative overflow-hidden shadow-lg md:shadow-xl shadow-muted/20 md:shadow-muted/30"
          >
            {afterImage ? (
              <>
                <img src={afterImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Depois" />
                <div className="z-10 bg-surface/90 px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md border border-border shadow-xl">
                  <Check className="w-7 h-7 md:w-10 md:h-10 text-green-500" />
                </div>
                <p className="z-10 mt-3 md:mt-6 font-black uppercase tracking-[0.2em] text-foreground text-xs">Render Final OK</p>
              </>
            ) : (
              <>
                <div className="bg-secondary p-5 md:p-8 rounded-full mb-4 md:mb-8 group-hover:scale-110 transition-transform shadow-md border border-border">
                  <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm md:text-xl font-black uppercase text-foreground mb-1.5 md:mb-3">Render Depois</h3>
                <p className="text-[9px] md:text-xs uppercase tracking-widest text-muted-foreground text-center leading-relaxed mb-2 md:mb-4">Sua visualização final fotorrealista</p>
                <div className="bg-secondary/80 px-3 py-1.5 rounded-lg text-[9px] font-black text-muted-foreground uppercase tracking-widest border border-border/50">
                  Ou Ctrl+V
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto space-y-5 md:space-y-8 animate-in zoom-in-95 duration-500">
          {/* Labels */}
          <div className="flex justify-between items-center px-1 md:px-8">
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl border border-border shadow-sm">
              <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
              <span className="text-[9px] md:text-sm font-black uppercase tracking-[0.15em] text-foreground">PROJETO BASE</span>
            </div>
            <div className="flex items-center gap-2 bg-primary px-3 py-1.5 md:px-6 md:py-3 rounded-lg md:rounded-2xl border border-primary shadow-sm shadow-primary/20">
              <span className="text-[9px] md:text-sm font-black uppercase tracking-[0.15em] text-primary-foreground">RENDER FINAL</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-primary-foreground" />
            </div>
          </div>

          {/* Comparator */}
          <div
            ref={containerRef}
            className="relative w-full aspect-[3/2] md:aspect-video rounded-2xl md:rounded-[40px] overflow-hidden cursor-ew-resize border-2 border-border shadow-xl md:shadow-2xl select-none bg-secondary touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* After image (full, covers entire area) */}
            <img src={afterImage} className="absolute inset-0 w-full h-full object-cover" alt="Render" draggable={false} />
            
            {/* Before image (clipped — same size, same position, reveals on drag) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
              <img
                src={beforeImage}
                className="absolute inset-0 w-full h-full object-cover"
                alt="Projeto"
                draggable={false}
              />
            </div>

            {/* Divider line */}
            <div
              className="absolute top-0 bottom-0 w-[3px] md:w-[4px] -translate-x-1/2 pointer-events-none z-10"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-full h-full bg-primary/90 shadow-[0_0_20px_rgba(217,70,239,0.4)]" />
            </div>

            {/* Handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-11 h-11 md:w-14 md:h-14 bg-surface rounded-full shadow-2xl flex items-center justify-center border-[3px] md:border-[4px] border-primary transition-transform hover:scale-110">
                <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
            </div>

            {/* Corner labels */}
            <div className="absolute top-3 left-3 md:top-5 md:left-5 bg-background/80 backdrop-blur-sm px-2.5 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl pointer-events-none z-10">
              <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-foreground/80">Antes</span>
            </div>
            <div className="absolute top-3 right-3 md:top-5 md:right-5 bg-primary/80 backdrop-blur-sm px-2.5 py-1 md:px-4 md:py-1.5 rounded-lg md:rounded-xl pointer-events-none z-10">
              <span className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-primary-foreground/90">Depois</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center flex-col items-center gap-3">
            <p className="text-[9px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">
              Arraste o controle para comparar
            </p>
            <button
              onClick={() => { setBeforeImage(null); setAfterImage(null); setSliderPos(50); }}
              className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border px-5 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              Novo Comparativo
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ComparatorView;
