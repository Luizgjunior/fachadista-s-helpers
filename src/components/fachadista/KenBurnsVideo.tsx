import { useState, useRef, useCallback } from "react";
import { Video, Download, RefreshCw } from "lucide-react";

interface KenBurnsVideoProps {
  imageUrl: string;
  fileName: string;
}

type KenBurnsPreset = {
  label: string;
  startCrop: { x: number; y: number; w: number; h: number };
  endCrop: { x: number; y: number; w: number; h: number };
};

const PRESETS: KenBurnsPreset[] = [
  {
    label: "Zoom In",
    startCrop: { x: 0, y: 0, w: 1, h: 1 },
    endCrop: { x: 0.15, y: 0.1, w: 0.7, h: 0.7 },
  },
  {
    label: "Zoom Out",
    startCrop: { x: 0.15, y: 0.1, w: 0.7, h: 0.7 },
    endCrop: { x: 0, y: 0, w: 1, h: 1 },
  },
  {
    label: "Pan Direita",
    startCrop: { x: 0, y: 0.05, w: 0.75, h: 0.9 },
    endCrop: { x: 0.25, y: 0.05, w: 0.75, h: 0.9 },
  },
  {
    label: "Pan Esquerda",
    startCrop: { x: 0.25, y: 0.05, w: 0.75, h: 0.9 },
    endCrop: { x: 0, y: 0.05, w: 0.75, h: 0.9 },
  },
];

const KenBurnsVideo = ({ imageUrl, fileName }: KenBurnsVideoProps) => {
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generate = useCallback(async () => {
    setGenerating(true);
    setVideoUrl(null);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const canvas = canvasRef.current!;
      const W = 1280;
      const H = 720;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      const fps = 30;
      const durationSec = 6;
      const totalFrames = fps * durationSec;

      const preset = PRESETS[selectedPreset];
      const { startCrop, endCrop } = preset;

      const stream = canvas.captureStream(fps);
      const chunks: Blob[] = [];

      // Try VP9, fall back to VP8
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const done = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
      });

      recorder.start();

      for (let frame = 0; frame < totalFrames; frame++) {
        const t = frame / (totalFrames - 1);
        // Ease in-out cubic
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const sx = (startCrop.x + (endCrop.x - startCrop.x) * ease) * img.width;
        const sy = (startCrop.y + (endCrop.y - startCrop.y) * ease) * img.height;
        const sw = (startCrop.w + (endCrop.w - startCrop.w) * ease) * img.width;
        const sh = (startCrop.h + (endCrop.h - startCrop.h) * ease) * img.height;

        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

        // Wait for next frame timing
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
      const blob = await done;
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (err) {
      console.error("Ken Burns generation error:", err);
    } finally {
      setGenerating(false);
    }
  }, [imageUrl, selectedPreset]);

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = `${fileName}-video.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-3">
      <span className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] block">
        Vídeo Cinematográfico
      </span>

      {/* Preset selector */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setSelectedPreset(i)}
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

      {/* Generate button */}
      {!videoUrl && (
        <button
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Gerando Vídeo...
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Gerar Vídeo (6s)
            </>
          )}
        </button>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

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
              onClick={() => { setVideoUrl(null); }}
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

export default KenBurnsVideo;
