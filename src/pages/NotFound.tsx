import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-glow/5 blur-[150px] pointer-events-none" />

      <div className="relative text-center space-y-6">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-primary to-brand-glow p-2.5 rounded-2xl shadow-lg shadow-primary/20">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground uppercase italic">
            NEW<span className="text-primary">RENDER</span>
          </h1>
        </div>

        <p className="text-[120px] md:text-[180px] font-black italic text-primary/10 leading-none select-none">
          404
        </p>

        <p className="text-lg md:text-xl font-black uppercase tracking-widest text-muted-foreground">
          Página não encontrada
        </p>

        <button
          onClick={() => navigate("/app")}
          className="mt-4 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );
};

export default NotFound;
