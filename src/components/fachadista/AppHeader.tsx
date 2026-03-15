import {
  Sparkles, Sun, RotateCcw, RefreshCw, Zap, ArrowRightLeft, LogIn, X, Mail, Github, Chrome
} from "lucide-react";
import { type AppMode } from "@/types/fachadista";

interface AppHeaderProps {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  user: { email: string } | null;
  onLoginClick: () => void;
  onLogout: () => void;
  showResetGenerator: boolean;
  onResetGenerator: () => void;
  showResetComparator: boolean;
  onResetComparator: () => void;
}

const AppHeader = ({
  appMode, setAppMode, user, onLoginClick, onLogout,
  showResetGenerator, onResetGenerator, showResetComparator, onResetComparator
}: AppHeaderProps) => (
  <header className="sticky top-0 z-50 glass-panel border-b border-border px-4 py-3 md:px-10 md:py-6">
    {/* Mobile: two rows */}
    <div className="flex items-center justify-between md:hidden">
      {/* Row 1: Logo + actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="bg-gradient-to-br from-primary to-brand-glow p-2 rounded-xl shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-xl font-black tracking-tighter text-foreground uppercase italic">
          FCD<span className="text-primary">VP</span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {showResetGenerator && (
          <button onClick={onResetGenerator} className="p-2.5 rounded-xl bg-brand-light border border-brand-light text-primary">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        {showResetComparator && (
          <button onClick={onResetComparator} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        {user ? (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-surface border border-border px-3 py-2 rounded-xl"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-[8px] text-primary-foreground">
              {user.email[0].toUpperCase()}
            </div>
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="p-2.5 rounded-xl bg-field-bg border border-border text-foreground hover:text-primary"
          >
            <LogIn className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>

    {/* Mobile Row 2: Mode switcher */}
    <div className="flex mt-3 md:hidden">
      <div className="flex w-full bg-secondary p-1 rounded-xl border border-border">
        <button
          onClick={() => setAppMode('generator')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            appMode === 'generator'
              ? 'bg-surface text-primary shadow-sm border border-border'
              : 'text-muted-foreground'
          }`}
        >
          <Zap className="w-3 h-3" /> Generator
        </button>
        <button
          onClick={() => setAppMode('comparator')}
          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            appMode === 'comparator'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground'
          }`}
        >
          <ArrowRightLeft className="w-3 h-3" /> Compare
        </button>
      </div>
    </div>

    {/* Desktop: single row */}
    <div className="hidden md:flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary blur-lg opacity-20" />
          <div className="relative bg-gradient-to-br from-primary to-brand-glow p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tighter text-foreground uppercase italic">
          FCD <span className="text-primary">VIEW</span>PROMPT
        </h1>
      </div>

      <div className="flex bg-secondary p-1.5 rounded-2xl border border-border shadow-sm">
        <button
          onClick={() => setAppMode('generator')}
          className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            appMode === 'generator'
              ? 'bg-surface text-primary shadow-md border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Generator
        </button>
        <button
          onClick={() => setAppMode('comparator')}
          className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            appMode === 'comparator'
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" /> Compare
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 mr-2 border-r border-border pr-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Sun className="w-5 h-5" />
          </button>
          {user ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all bg-surface border border-border px-4 py-2.5 rounded-xl shadow-sm"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-[8px] text-primary-foreground">
                {user.email[0].toUpperCase()}
              </div>
              Sair
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-all bg-field-bg border border-border px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-brand-light"
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
          )}
        </div>

        {showResetGenerator && (
          <button
            onClick={onResetGenerator}
            className="text-[11px] font-black text-primary hover:text-primary/80 bg-brand-light border border-brand-light px-4 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Limpar Tudo
          </button>
        )}
        {showResetComparator && (
          <button
            onClick={onResetComparator}
            className="text-[11px] font-black text-muted-foreground hover:text-foreground uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Limpar
          </button>
        )}
      </div>
    </div>
  </header>
);

export default AppHeader;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailInput: string;
  setEmailInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginModal = ({ isOpen, onClose, emailInput, setEmailInput, onSubmit }: LoginModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface rounded-3xl md:rounded-[40px] shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-10 space-y-6 md:space-y-8">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-light rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
              <LogIn className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase italic">Bem-vindo</h2>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">Entre para salvar seus prompts na nuvem</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2 md:space-y-3">
              <label className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 ml-2">
                <Mail className="w-3 h-3 md:w-3.5 md:h-3.5" /> Endereço de E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-field-bg border border-field-border rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-foreground text-background py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all active:scale-95"
            >
              Entrar com E-mail
            </button>
          </form>

          <div className="relative py-3 md:py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-surface px-4 text-muted-foreground">Ou use uma conta</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <button className="flex items-center justify-center gap-2 md:gap-3 bg-field-bg border border-field-border py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all">
              <Chrome className="w-4 h-4 text-muted-foreground" /> Google
            </button>
            <button className="flex items-center justify-center gap-2 md:gap-3 bg-field-bg border border-field-border py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-hover transition-all">
              <Github className="w-4 h-4 text-muted-foreground" /> GitHub
            </button>
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    </div>
  );
};
