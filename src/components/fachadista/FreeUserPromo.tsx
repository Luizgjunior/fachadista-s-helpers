import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Zap, Star, Clock, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface FreeUserPromoProps {
  open: boolean;
  onClose: () => void;
  creditsRemaining: number;
}

const FreeUserPromo = ({ open, onClose, creditsRemaining }: FreeUserPromoProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) { setStep(0); return; }
    const t = setTimeout(() => setStep(1), 600);
    return () => clearTimeout(t);
  }, [open]);

  const handleBuy = () => {
    onClose();
    navigate("/plans");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-[32px] bg-surface border border-border p-0 max-w-md sm:max-w-lg gap-0 overflow-hidden shadow-2xl shadow-primary/10">
        {/* Glow effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-glow/15 blur-[80px] rounded-full" />
        </div>

        <div className="relative p-6 md:p-8 space-y-5">
          {/* Animated icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-brand-glow rounded-3xl flex items-center justify-center shadow-xl shadow-primary/30"
          >
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          {/* Headline */}
          <div className="text-center space-y-2">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground leading-tight">
              Seu render ficou <span className="text-primary">incrível!</span>
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Imagine gerar dezenas deles por dia, sem limites.
            </p>
          </div>

          {/* Credits warning */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3"
              >
                <Clock className="w-5 h-5 text-destructive shrink-0" />
                <div>
                  <p className="text-xs font-black text-foreground uppercase tracking-wide">
                    {creditsRemaining <= 0
                      ? "Seus créditos acabaram"
                      : `Restam apenas ${creditsRemaining} créditos`}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Créditos gratuitos não são recarregados
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Benefits */}
          <div className="space-y-2.5">
            {[
              { icon: Zap, text: "Até 200 créditos/mês com recarga automática" },
              { icon: Star, text: "Renders em alta resolução com IA avançada" },
              { icon: TrendingUp, text: "Feche mais projetos com apresentações profissionais" },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-field-bg border border-border rounded-xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Price anchor */}
          <div className="text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">A partir de</p>
            <p className="text-3xl font-black text-foreground">
              R$ 9,90
              <span className="text-sm font-bold text-muted-foreground ml-1">/pacote</span>
            </p>
            <p className="text-[10px] text-primary font-black uppercase tracking-wider">
              ⚡ Menos de R$ 0,20 por render
            </p>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBuy}
            className="w-full bg-gradient-to-r from-primary to-brand-glow text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm shadow-xl shadow-primary/25 flex items-center justify-center gap-2"
          >
            Ver Planos e Pacotes <ArrowRight className="w-4 h-4" />
          </motion.button>

          <button
            onClick={onClose}
            className="w-full text-center text-[10px] font-bold text-muted-foreground/60 hover:text-muted-foreground uppercase tracking-widest py-1 transition-colors"
          >
            Continuar com plano gratuito
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FreeUserPromo;
