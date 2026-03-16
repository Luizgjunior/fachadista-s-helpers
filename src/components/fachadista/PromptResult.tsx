import { Copy, Check, Zap, Sparkles, Eye, RefreshCw, Download } from "lucide-react";
import { GeneratedPrompt } from "@/types/fachadista";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { CREDIT_COSTS } from "@/hooks/useCredits";

const loadingMessages = [
  "Analisando composição arquitetônica...",
  "Calculando física de luz...",
  "Renderizando materiais...",
  "Aplicando profundidade de campo...",
  "Adicionando elementos de entorno...",
  "Finalizando fotorrealismo...",
  "Quase pronto...",
];

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
  result, copied, onCopy, previewLoading, onGeneratePreview, userCredits, isAdmin,
}: PromptResultProps) => {
  const [fakeProgress, setFakeProgress] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const canGenerate = isAdmin || userCredits >= CREDIT_COSTS.IMAGE;

  useEffect(() => {
    if (!previewLoading) { setFakeProgress(0); setLoadingMsgIndex(0); return; }
    setFakeProgress(0);
    setLoadingMsgIndex(0);
    const progressInterval = setInterval(() => {
      setFakeProgress((p) => (p >= 95 ? 95 : p + Math.random() * 8));
    }, 500);
    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 3000);
    return () => { clearInterval(progressInterval); clearInterval(msgInterval); };
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
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="glass-panel rounded-2xl md:rounded-[40px] p-4 md:p-10 space-y-5 md:space-y-10 shadow-xl md:shadow-2xl shadow-muted/20 md:shadow-muted/30">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 md:pb-8">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="w-9 h-9 md:w-14 md:h-14 bg-brand-light rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-base md:text-2xl font-black uppercase italic tracking-tight text-foreground">AI Prompt</h2>
              <p className="text-[9px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Midjourney v6.1</p>
            </div>
          </div>
          <button
            onClick={() => onCopy(result.english)}
            className={`flex items-center gap-1.5 md:gap-3 px-4 py-2.5 md:px-8 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-md ${
              copied ? 'bg-green-600 text-primary-foreground' : 'bg-foreground text-background hover:opacity-90'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <Copy className="w-3.5 h-3.5 md:w-5 md:h-5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-5 md:gap-10">
          {/* Prompt text */}
          <div className="space-y-4 md:space-y-8">
            <div>
              <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-2 md:mb-4">Prompt Estruturado</span>
              <div className="bg-field-bg p-3.5 md:p-8 rounded-xl md:rounded-[32px] border border-border text-[13px] md:text-lg leading-relaxed text-foreground min-h-[100px] md:min-h-[180px] whitespace-pre-wrap font-medium shadow-inner shadow-muted/50">
                {result.english}
              </div>
            </div>
            <div>
              <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-2 md:mb-4">Tags</span>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {result.tags.map(t => (
                  <span key={t} className="bg-secondary border border-border px-2.5 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-xs font-bold text-muted-foreground">#{t}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-2 md:mb-4">Preview IA</span>
            <div className="relative aspect-square bg-secondary rounded-xl md:rounded-[32px] border border-border overflow-hidden shadow-lg md:shadow-xl group">
              {!result.previewUrl && !previewLoading && (
                <div className="w-full h-full flex flex-col items-center justify-center p-5 md:p-10 text-center gap-3 md:gap-4">
                  <Eye className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground/30" />
                  <p className="text-xs md:text-base font-black text-muted-foreground uppercase tracking-wide">Render IA</p>
                  <p className="text-[9px] md:text-xs font-bold text-muted-foreground/60 max-w-[180px]">Gere uma visualização fotorrealista</p>
                  <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                    {CREDIT_COSTS.IMAGE} créditos
                  </span>
                  <button
                    onClick={onGeneratePreview}
                    disabled={!canGenerate}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
                      canGenerate
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Gerar Render
                  </button>
                </div>
              )}

              {previewLoading && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-4">
                  <RefreshCw className="w-7 h-7 md:w-8 md:h-8 text-primary animate-spin" />
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary animate-pulse min-h-[1.5em]">
                    {loadingMessages[loadingMsgIndex]}
                  </p>
                  <div className="w-3/4">
                    <Progress value={fakeProgress} className="h-1" />
                  </div>
                </div>
              )}

              {result.previewUrl && !previewLoading && (
                <>
                  <img src={result.previewUrl} className="w-full h-full object-cover" alt="Render IA" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 md:gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl bg-white/90 text-foreground text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-white shadow-lg"
                    >
                      <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Baixar
                    </button>
                    <button
                      onClick={onGeneratePreview}
                      disabled={!canGenerate}
                      className={`flex items-center gap-1.5 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        canGenerate
                          ? 'bg-primary text-primary-foreground hover:opacity-90'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" /> Regenerar
                    </button>
                  </div>
                  <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-black/60 text-white text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 md:py-1 rounded-lg backdrop-blur-sm">
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
