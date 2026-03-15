import { Copy, Check, Zap, Eye, RefreshCw } from "lucide-react";
import { GeneratedPrompt } from "@/types/fachadista";

interface PromptResultProps {
  result: GeneratedPrompt;
  copied: boolean;
  onCopy: (text: string) => void;
  previewLoading: boolean;
  onGeneratePreview: () => void;
}

const PromptResult = ({ result, copied, onCopy, previewLoading, onGeneratePreview }: PromptResultProps) => (
  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="glass-panel rounded-[40px] p-8 md:p-12 space-y-10 shadow-2xl shadow-muted/30">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border pb-10 gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-foreground">AI Prompt Engine</h2>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Otimizado para Midjourney v6.1</p>
          </div>
        </div>
        <button
          onClick={() => onCopy(result.english)}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all w-full md:w-auto justify-center shadow-lg ${
            copied ? 'bg-green-600 text-primary-foreground' : 'bg-foreground text-background hover:opacity-90'
          }`}
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copiado' : 'Copiar Tudo'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div>
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-4">Prompt Estruturado</span>
            <div className="bg-field-bg p-8 rounded-[32px] border border-border text-base md:text-lg leading-relaxed text-foreground min-h-[180px] whitespace-pre-wrap font-medium shadow-inner shadow-muted/50">
              {result.english}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-4">Tags de Laboratório</span>
            <div className="flex flex-wrap gap-2.5">
              {result.tags.map(t => (
                <span key={t} className="bg-secondary border border-border px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground">#{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block mb-4">Preview de Amostra (IA)</span>
          <div className="relative aspect-square bg-secondary rounded-[32px] border border-border overflow-hidden group shadow-xl">
            {result.previewUrl ? (
              <img src={result.previewUrl} className="w-full h-full object-cover" alt="Preview IA" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                <Eye className="w-10 h-10 text-muted-foreground/50 mb-6" />
                <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase leading-relaxed tracking-wide">Gere uma prévia visual para testar a fidelidade do prompt</p>
              </div>
            )}

            {previewLoading && (
              <div className="absolute inset-0 bg-surface/70 backdrop-blur-md flex items-center justify-center">
                <RefreshCw className="w-10 h-10 animate-spin text-primary" />
              </div>
            )}

            {!result.previewUrl && !previewLoading && (
              <button
                onClick={onGeneratePreview}
                className="absolute inset-0 flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">Gerar Preview Visual</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default PromptResult;
