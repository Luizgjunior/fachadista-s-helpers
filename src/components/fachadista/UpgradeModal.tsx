import { Zap, X, Check } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
    <DialogContent className="rounded-[40px] bg-surface border border-border p-0 max-w-lg sm:max-w-2xl gap-0 overflow-hidden">
      <div className="p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground">Créditos Esgotados</h2>
            <p className="text-xs md:text-sm font-bold text-muted-foreground mt-1">Você usou todos os seus créditos gratuitos</p>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* FREE */}
          <div className="bg-field-bg border border-border rounded-3xl p-5 md:p-6 space-y-4 relative">
            <span className="bg-secondary text-muted-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Atual</span>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Free</h3>
            <ul className="space-y-2 text-xs font-bold text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-muted-foreground/50" /> 10 créditos iniciais</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-muted-foreground/50" /> Histórico de 10 prompts</li>
            </ul>
          </div>

          {/* PRO */}
          <div className="bg-primary/5 border-2 border-primary/30 rounded-3xl p-5 md:p-6 space-y-4 relative shadow-lg shadow-primary/10">
            <span className="bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Recomendado</span>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Pro</h3>
            <ul className="space-y-2 text-xs font-bold text-muted-foreground">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> 200 créditos/mês</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Histórico ilimitado</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Preview visual IA</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-primary" /> Suporte prioritário</li>
            </ul>
            <p className="text-lg font-black text-foreground">R$ 49,90<span className="text-xs font-bold text-muted-foreground">/mês</span></p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" /> Fazer Upgrade Pro
          </button>
          <button
            onClick={onClose}
            className="sm:w-auto px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-muted-foreground bg-field-bg border border-border hover:text-foreground transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

export default UpgradeModal;
