import { useState, useRef, useEffect, useCallback } from "react";
import { History, SlidersHorizontal } from "lucide-react";
import AppHeader, { LoginModal } from "@/components/fachadista/AppHeader";
import ImageUploadZone from "@/components/fachadista/ImageUploadZone";
import PromptResult from "@/components/fachadista/PromptResult";
import ControlPanel, { ControlPanelContent } from "@/components/fachadista/ControlPanel";
import ComparatorView from "@/components/fachadista/ComparatorView";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DEFAULT_PARAMS } from "@/constants/defaults";
import { generateArchitecturalPrompt, generateSamplePreview } from "@/services/geminiService";
import { type AppMode, type GeneratedPrompt, type PromptParameters } from "@/types/fachadista";

type TabType = 'scene' | 'atmos' | 'entorno';

const Index = () => {
  const [appMode, setAppMode] = useState<AppMode>('generator');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [history, setHistory] = useState<GeneratedPrompt[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scene');

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
    const saved = localStorage.getItem('fcd_history');
    if (saved) setHistory(JSON.parse(saved));
    const savedUser = localStorage.getItem('fcd_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const saveToHistory = (item: GeneratedPrompt) => {
    const newHistory = [item, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem('fcd_history', JSON.stringify(newHistory));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    const userData = { email: emailInput };
    setUser(userData);
    localStorage.setItem('fcd_user', JSON.stringify(userData));
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fcd_user');
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

  const generatePreview = async () => {
    if (!result || previewLoading) return;
    setPreviewLoading(true);
    try {
      const url = await generateSamplePreview(result.english, params.socialFormat);
      if (url) {
        const updatedResult = { ...result, previewUrl: url };
        setResult(updatedResult);
        const newHistory = history.map(h => h.id === result.id ? updatedResult : h);
        setHistory(newHistory);
        localStorage.setItem('fcd_history', JSON.stringify(newHistory));
      }
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setDrawerOpen(false);
    try {
      const data = await generateArchitecturalPrompt(images, params);
      setResult(data);
      saveToHistory(data);
    } catch (err) {
      console.error('Erro ao gerar prompt:', err);
      alert('Erro ao processar imagem. Verifique sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
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
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-glow/5 blur-[150px] pointer-events-none" />

      <AppHeader
        appMode={appMode}
        setAppMode={setAppMode}
        user={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        showResetGenerator={appMode === 'generator' && (images.length > 0 || result !== null)}
        onResetGenerator={resetGenerator}
        showResetComparator={appMode === 'comparator' && (!!beforeImage || !!afterImage)}
        onResetComparator={() => { setBeforeImage(null); setAfterImage(null); }}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        onSubmit={handleLogin}
      />

      {appMode === 'generator' && (
        <>
          <main className="flex-1 max-w-[1600px] mx-auto w-full p-4 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 pb-24 lg:pb-10 animate-in fade-in duration-500">
            {/* History sidebar — desktop only */}
            <div className="hidden xl:block lg:col-span-1 space-y-4">
              <div className="flex flex-col items-center gap-6">
                <History className="w-6 h-6 text-muted-foreground/50" />
                <div className="flex flex-col gap-4">
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setResult(item)}
                      className={`w-14 h-14 rounded-2xl border transition-all overflow-hidden bg-surface shadow-sm ${
                        result?.id === item.id
                          ? 'border-primary scale-110 shadow-xl shadow-primary/10'
                          : 'border-border opacity-60 hover:opacity-100 hover:border-muted-foreground'
                      }`}
                    >
                      <div className="w-full h-full bg-field-bg flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                        #{item.id.slice(0, 3)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="lg:col-span-11 xl:col-span-7 space-y-8 md:space-y-12">
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
                />
              )}
            </div>

            {/* Desktop controls */}
            <ControlPanel {...controlPanelProps} />
          </main>

          {/* Mobile fixed bottom bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3 bg-background/80 backdrop-blur-xl border-t border-border safe-area-bottom">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Configurações
            </button>
          </div>

          {/* Mobile drawer */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerContent className="max-h-[85vh]">
              <DrawerHeader className="pb-2">
                <DrawerTitle className="text-base font-black uppercase tracking-widest text-center">Configurações</DrawerTitle>
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

      <footer className="p-6 md:p-16 text-center border-t border-border bg-surface-muted/50 mt-auto">
        <p className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] md:tracking-[0.6em] mb-3 md:mb-4">FCD VIEWPROMPT</p>
        <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] md:tracking-[0.3em]">© {new Date().getFullYear()} ARCHVIZ INTELLIGENCE LAB • HIGH END RENDERING TOOLS</p>
      </footer>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" multiple onChange={(e) => handleFileUpload(e, 'main')} />
      <input type="file" ref={beforeInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'before')} />
      <input type="file" ref={afterInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleFileUpload(e, 'after')} />
    </div>
  );
};

export default Index;
