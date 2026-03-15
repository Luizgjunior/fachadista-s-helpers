import { useRef, useCallback } from "react";
import { ArrowRightLeft, ImageIcon, Sparkles, Check } from "lucide-react";

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
  const sliderPosition = useRef(50);

  const handleSliderMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const position = ((x - rect.left) / rect.width) * 100;
      const clamped = Math.min(100, Math.max(0, position));
      sliderPosition.current = clamped;

      const clipEl = containerRef.current.querySelector('[data-clip]') as HTMLElement;
      const handleEl = containerRef.current.querySelector('[data-handle]') as HTMLElement;
      if (clipEl) clipEl.style.width = `${clamped}%`;
      if (handleEl) handleEl.style.left = `${clamped}%`;
    }
  }, []);

  return (
    <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-10 flex flex-col gap-6 md:gap-10 animate-in fade-in duration-500">
      <div className="text-center space-y-2 md:space-y-3">
        <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground">Comparador de Render</h2>
        <p className="text-[10px] md:text-sm font-bold text-muted-foreground uppercase tracking-widest">Visualize a evolução do seu projeto</p>
      </div>

      {!beforeImage || !afterImage ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-10 max-w-5xl mx-auto w-full">
          <div
            onClick={() => beforeInputRef.current?.click()}
            className="bg-surface border border-border rounded-3xl md:rounded-[45px] p-8 md:p-12 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:bg-surface-hover hover:border-primary/30 transition-all group relative overflow-hidden shadow-xl shadow-muted/30"
          >
            {beforeImage ? (
              <>
                <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Antes" />
                <div className="z-10 bg-surface/90 px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md border border-border shadow-xl">
                  <Check className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                </div>
                <p className="z-10 mt-4 md:mt-6 font-black uppercase tracking-[0.2em] text-foreground text-xs md:text-sm">Sketch / Base OK</p>
              </>
            ) : (
              <>
                <div className="bg-secondary p-6 md:p-8 rounded-full mb-6 md:mb-8 group-hover:scale-110 transition-transform shadow-md border border-border">
                  <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base md:text-xl font-black uppercase text-foreground mb-2 md:mb-3">Snapshot Antes</h3>
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground text-center leading-relaxed mb-3 md:mb-4">Arraste seu rascunho ou snapshot inicial</p>
                <div className="bg-secondary/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border/50">
                  Ou Ctrl+V
                </div>
              </>
            )}
          </div>

          <div
            onClick={() => afterInputRef.current?.click()}
            className="bg-surface border border-border rounded-3xl md:rounded-[45px] p-8 md:p-12 flex flex-col items-center justify-center aspect-[4/3] cursor-pointer hover:bg-surface-hover hover:border-primary/30 transition-all group relative overflow-hidden shadow-xl shadow-muted/30"
          >
            {afterImage ? (
              <>
                <img src={afterImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Depois" />
                <div className="z-10 bg-surface/90 px-5 py-2.5 md:px-6 md:py-3 rounded-xl md:rounded-2xl backdrop-blur-md border border-border shadow-xl">
                  <Check className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                </div>
                <p className="z-10 mt-4 md:mt-6 font-black uppercase tracking-[0.2em] text-foreground text-xs md:text-sm">Render Final OK</p>
              </>
            ) : (
              <>
                <div className="bg-secondary p-6 md:p-8 rounded-full mb-6 md:mb-8 group-hover:scale-110 transition-transform shadow-md border border-border">
                  <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-base md:text-xl font-black uppercase text-foreground mb-2 md:mb-3">Render Depois</h3>
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground text-center leading-relaxed mb-3 md:mb-4">Arraste sua visualização final fotorrealista</p>
                <div className="bg-secondary/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-border/50">
                  Ou Ctrl+V
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex justify-between items-center px-2 md:px-8">
            <div className="bg-surface px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-border shadow-sm">
              <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-foreground">PROJETO BASE</span>
            </div>
            <div className="bg-primary px-4 py-2 md:px-6 md:py-3 rounded-xl md:rounded-2xl border border-primary shadow-sm">
              <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-primary-foreground">RESULTADO FINAL</span>
            </div>
          </div>

          <div
            ref={containerRef}
            className="relative w-full aspect-[4/3] md:aspect-video rounded-3xl md:rounded-[55px] overflow-hidden cursor-ew-resize border border-border shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] md:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] select-none bg-secondary"
            onMouseMove={handleSliderMove}
            onTouchMove={handleSliderMove}
            onClick={handleSliderMove}
          >
            <img src={afterImage} className="absolute inset-0 w-full h-full object-cover" alt="Depois" draggable={false} />
            <div
              data-clip
              className="absolute inset-0 overflow-hidden border-r-4 border-primary shadow-[15px_0_40px_rgba(217,70,239,0.2)]"
              style={{ width: '50%' }}
            >
              <img
                src={beforeImage}
                className="absolute inset-0 w-full h-full object-cover max-w-none"
                style={{ width: containerRef.current?.offsetWidth || '100%' }}
                alt="Antes"
                draggable={false}
              />
            </div>
            <div
              data-handle
              className="absolute top-0 bottom-0 w-10 md:w-12 -ml-5 md:-ml-6 flex items-center justify-center pointer-events-none"
              style={{ left: '50%' }}
            >
              <div className="w-10 h-10 md:w-14 md:h-14 bg-surface rounded-full shadow-2xl flex items-center justify-center border-[3px] md:border-[4px] border-primary scale-110">
                <ArrowRightLeft className="w-4 h-4 md:w-6 md:h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="flex justify-center flex-col items-center gap-3 md:gap-4">
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] md:tracking-[0.3em] animate-pulse">Deslize para comparar</p>
            <button
              onClick={() => { setBeforeImage(null); setAfterImage(null); }}
              className="bg-surface hover:bg-surface-hover border border-border px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all shadow-sm"
            >
              Fazer novo Comparativo
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default ComparatorView;
