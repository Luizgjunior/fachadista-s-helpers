import { useState, useRef, useEffect, useCallback } from "react";
import LegalFooter from "@/components/shared/LegalFooter";
import { useNavigate } from "react-router-dom";
import { History, SlidersHorizontal } from "lucide-react";
import AppHeader from "@/components/fachadista/AppHeader";
import ImageUploadZone from "@/components/fachadista/ImageUploadZone";
import PromptResult from "@/components/fachadista/PromptResult";
import ControlPanel, { ControlPanelContent } from "@/components/fachadista/ControlPanel";
import ComparatorView from "@/components/fachadista/ComparatorView";
import UpgradeModal from "@/components/fachadista/UpgradeModal";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DEFAULT_PARAMS } from "@/constants/defaults";
import { generateArchitecturalPrompt, generateSamplePreview } from "@/services/geminiService";
import { type AppMode, type GeneratedPrompt, type PromptParameters } from "@/types/fachadista";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_COSTS } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type TabType = 'scene' | 'atmos' | 'entorno';

const mobileLoadingMessages = [
  "Analisando o projeto...",
  "Identificando materiais...",
  "Calculando iluminação ideal...",
  "Estruturando o prompt...",
  "Otimizando para Midjourney...",
];
const Index = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { credits, hasCreditsForPrompt, hasCreditsForImage, consumePromptCredits, consumeImageCredits } = useCredits({ profile, refreshProfile });

  const [appMode, setAppMode] = useState<AppMode>('generator');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [history, setHistory] = useState<GeneratedPrompt[]>([]);
  const [copied, setCopied] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scene');
  const [mobileMsgIndex, setMobileMsgIndex] = useState(0);

  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);

  const [params, setParams] = useState<PromptParameters>(DEFAULT_PARAMS);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File, target: 'main' | 'before' | 'after') => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const resultUrl = event.target.result as string;
        if (target === 'main') {
          setImages(prev => [...prev, resultUrl]);
          setResult(null);
        } else if (target === 'before') {
          setBeforeImage(resultUrl);
        } else if (target === 'after') {
          setAfterImage(resultUrl);
        }
      }
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processFile(blob, appMode === 'generator' ? 'main' : (beforeImage ? 'after' : 'before'));
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [appMode, beforeImage, processFile]);

  useEffect(() => {
    if (!user) return;
    const loadHistory = async () => {
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setHistory(
          data.map((p) => ({
            id: p.id,
            english: p.prompt_english,
            portuguese: p.prompt_portuguese ?? "",
            tags: p.tags ?? [],
            timestamp: new Date(p.created_at ?? "").getTime(),
            previewUrl: p.preview_url ?? undefined,
          }))
        );
      }
    };
    loadHistory();
  }, [user]);

  const savePromptToDb = async (item: GeneratedPrompt) => {
    if (!user) return;
    await supabase.from("prompts").insert({
      user_id: user.id,
      prompt_english: item.english,
      prompt_portuguese: item.portuguese,
      tags: item.tags,
      parameters: params as any,
      preview_url: item.previewUrl ?? null,
      credits_used: 3,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const resetGenerator = () => {
    setImages([]);
    setResult(null);
    setParams(DEFAULT_PARAMS);
    setActiveTab('scene');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'before' | 'after') => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file, target));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent, target: 'main' | 'before' | 'after') => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file, target));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;

    const ok = await consumePromptCredits();
    if (!ok) {
      setUpgradeOpen(true);
      return;
    }

    setLoading(true);
    setDrawerOpen(false);
    try {
      const data = await generateArchitecturalPrompt(images, params);
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 10));
      await savePromptToDb(data);
    } catch (err: any) {
      console.error('Erro completo:', err);
      toast.error(err?.message || 'Erro desconhecido. Veja o console.');
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!result || previewLoading) return;

    if (!profile?.is_admin) {
      const ok = await consumeImageCredits();
      if (!ok) {
        setUpgradeOpen(true);
        return;
      }
    }

    setPreviewLoading(true);
    try {
      const url = await generateSamplePreview(result.english, params.socialFormat);
      if (url) {
        const updatedResult = { ...result, previewUrl: url };
        setResult(updatedResult);
        setHistory(prev => prev.map(h => h.id === result.id ? updatedResult : h));

        if (user) {
          await supabase
            .from('prompts')
            .update({ preview_url: url })
            .eq('id', result.id);
        }
        toast.success("Render gerado com sucesso! 🎨");
      }
    } catch (err: any) {
      console.error('Erro ao gerar render:', err);
      toast.error(err?.message || 'Erro ao gerar imagem. Tente novamente.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const controlPanelProps = {
    activeTab,
    setActiveTab,
    params,
    setParams,
    images,
    loading,
    onGenerate: handleGenerate,
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-glow/5 blur-[150px] pointer-events-none" />

      <AppHeader
        appMode={appMode}
        setAppMode={setAppMode}
        profile={profile}
        onLogout={handleLogout}
        showResetGenerator={appMode === 'generator' && (images.length > 0 || result !== null)}
        onResetGenerator={resetGenerator}
        showResetComparator={appMode === 'comparator' && (!!beforeImage || !!afterImage)}
        onResetComparator={() => { setBeforeImage(null); setAfterImage(null); }}
        onUpgradeClick={() => setUpgradeOpen(true)}
      />

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {appMode === 'generator' && (
        <>
          <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4 md:px-8 lg:px-12 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 lg:gap-12 pb-24 lg:pb-10 animate-in fade-in duration-500">
            {/* History sidebar — desktop only */}
            <div className="hidden xl:flex lg:col-span-1 flex-col items-center gap-6 pt-2">
              <History className="w-5 h-5 text-muted-foreground/50" />
              <div className="flex flex-col gap-3">
                {history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setResult(item)}
                    className={`w-12 h-12 rounded-xl border transition-all overflow-hidden bg-surface shadow-sm ${
                      result?.id === item.id
                        ? 'border-primary scale-110 shadow-lg shadow-primary/10'
                        : 'border-border opacity-60 hover:opacity-100 hover:border-muted-foreground'
                    }`}
                  >
                    <div className="w-full h-full bg-field-bg flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      #{item.id.slice(0, 3)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main content area */}
            <div className="lg:col-span-11 xl:col-span-7 space-y-5 md:space-y-10">
              <ImageUploadZone
                images={images}
                setImages={setImages}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                loading={loading}
                blurReference={params.blurReference}
                onToggleBlur={() => setParams(prev => ({ ...prev, blurReference: !prev.blurReference }))}
                fileInputRef={fileInputRef}
                onDrop={(e) => handleDrop(e, 'main')}
              />

              {result && (
                <PromptResult
                  result={result}
                  copied={copied}
                  onCopy={copyToClipboard}
                  previewLoading={previewLoading}
                  onGeneratePreview={generatePreview}
                  userCredits={credits}
                  isAdmin={profile?.is_admin ?? false}
                />
              )}
            </div>

            {/* Desktop controls */}
            <ControlPanel {...controlPanelProps} />
          </main>

          {/* ═══ MOBILE BOTTOM BAR ═══ */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/90 backdrop-blur-xl border-t border-border safe-area-bottom">
            <div className="flex gap-2 p-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest bg-surface border border-border text-foreground flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Configurar
              </button>
              <button
                onClick={handleGenerate}
                disabled={images.length === 0 || loading}
                className={`flex-1 py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg ${
                  images.length === 0 || loading
                    ? 'bg-secondary text-muted-foreground/50'
                    : 'bg-primary text-primary-foreground shadow-primary/20'
                }`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <span>✦</span>
                )}
                {loading ? 'Gerando...' : 'Gerar'}
              </button>
            </div>
            <p className="text-[8px] font-bold text-muted-foreground/40 text-center pb-2 uppercase tracking-widest">
              {CREDIT_COSTS.PROMPT} créditos por geração
            </p>
          </div>

          {/* Mobile drawer */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="pb-1">
                <DrawerTitle className="text-sm font-black uppercase tracking-widest text-center">Configurações</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 overflow-y-auto">
                <ControlPanelContent {...controlPanelProps} />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}

      {appMode === 'comparator' && (
        <ComparatorView
          beforeImage={beforeImage}
          afterImage={afterImage}
          setBeforeImage={setBeforeImage}
          setAfterImage={setAfterImage}
          beforeInputRef={beforeInputRef}
          afterInputRef={afterInputRef}
          onFileUpload={(e, target) => handleFileUpload(e, target)}
        />
      )}

      <LegalFooter />

      <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" multiple onChange={(e) => handleFileUpload(e, 'main')} />
      <input type="file" ref={beforeInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'before')} />
      <input type="file" ref={afterInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'after')} />
    </div>
  );
};

export default Index;
