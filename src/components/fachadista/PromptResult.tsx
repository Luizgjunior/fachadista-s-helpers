import { Copy, Check, Zap, Sparkles, Eye, RefreshCw, Download } from "lucide-react";
import { GeneratedPrompt } from "@/types/fachadista";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { CREDIT_COSTS } from "@/hooks/useCredits";

interface PromptResultProps {
  result: GeneratedPrompt;
  copied: boolean;
  onCopy: (text: string) => void;
  previewLoading: boolean;
  onGeneratePreview: () => void;
  userCredits: number;
  isAdmin: boolean;
}

const PromptResult = ({
  result,
  copied,
  onCopy,
  previewLoading,
  onGeneratePreview,
  userCredits,
  isAdmin,
}: PromptResultProps) => {
  const [fakeProgress, setFakeProgress] = useState(0);
  const canGenerate = isAdmin || userCredits >= CREDIT_COSTS.IMAGE;

  useEffect(() => {
    if (!previewLoading) {
      setFakeProgress(0);
      return;
    }
    setFakeProgress(0);
    const interval = setInterval(() => {
      setFakeProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8));
    }, 500);
    return () => clearInterval(interval);
  }, [previewLoading]);

  const handleDownload = () => {
    if (!result.previewUrl) return;
    const a = document.createElement("a");
    a.href = result.previewUrl;
    a.download = `fcd-render-${result.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass-panel rounded-3xl md:rounded-[40px] p-5 md:p-12 space-y-6 md:space-y-10 shadow-2xl shadow-muted/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-6 md:pb-10">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-light rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-tight text-foreground">AI Prompt Engine</h2>
              <p className="text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Otimizado para Midjourney v6.1</p>
            </div>
          </div>
          <button
            onClick={() => onCopy(result.english)}
            className={`flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-xs font-black uppercase tracking-widest transition-all w-full md:w-auto justify-center shadow-lg ${
              copied ? 'bg-green-600 text-primary-foreground' : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {copied ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <Copy className="w-4 h-4 md:w-5 md:h-5" />}
            {copied ? 'Copiado' : 'Copiar Tudo'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="space-y-5 md:space-y-8">
            <div>
              <span className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-3 md:mb-4">Prompt Estruturado</span>
              <div className="bg-field-bg p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-border text-sm md:text-lg leading-relaxed text-foreground min-h-[140px] md:min-h-[180px] whitespace-pre-wrap font-medium shadow-inner shadow-muted/50">
                {result.english}
              </div>
            </div>
            <div>
              <span className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-3 md:mb-4">Tags de Laboratório</span>
              <div className="flex flex-wrap gap-2">
                {result.tags.map(t => (
                  <span key={t} className="bg-secondary border border-border px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold text-muted-foreground">#{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-8">
            <span className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-3 md:mb-4">Preview de Amostra (IA)</span>
            <div className="relative aspect-square bg-secondary rounded-2xl md:rounded-[32px] border border-border overflow-hidden shadow-xl group">
              {/* State 1: No preview, not loading */}
              {!result.previewUrl && !previewLoading && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10 text-center gap-4">
                  <Eye className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-sm md:text-base font-black text-muted-foreground uppercase tracking-wide">Render com IA</p>
                  <p className="text-[10px] md:text-xs font-bold text-muted-foreground/60">Gere uma visualização fotorrealista do seu projeto</p>
                  <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {CREDIT_COSTS.IMAGE} créditos
                  </span>
                  <button
                    onClick={onGeneratePreview}
                    disabled={!canGenerate}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      canGenerate
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                    title={!canGenerate ? `Créditos insuficientes (necessário: ${CREDIT_COSTS.IMAGE})` : undefined}
                  >
                    <Sparkles className="w-4 h-4" />
                    Gerar Render IA
                  </button>
                  {!isAdmin && (
                    <p className="text-[9px] font-bold text-muted-foreground/50">Consome {CREDIT_COSTS.IMAGE} créditos</p>
                  )}
                </div>
              )}

              {/* State 2: Loading */}
              {previewLoading && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10 text-center gap-5 backdrop-blur-sm">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">
                    Gerando render...
                  </p>
                  <div className="w-3/4">
                    <Progress value={fakeProgress} className="h-1" />
                  </div>
                </div>
              )}

              {/* State 3: Preview generated */}
              {result.previewUrl && !previewLoading && (
                <>
                  <img src={result.previewUrl} className="w-full h-full object-cover" alt="Render IA" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 text-foreground text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors shadow-lg"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </button>
                    <button
                      onClick={onGeneratePreview}
                      disabled={!canGenerate}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-lg ${
                        canGenerate
                          ? 'bg-primary text-primary-foreground hover:opacity-90'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerar
                    </button>
                  </div>
                  {/* Badge */}
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-sm">
                    IA Generated
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptResult;
