import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Sparkles, Chrome, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotMode, setForgotMode] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (forgotMode) {
        const { default: sb } = await import("@/integrations/supabase/client").then(m => ({ default: m.supabase }));
        const { error: resetError } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) {
          setError(resetError.message);
        } else {
          toast.success("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
          setForgotMode(false);
        }
        setLoading(false);
        return;
      }

      if (mode === "login") {
        const ok = await signInWithEmail(email, password);
        if (ok) {
          navigate("/");
        } else {
          setError("E-mail ou senha incorretos.");
        }
      } else {
        const ok = await signUpWithEmail(email, password, fullName);
        if (ok) {
          toast.success("Bem-vindo! Você ganhou 10 créditos para começar.");
          navigate("/");
        } else {
          setError("Erro ao criar conta. Tente novamente.");
        }
      }
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError("Erro ao entrar com Google.");
      }
    } catch {
      setError("Erro ao entrar com Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-glow/5 blur-[150px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-primary to-brand-glow p-2.5 rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic">
              NEW<span className="text-primary">RENDER</span>
            </h1>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Architectural Prompt Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl md:rounded-[40px] shadow-2xl border border-border overflow-hidden">
          {/* Mode toggle */}
          {!forgotMode && (
            <div className="p-4 md:p-6 pb-0">
              <div className="flex bg-secondary p-1 rounded-2xl border border-border">
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    mode === "login"
                      ? "bg-surface text-foreground shadow-md border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setMode("signup"); setError(""); }}
                  className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
                    mode === "signup"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground"
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-5">
            {forgotMode && (
              <div className="text-center space-y-2 mb-2">
                <h2 className="text-xl font-black tracking-tight text-foreground uppercase">Recuperar Senha</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Enviaremos um link para redefinir sua senha
                </p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && !forgotMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-field-bg border border-field-border rounded-2xl px-5 py-3.5 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-field-bg border border-field-border rounded-2xl px-5 py-3.5 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                />
              </div>

              {!forgotMode && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      className="w-full bg-field-bg border border-field-border rounded-2xl px-5 py-3.5 text-sm focus:border-field-focus focus:ring-4 focus:ring-primary/10 outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {mode === "login" && !forgotMode && (
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setError(""); }}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}

              {mode === "signup" && !forgotMode && (
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-field-border accent-primary"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                    Li e aceito os{" "}
                    <Link to="/terms" className="text-primary hover:underline" target="_blank">
                      Termos de Uso
                    </Link>{" "}
                    e a{" "}
                    <Link to="/privacy" className="text-primary hover:underline" target="_blank">
                      Política de Privacidade
                    </Link>
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || (mode === "signup" && !forgotMode && !acceptedTerms)}
                className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {forgotMode ? "Enviar Link" : mode === "login" ? "Entrar" : "Criar Conta"}
              </button>
            </form>

            {forgotMode && (
              <button
                onClick={() => { setForgotMode(false); setError(""); }}
                className="w-full text-center text-[10px] font-bold text-muted-foreground hover:text-foreground uppercase tracking-widest transition-colors"
              >
                ← Voltar ao login
              </button>
            )}

            {!forgotMode && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                    <span className="bg-surface px-4 text-muted-foreground">Ou</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 bg-field-bg border border-field-border py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-surface-hover transition-all active:scale-95 disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Chrome className="w-4 h-4" />
                  )}
                  Entrar com Google
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} FCD VIEWPROMPT
          </p>
          <div className="flex items-center justify-center gap-2">
            <Link to="/terms" className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors">
              Termos
            </Link>
            <span className="text-[9px] text-muted-foreground/30">•</span>
            <Link to="/privacy" className="text-[9px] font-bold text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-colors">
              Privacidade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
