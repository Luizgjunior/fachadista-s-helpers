import {
  Sparkles, RotateCcw, RefreshCw, Zap, ArrowRightLeft, LogOut, Shield, ShoppingCart, Menu, Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type AppMode } from "@/types/fachadista";
import type { Profile } from "@/hooks/useAuth";

interface AppHeaderProps {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  profile: Profile | null;
  onLogout: () => void;
  showResetGenerator: boolean;
  onResetGenerator: () => void;
  showResetComparator: boolean;
  onResetComparator: () => void;
  onUpgradeClick?: () => void;
}

const CreditBadge = ({ credits, planId }: { credits: number; planId: string | null }) => {
  const max = planId === 'pro' ? 200 : 10;
  const pct = Math.min(credits / max, 1);
  const barColor = pct > 0.5 ? 'bg-green-500' : pct >= 0.2 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2 bg-brand-light px-3 py-1.5 rounded-xl">
      <span className="text-[10px] md:text-[11px] font-black text-primary tabular-nums">
        ⚡ {credits}
      </span>
      <div className="w-8 md:w-12 h-1 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
};

const AppHeader = ({
  appMode, setAppMode, profile, onLogout,
  showResetGenerator, onResetGenerator, showResetComparator, onResetComparator,
  onUpgradeClick
}: AppHeaderProps) => {
  const navigate = useNavigate();

  const isRegularUser = profile && !profile.is_admin;
  const showBuyButton = isRegularUser && profile.credits <= 5 && profile.credits > 0;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-border">
      {/* ═══ MOBILE HEADER ═══ */}
      <div className="flex flex-col md:hidden">
        {/* Row 1: Logo + actions */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-primary to-brand-glow p-1.5 rounded-lg shadow-md shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-black tracking-tighter text-foreground uppercase italic">
              NEW<span className="text-primary">R</span>
            </h1>
          </div>

          <div className="flex items-center gap-1.5">
            {profile && (
              <>
                {profile.is_admin ? (
                  <span className="bg-primary/10 text-primary border border-primary/20 text-[8px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg">
                    Admin
                  </span>
                ) : profile.credits === 0 ? (
                  <button
                    onClick={() => navigate('/plans')}
                    className="flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg shadow-sm"
                  >
                    <ShoppingCart className="w-3 h-3" /> Comprar
                  </button>
                ) : (
                  <CreditBadge credits={profile.credits} planId={profile.plan_id} />
                )}

                {showBuyButton && (
                  <button
                    onClick={() => navigate('/plans')}
                    className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-1.5 rounded-lg"
                  >
                    ⚡
                  </button>
                )}
              </>
            )}

            {showResetGenerator && (
              <button onClick={onResetGenerator} className="p-2 rounded-lg bg-brand-light text-primary">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {showResetComparator && (
              <button onClick={onResetComparator} className="p-2 rounded-lg text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {profile?.is_admin && (
              <button onClick={() => navigate('/admin')} className="p-2 rounded-lg text-muted-foreground">
                <Shield className="w-3.5 h-3.5" />
              </button>
            )}

            {profile && (
              <button
                onClick={onLogout}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-[9px] font-black text-primary-foreground"
              >
                {profile.email[0].toUpperCase()}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Mode switcher — pill style */}
        <div className="px-4 pb-3">
          <div className="flex bg-secondary p-0.5 rounded-xl border border-border">
            <button
              onClick={() => setAppMode('generator')}
              className={`flex-1 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                appMode === 'generator'
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-muted-foreground'
              }`}
            >
              <Zap className="w-3 h-3" /> Generator
            </button>
            <button
              onClick={() => setAppMode('comparator')}
              className={`flex-1 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                appMode === 'comparator'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground'
              }`}
            >
              <ArrowRightLeft className="w-3 h-3" /> Compare
            </button>
            <button
              onClick={() => setAppMode('montagem')}
              className={`flex-1 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                appMode === 'montagem'
                  ? 'bg-brand-glow text-primary-foreground shadow-md shadow-brand-glow/20'
                  : 'text-muted-foreground'
              }`}
            >
              <Layers className="w-3 h-3" /> Montagem
            </button>
          </div>
        </div>
      </div>

      {/* ═══ DESKTOP HEADER ═══ */}
      <div className="hidden md:flex items-center justify-between px-8 lg:px-12 py-5">
        {/* Left: Logo */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-gradient-to-br from-primary to-brand-glow p-2.5 rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tighter text-foreground uppercase italic">
            NEW<span className="text-primary">RENDER</span>
          </h1>
        </div>

        {/* Center: Mode switcher */}
        <div className="flex bg-secondary p-1.5 rounded-2xl border border-border shadow-sm">
          <button
            onClick={() => setAppMode('generator')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              appMode === 'generator'
                ? 'bg-surface text-primary shadow-md border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Generator
          </button>
          <button
            onClick={() => setAppMode('comparator')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              appMode === 'comparator'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Compare
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {profile && (
            <>
              {profile.is_admin ? (
                <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl">
                  Admin Global
                </span>
              ) : profile.credits === 0 ? (
                <button
                  onClick={() => navigate('/plans')}
                  className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-primary-foreground bg-primary px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                >
                  <ShoppingCart className="w-4 h-4" /> Comprar Créditos
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <CreditBadge credits={profile.credits} planId={profile.plan_id} />
                  {showBuyButton && (
                    <button
                      onClick={() => navigate('/plans')}
                      className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-all"
                    >
                      ⚡ Comprar
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {profile?.is_admin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all bg-field-bg border border-border px-4 py-2.5 rounded-xl"
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          )}

          {showResetGenerator && (
            <button
              onClick={onResetGenerator}
              className="text-[11px] font-black text-primary bg-brand-light border border-brand-light px-4 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Limpar
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

          {profile && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all bg-surface border border-border px-4 py-2.5 rounded-xl"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-brand-glow flex items-center justify-center text-[8px] text-primary-foreground">
                {profile.email[0].toUpperCase()}
              </div>
              Sair
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
