import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Pencil, Eraser, Undo2, Trash2, Wand2, Download, RotateCcw, ZoomIn } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MontageStep = 'upload' | 'draw' | 'generating' | 'result';
type DrawTool = 'pencil' | 'eraser';

interface MontageViewProps {
  onConsumeCredits: () => Promise<boolean>;
  onUpgradeClick: () => void;
  profile: { is_admin?: boolean } | null;
}

interface Stroke {
  points: { x: number; y: number }[];
  tool: DrawTool;
  size: number;
}

const MontageView = ({ onConsumeCredits, onUpgradeClick, profile }: MontageViewProps) => {
  const [step, setStep] = useState<MontageStep>('upload');
  const [locationImage, setLocationImage] = useState<string | null>(null);
  const [facadeImage, setFacadeImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Canvas drawing state
  const [tool, setTool] = useState<DrawTool>('pencil');
  const [brushSize, setBrushSize] = useState(20);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const facadeInputRef = useRef<HTMLInputElement>(null);

  // Load background image dimensions
  useEffect(() => {
    if (!locationImage) return;
    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      redrawCanvas();
    };
    img.src = locationImage;
  }, [locationImage]);

  // Redraw canvas whenever strokes change
  useEffect(() => {
    redrawCanvas();
  }, [strokes]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !bgImageRef.current) return;

    const img = bgImageRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    for (const stroke of strokes) {
      drawStroke(ctx, stroke, canvas.width, canvas.height);
    }
  }, [strokes]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke, w: number, h: number) => {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = stroke.size;

    if (stroke.tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    }

    ctx.moveTo(stroke.points[0].x * w, stroke.points[0].y * h);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };

  const getPointerPos = (e: React.PointerEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPointerPos(e);
    const newStroke: Stroke = { points: [pos], tool, size: brushSize };
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    const updated = { ...currentStroke, points: [...currentStroke.points, pos] };
    setCurrentStroke(updated);

    // Live draw current stroke
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    redrawCanvas();
    drawStroke(ctx, updated, canvas.width, canvas.height);
  };

  const handlePointerUp = () => {
    if (currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
    setIsDrawing(false);
  };

  const handleUndo = () => setStrokes(prev => prev.slice(0, -1));
  const handleClear = () => setStrokes([]);

  const exportMask = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // Create a clean mask canvas
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = 1024;
    maskCanvas.height = Math.round(1024 * (canvas.height / canvas.width));
    const ctx = maskCanvas.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw strokes in white on black background for mask
    for (const stroke of strokes) {
      if (stroke.tool !== 'pencil') continue;
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size * (maskCanvas.width / canvas.width);
      ctx.strokeStyle = 'white';
      ctx.moveTo(stroke.points[0].x * maskCanvas.width, stroke.points[0].y * maskCanvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * maskCanvas.width, stroke.points[i].y * maskCanvas.height);
      }
      ctx.stroke();
    }
    return maskCanvas.toDataURL('image/png');
  };

  const processFile = (file: File, target: 'location' | 'facade') => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (target === 'location') setLocationImage(result);
      else setFacadeImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!locationImage || !facadeImage || strokes.length === 0) {
      toast.error("Marque a área na foto do local onde a fachada deve ser posicionada.");
      return;
    }

    const ok = await onConsumeCredits();
    if (!ok) {
      onUpgradeClick();
      return;
    }

    setGenerating(true);
    setStep('generating');

    try {
      const maskImage = exportMask();
      const { data, error } = await supabase.functions.invoke('generate-montage', {
        body: { locationImage, facadeImage, maskImage },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.imageUrl) throw new Error("Nenhuma imagem retornada");

      setResultImage(data.imageUrl);
      setStep('result');
      toast.success("Montagem gerada com sucesso! 🏗️");
    } catch (err: any) {
      console.error('Montage error:', err);
      toast.error(err?.message || "Erro ao gerar montagem.");
      setStep('draw');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `montagem-${Date.now()}.png`;
    a.click();
  };

  const resetAll = () => {
    setStep('upload');
    setLocationImage(null);
    setFacadeImage(null);
    setResultImage(null);
    setStrokes([]);
    setCurrentStroke(null);
  };

  const canProceedToDraw = locationImage && facadeImage;

  return (
    <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 py-4 md:px-8 lg:px-12 md:py-8 animate-in fade-in duration-500">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {['Enviar Fotos', 'Marcar Área', 'Resultado'].map((label, i) => {
          const stepIndex = step === 'upload' ? 0 : step === 'draw' ? 1 : 2;
          const isActive = i <= stepIndex;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                <span>{i + 1}.</span> {label}
              </div>
              {i < 2 && <div className={`w-6 h-0.5 ${isActive ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          );
        })}
      </div>

      {/* STEP: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Location photo */}
            <div
              onClick={() => locationInputRef.current?.click()}
              className={`relative group rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed cursor-pointer transition-all min-h-[250px] md:min-h-[350px] flex flex-col items-center justify-center ${
                locationImage ? 'border-primary/30 bg-surface' : 'border-border hover:border-primary/50 bg-surface'
              }`}
            >
              {locationImage ? (
                <>
                  <img src={locationImage} className="w-full h-full object-cover absolute inset-0" alt="Local" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-black uppercase tracking-widest">Trocar foto</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">
                    📍 Local
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="bg-secondary p-6 rounded-full inline-block mb-4 border border-border">
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-black mb-1 uppercase tracking-tight text-foreground">Foto do Local</h3>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Terreno, prédio ou fachada atual</p>
                </div>
              )}
            </div>

            {/* Facade photo */}
            <div
              onClick={() => facadeInputRef.current?.click()}
              className={`relative group rounded-2xl md:rounded-3xl overflow-hidden border-2 border-dashed cursor-pointer transition-all min-h-[250px] md:min-h-[350px] flex flex-col items-center justify-center ${
                facadeImage ? 'border-brand-glow/30 bg-surface' : 'border-border hover:border-brand-glow/50 bg-surface'
              }`}
            >
              {facadeImage ? (
                <>
                  <img src={facadeImage} className="w-full h-full object-cover absolute inset-0" alt="Fachada" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-black uppercase tracking-widest">Trocar foto</span>
                  </div>
                  <div className="absolute top-3 left-3 bg-brand-glow text-primary-foreground text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg">
                    🏗️ Fachada
                  </div>
                </>
              ) : (
                <div className="text-center p-8">
                  <div className="bg-secondary p-6 rounded-full inline-block mb-4 border border-border">
                    <Upload className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-black mb-1 uppercase tracking-tight text-foreground">Foto da Fachada</h3>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Render ou projeto da nova fachada</p>
                </div>
              )}
            </div>
          </div>

          {canProceedToDraw && (
            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                onClick={() => setStep('draw')}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" /> Próximo: Marcar Área
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP: Draw */}
      {step === 'draw' && locationImage && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 bg-surface border border-border rounded-2xl p-3 shadow-sm">
            <button
              onClick={() => setTool('pencil')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                tool === 'pencil' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Lápis
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                tool === 'eraser' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" /> Borracha
            </button>
            <div className="h-6 w-px bg-border mx-1" />
            <button
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <Undo2 className="w-3.5 h-3.5" /> Desfazer
            </button>
            <button
              onClick={handleClear}
              disabled={strokes.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
            <div className="h-6 w-px bg-border mx-1" />
            <div className="flex items-center gap-2 min-w-[120px]">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Tamanho</span>
              <Slider
                value={[brushSize]}
                onValueChange={([v]) => setBrushSize(v)}
                min={5}
                max={50}
                step={1}
                className="w-20"
              />
              <span className="text-[10px] font-black text-foreground tabular-nums w-6 text-right">{brushSize}</span>
            </div>
          </div>

          {/* Canvas area */}
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-border shadow-xl bg-black">
            <div ref={containerRef} className="relative w-full" style={{ aspectRatio: bgImageRef.current ? `${bgImageRef.current.width}/${bgImageRef.current.height}` : '16/9' }}>
              <img
                src={locationImage}
                className="absolute inset-0 w-full h-full object-contain"
                alt="Local"
                draggable={false}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full touch-none"
                style={{ cursor: tool === 'pencil' ? 'crosshair' : 'cell' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
            </div>
          </div>

          {/* Facade preview small */}
          {facadeImage && (
            <div className="flex items-center gap-3 bg-surface/50 border border-border rounded-xl p-3">
              <img src={facadeImage} className="w-16 h-16 rounded-lg object-cover border border-border" alt="Fachada" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Fachada selecionada</p>
                <p className="text-[9px] text-muted-foreground">Será inserida na área marcada em vermelho</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Voltar
            </button>
            <button
              onClick={handleGenerate}
              disabled={strokes.length === 0 || generating}
              className="px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              {generating ? 'Gerando Montagem...' : 'Gerar Montagem (10 créditos)'}
            </button>
          </div>
        </div>
      )}

      {/* STEP: Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 animate-in fade-in duration-500">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Wand2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">Gerando Montagem...</h3>
            <p className="text-muted-foreground text-sm">A IA está compondo sua fachada no local escolhido</p>
          </div>
        </div>
      )}

      {/* STEP: Result */}
      {step === 'result' && resultImage && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-border shadow-2xl bg-black">
            <img src={resultImage} className="w-full h-auto object-contain max-h-[70vh]" alt="Montagem Final" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleDownload}
              className="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Baixar Imagem
            </button>
            <button
              onClick={resetAll}
              className="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-secondary text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Nova Montagem
            </button>
          </div>
        </div>
      )}

      {/* Hidden inputs */}
      <input type="file" ref={locationInputRef} className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) processFile(f, 'location');
        e.target.value = '';
      }} />
      <input type="file" ref={facadeInputRef} className="hidden" accept="image/png,image/jpeg,image/webp" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) processFile(f, 'facade');
        e.target.value = '';
      }} />
    </main>
  );
};

export default MontageView;
