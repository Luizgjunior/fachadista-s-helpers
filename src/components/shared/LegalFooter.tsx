import { Link } from "react-router-dom";

export default function LegalFooter() {
  return (
    <footer className="p-6 md:p-16 text-center border-t border-border bg-surface-muted/50 mt-auto">
      <p className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] md:tracking-[0.6em] mb-3 md:mb-4">
        FCD VIEWPROMPT
      </p>
      <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] md:tracking-[0.3em] mb-3">
        © {new Date().getFullYear()} ARCHVIZ INTELLIGENCE LAB
      </p>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Link
          to="/terms"
          className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors"
        >
          Termos de Uso
        </Link>
        <span className="text-[9px] text-muted-foreground/30">•</span>
        <Link
          to="/plans"
          className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors"
        >
          Planos
        </Link>
        <span className="text-[9px] text-muted-foreground/30">•</span>
        <Link
          to="/privacy"
          className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors"
        >
          Privacidade
        </Link>
        <span className="text-[9px] text-muted-foreground/30">•</span>
        <a
          href="mailto:suporte@fcdviewprompt.com.br"
          className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors"
        >
          Contato
        </a>
      </div>
    </footer>
  );
}
