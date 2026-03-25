import { useState, useEffect, useRef, useCallback } from "react";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { CREDIT_COSTS } from "@/hooks/useCredits";

interface AIVideoGeneratorProps {
  imageUrl: string;
  fileName: string;
  userCredits: number;
  isAdmin: boolean;
  onCreditsConsumed: () => void;
}

const PRESETS = [
  { key: "ambiente_vivo", label: "Ambiente Vivo" },
  { key: "orbital", label: "Câmera Orbital" },
  { key: "zoom_dramatic", label: "Zoom Dramático" },
  { key: "flyover", label: "Flyover Aéreo" },
] as const;

const loadingMessages = [
  "Enviando imagem para processamento...",
  "Preparando animação com IA...",
  "Renderizando movimento realista...",
  "Adicionando dinâmica atmosférica...",
  "Processando reflexos e sombras...",
  "Finalizando vídeo cinematográfico...",
  "Quase pronto... aguarde mais um momento...",
];

const AIVideoGenerator = ({
  imageUrl,
  fileName,
  userCredits,
  isAdmin,
  onCreditsConsumed,
}: AIVideoGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canGenerate = isAdmin || userCredits >= CREDIT_COSTS.VIDEO;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Progress animation
  useEffect(() => {
    if (!generating) {
      setFakeProgress(0);
      setLoadingMsgIndex(0);
      return;
    }
    const progressInterval = setInterval(() => {
      setFakeProgress((p) => (p >= 95 ? 95 : p + Math.random() * 2));
    }, 3000);
    const msgInterval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % loadingMessages.length);
    }, 8000);
    return () => {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
    };
  }, [generating]);

  const pollStatus = useCallback((requestId: string, statusUrl?: string, responseUrl?: string) => {
    let attempts = 0;
    const maxAttempts = 60;

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setGenerating(false);
        toast.error("Timeout: o vídeo não ficou pronto a tempo.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("generate-video", {
          body: { action: "poll", requestId, statusUrl, responseUrl },
        });

        if (error) {
          console.error("Poll error:", error);
          return;
        }

        if (data?.status === "COMPLETED" && data?.videoUrl) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setVideoUrl(data.videoUrl);
          setGenerating(false);
          onCreditsConsumed();
          toast.success("Vídeo gerado com sucesso!");
        } else if (data?.status === "FAILED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setGenerating(false);
          toast.error("Falha na geração do vídeo.");
        }
      } catch (err) {
        console.error("Poll exception:", err);
      }
    }, 5000);
  }, [onCreditsConsumed]);

  const generate = async () => {
    if (!canGenerate) {
      toast.error(`Créditos insuficientes. Necessário: ${CREDIT_COSTS.VIDEO}`);
      return;
    }

    setGenerating(true);
    setVideoUrl(null);

    try {
      const preset = PRESETS[selectedPreset].key;

      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { action: "submit", imageUrl, preset },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.requestId) {
        // Start client-side polling
        pollStatus(data.requestId);
      } else {
        throw new Error("Sem requestId na resposta.");
      }
    } catch (err: any) {
      console.error("Video generation error:", err);
      setGenerating(false);
      toast.error(err.message || "Erro ao iniciar geração de vídeo.");
    }
  };

  const handleDownload = async () => {
    if (!videoUrl) return;
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}-video.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block">
        Animação IA
      </span>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p, i) => (
          <button
            key={p.key}
            onClick={() => setSelectedPreset(i)}
            disabled={generating}
            className={`px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-all ${
              selectedPreset === i
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Generate button or loading */}
      {!videoUrl && !generating && (
        <button
          onClick={generate}
          disabled={!canGenerate}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
            canGenerate
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Gerar Animação IA
          <span className="bg-primary-foreground/20 px-2 py-0.5 rounded-md text-[8px]">
            {CREDIT_COSTS.VIDEO} créditos
          </span>
        </button>
      )}

      {generating && (
        <div className="bg-secondary rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary animate-pulse">
              {loadingMessages[loadingMsgIndex]}
            </p>
          </div>
          <Progress value={fakeProgress} className="h-1" />
          <p className="text-[9px] text-muted-foreground">
            A geração pode levar até 3 minutos. Não feche esta página.
          </p>
        </div>
      )}

      {/* Video player */}
      {videoUrl && (
        <div className="space-y-2">
          <div className="rounded-xl md:rounded-2xl overflow-hidden border border-border shadow-lg">
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="w-full"
              style={{ maxHeight: 400 }}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Baixar Vídeo
            </button>
            <button
              onClick={() => setVideoUrl(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-muted-foreground text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Novo Vídeo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIVideoGenerator;
