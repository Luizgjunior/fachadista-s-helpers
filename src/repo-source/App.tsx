
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Upload, Sun, Copy, Check, RefreshCw, Sparkles, 
  Palette, Focus, ChevronDown, Zap,
  Globe, Layout, Send, Users, Car, History, Eye, Trash2, Download, Lightbulb, Map, Wind, Camera, Footprints,
  ArrowRightLeft, ImageIcon, MoveHorizontal, X, Building, RotateCcw, Clipboard, LogIn, Mail, Github, Chrome
} from 'lucide-react';
import { 
  PromptParameters, GeneratedPrompt, LightingMode, WeatherMode, SidewalkType, ProjectType, CameraAngle 
} from './types';
import { generateArchitecturalPrompt, generateSamplePreview } from './geminiService';

type TabType = 'scene' | 'atmos' | 'entorno';
type AppMode = 'generator' | 'comparator';

const DEFAULT_PARAMS: PromptParameters = {
  projectType: 'Fachada Comercial',
  socialFormat: 'Instagram / TikTok (9:16)',
  visualStyle: 'Hiper-realista',
  environmentType: 'Urbano / Metrópole',
  cameraAngle: 'Manter ângulo da referência',
  lighting: 'Noturno',
  weather: 'Dia de Sol',
  peopleCount: 5,
  carCount: 2,
  environmentDetails: '',
  illuminatedSignage: false,
  sidewalkEnabled: true,
  sidewalkType: 'Concreto Clássico',
  blurReference: false
};

const App: React.FC = () => {
  // Global App State
  const [appMode, setAppMode] = useState<AppMode>('generator');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [emailInput, setEmailInput] = useState('');

  // Generator State
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState<GeneratedPrompt | null>(null);
  const [history, setHistory] = useState<GeneratedPrompt[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('scene');
  
  // Comparator State
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [params, setParams] = useState<PromptParameters>(DEFAULT_PARAMS);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  // Global Paste Handler
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
  }, [appMode, beforeImage]);

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

  const processFile = (file: File, target: 'main' | 'before' | 'after') => {
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

  const handleSliderMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const position = ((x - rect.left) / rect.width) * 100;
      setSliderPosition(Math.min(100, Math.max(0, position)));
    }
  }, []);

  const generatePreview = async () => {
    if (!result || previewLoading) return;
    setPreviewLoading(true);
    try {
      const url = await generateSamplePreview(result.english, params.socialFormat);
      const updatedResult = { ...result, previewUrl: url };
      setResult(updatedResult);
      const newHistory = history.map(h => h.id === result.id ? updatedResult : h);
      setHistory(newHistory);
      localStorage.setItem('fcd_history', JSON.stringify(newHistory));
    } catch (err) {
      console.error('Erro ao gerar preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SelectField = ({ icon: Icon, label, value, options, onChange, disabled }: any) => (
    <div className={`space-y-3 group/field ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2.5 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover/field:text-fuchsia-600 transition-colors">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="relative">
        <select 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm text-zinc-800 outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 appearance-none cursor-pointer pr-12 transition-all hover:bg-white"
        >
          {options.map((opt: string) => <option key={opt} value={opt} className="bg-white">{opt}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-400" />
      </div>
    </div>
  );

  const SliderField = ({ icon: Icon, label, value, min, max, onChange }: any) => (
    <div className="space-y-4 group/field">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5 text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] group-hover/field:text-fuchsia-600 transition-colors">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <span className="text-sm font-black text-fuchsia-600 tabular-nums">{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-zinc-200 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col relative overflow-hidden">
      
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[150px] pointer-events-none" />

      <header className="sticky top-0 z-50 glass-panel border-b border-zinc-200 px-6 md:px-10 py-6 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute inset-0 bg-fuchsia-500 blur-lg opacity-20" />
            <div className="relative bg-gradient-to-br from-fuchsia-500 to-purple-700 p-2.5 rounded-2xl shadow-lg shadow-fuchsia-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 uppercase italic hidden md:block">
            FCD <span className="text-fuchsia-600">VIEW</span>PROMPT
          </h1>
          <h1 className="text-2xl font-black tracking-tighter text-zinc-900 uppercase italic md:hidden">
            FCD<span className="text-fuchsia-600">VP</span>
          </h1>
        </div>
        
        <div className="flex bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200 shadow-sm">
           <button 
             onClick={() => setAppMode('generator')}
             className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${appMode === 'generator' ? 'bg-white text-fuchsia-600 shadow-md border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
           >
             <Zap className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Generator</span>
           </button>
           <button 
             onClick={() => setAppMode('comparator')}
             className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${appMode === 'comparator' ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20' : 'text-zinc-500 hover:text-zinc-800'}`}
           >
             <ArrowRightLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Compare</span>
           </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 mr-2 border-r border-zinc-200 pr-4">
            <button className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <Sun className="w-5 h-5" />
            </button>
            {user ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-all bg-white border border-zinc-200 px-4 py-2.5 rounded-xl shadow-sm"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-[8px] text-white">
                  {user.email[0].toUpperCase()}
                </div>
                Sair
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-700 hover:text-fuchsia-600 transition-all bg-zinc-50 border border-zinc-200 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:border-fuchsia-100"
              >
                <LogIn className="w-4 h-4" /> Entrar
              </button>
            )}
          </div>
          
          {appMode === 'generator' && (images.length > 0 || result || params !== DEFAULT_PARAMS) && (
            <button 
              onClick={resetGenerator} 
              className="text-[11px] font-black text-fuchsia-600 hover:text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 px-4 py-2.5 rounded-xl uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden md:inline">Limpar Tudo</span>
            </button>
          )}
          {appMode === 'comparator' && (beforeImage || afterImage) && (
            <button 
              onClick={() => { setBeforeImage(null); setAfterImage(null); }} 
              className="text-[11px] font-black text-zinc-500 hover:text-zinc-900 uppercase tracking-widest flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden md:inline">Limpar</span>
            </button>
          )}
        </div>
      </header>

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md" onClick={() => setIsLoginModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-fuchsia-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <LogIn className="w-8 h-8 text-fuchsia-600" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-zinc-900 uppercase italic">Bem-vindo</h2>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Entre para salvar seus prompts na nuvem</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <Mail className="w-3.5 h-3.5" /> Endereço de E-mail
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="seu@email.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-6 py-4 text-sm focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10 outline-none transition-all"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-zinc-800 transition-all active:scale-95"
                >
                  Entrar com E-mail
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-zinc-300">Ou use uma conta</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 bg-zinc-50 border border-zinc-200 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                  <Chrome className="w-4 h-4 text-zinc-400" /> Google
                </button>
                <button className="flex items-center justify-center gap-3 bg-zinc-50 border border-zinc-200 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
                  <Github className="w-4 h-4 text-zinc-400" /> GitHub
                </button>
              </div>
            </div>
            <button 
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-300 hover:text-zinc-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* GENERATOR MODE */}
      {appMode === 'generator' && (
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 animate-in fade-in duration-500">
          
          <div className="hidden xl:block lg:col-span-1 space-y-4">
            <div className="flex flex-col items-center gap-6">
              <History className="w-6 h-6 text-zinc-300" />
              <div className="flex flex-col gap-4">
                {history.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setResult(item)}
                    className={`w-14 h-14 rounded-2xl border transition-all overflow-hidden bg-white shadow-sm ${result?.id === item.id ? 'border-fuchsia-500 scale-110 shadow-xl shadow-fuchsia-500/10' : 'border-zinc-200 opacity-60 hover:opacity-100 hover:border-zinc-300'}`}
                  >
                     <div className="w-full h-full bg-zinc-50 flex items-center justify-center text-[11px] font-bold text-zinc-400">
                       #{item.id.slice(0, 3)}
                     </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-11 xl:col-span-7 space-y-12">
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, 'main')}
              className={`relative group rounded-[35px] md:rounded-[45px] overflow-hidden bg-white border shadow-xl shadow-zinc-200/50 transition-all duration-500 flex flex-col items-center justify-center ${
                images.length > 0 ? 'aspect-video' : 'min-h-[380px] lg:aspect-video' 
              } ${isDragging ? 'border-fuchsia-500 bg-fuchsia-50 scale-[0.99]' : 'border-zinc-200/60'}`}
            >
              {images.length > 0 ? (
                <div className="w-full h-full relative group p-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-full">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden shadow-lg group/img">
                      <img 
                        src={img} 
                        className={`w-full h-full object-cover transition-all duration-500 ${params.blurReference ? 'blur-md scale-110' : ''}`} 
                        alt={`Projeto ${idx + 1}`} 
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setImages(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-300 hover:bg-fuchsia-50 transition-all text-zinc-400 hover:text-fuchsia-600"
                  >
                    <Upload className="w-6 h-6 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Adicionar</span>
                  </div>
                  {loading && <div className="scan-line" />}
                </div>
              ) : (
                <div className="text-center p-8 md:p-12 w-full">
                  <div className="bg-zinc-50 p-8 md:p-10 rounded-full inline-block mb-8 border border-zinc-100 shadow-sm shadow-zinc-200">
                    <Upload className={`w-10 h-10 md:w-14 md:h-14 ${isDragging ? 'text-fuchsia-500' : 'text-zinc-300'}`} />
                  </div>
                  <h3 className="text-xl md:text-3xl font-black mb-3 uppercase tracking-tighter text-zinc-800">Arraste seu Render</h3>
                  <p className="text-zinc-500 text-xs md:text-sm uppercase tracking-widest mb-10 max-w-[240px] md:max-w-none mx-auto leading-relaxed">Snapshot direto do seu software 3D</p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full sm:w-auto bg-fuchsia-600 text-white px-10 py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest hover:scale-105 hover:bg-fuchsia-500 transition-all shadow-xl shadow-fuchsia-500/20 flex items-center justify-center gap-3"
                    >
                      <Upload className="w-4 h-4" /> Selecionar Arquivo
                    </button>
                    <div 
                      className="w-full sm:w-auto bg-white border-2 border-dashed border-zinc-200 text-zinc-500 px-10 py-5 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 group-hover:border-fuchsia-300 group-hover:text-fuchsia-600"
                    >
                      <Clipboard className="w-4 h-4" /> Colar Print (Ctrl+V)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="flex items-center justify-between bg-white/50 backdrop-blur-sm border border-zinc-200/60 p-4 rounded-3xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${params.blurReference ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-zinc-100 text-zinc-400'}`}>
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-zinc-800">Desfoque de Referência</p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-tight font-medium">Focar apenas na composição e volumes</p>
                  </div>
                </div>
                <button 
                  onClick={() => setParams(prev => ({ ...prev, blurReference: !prev.blurReference }))}
                  className={`relative w-12 h-6 rounded-full transition-all duration-300 ${params.blurReference ? 'bg-fuchsia-600' : 'bg-zinc-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${params.blurReference ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            )}

            {result && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="glass-panel rounded-[40px] p-8 md:p-12 space-y-10 shadow-2xl shadow-zinc-200/30">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-100 pb-10 gap-6">
                     <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                         <Zap className="w-8 h-8 text-fuchsia-600" />
                       </div>
                       <div>
                         <h2 className="text-2xl font-black uppercase italic tracking-tight text-zinc-900">AI Prompt Engine</h2>
                         <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Otimizado para Midjourney v6.1</p>
                       </div>
                     </div>
                     <button 
                      onClick={() => copyToClipboard(result.english)}
                      className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all w-full md:w-auto justify-center shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />} 
                      {copied ? 'Copiado' : 'Copiar Tudo'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div>
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-4">Prompt Estruturado</span>
                        <div className="bg-zinc-50 p-8 rounded-[32px] border border-zinc-100 text-base md:text-lg leading-relaxed text-zinc-800 min-h-[180px] whitespace-pre-wrap font-medium shadow-inner shadow-zinc-200/50">
                          {result.english}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-4">Tags de Laboratório</span>
                        <div className="flex flex-wrap gap-2.5">
                          {result.tags.map(t => <span key={t} className="bg-zinc-100 border border-zinc-200 px-4 py-2 rounded-xl text-xs font-bold text-zinc-600">#{t}</span>)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-4">Preview de Amostra (IA)</span>
                      <div className="relative aspect-square bg-zinc-100 rounded-[32px] border border-zinc-200 overflow-hidden group shadow-xl">
                        {result.previewUrl ? (
                          <img src={result.previewUrl} className="w-full h-full object-cover" alt="Preview IA" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center">
                            <Eye className="w-10 h-10 text-zinc-300 mb-6" />
                            <p className="text-xs md:text-sm font-bold text-zinc-400 uppercase leading-relaxed tracking-wide">Gere uma prévia visual para testar a fidelidade do prompt</p>
                          </div>
                        )}
                        
                        {previewLoading && (
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center">
                            <RefreshCw className="w-10 h-10 animate-spin text-fuchsia-600" />
                          </div>
                        )}

                        {!result.previewUrl && !previewLoading && (
                          <button 
                            onClick={generatePreview}
                            className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">Gerar Preview Visual</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-12 xl:col-span-4 sticky top-10 self-start">
            <div className="glass-panel rounded-[45px] p-8 md:p-10 space-y-10 shadow-2xl shadow-zinc-200/30 relative overflow-hidden">
              <div className="flex items-center gap-2 p-1.5 bg-zinc-100 border border-zinc-200 rounded-[22px] mb-4">
                <button 
                  onClick={() => setActiveTab('scene')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'scene' ? 'bg-white text-fuchsia-600 shadow-md border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  <Camera className="w-4 h-4" /> <span className="inline">Cena</span>
                </button>
                <button 
                  onClick={() => setActiveTab('atmos')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'atmos' ? 'bg-white text-fuchsia-600 shadow-md border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  <Wind className="w-4 h-4" /> <span className="inline">Ambiente</span>
                </button>
                <button 
                  onClick={() => setActiveTab('entorno')}
                  className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-[18px] text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'entorno' ? 'bg-white text-fuchsia-600 shadow-md border border-zinc-100' : 'text-zinc-500 hover:text-zinc-800'}`}
                >
                  <Map className="w-4 h-4" /> <span className="inline">Entorno</span>
                </button>
              </div>

              <div className="min-h-[420px] flex flex-col">
                {activeTab === 'scene' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <SelectField 
                      icon={Building} label="Tipo de projeto" value={params.projectType} 
                      options={[
                        'Fachada Comercial', 
                        'Residencial', 
                        'Industrial', 
                        'Planta Arquitetônica', 
                        'Detalhamento Técnico',
                        'Projeto de Interiores',
                        'Nenhuma das opção'
                      ]}
                      onChange={(v: ProjectType) => setParams({...params, projectType: v})}
                    />
                    <SelectField 
                      icon={Layout} label="Formato" value={params.socialFormat} 
                      options={[
                        'Instagram / TikTok (9:16)', 
                        'Instagram Portrait (4:5)', 
                        'Post / Feed (1:1)', 
                        'YouTube / TV (16:9)', 
                        'Fotografia (3:2)', 
                        'Cinematográfico (2.35:1)', 
                        'Vertical Clássico (2:3)',
                        'Nenhuma das opção'
                      ]}
                      onChange={(v: any) => setParams({...params, socialFormat: v})}
                    />
                    <SelectField 
                      icon={Palette} label="Tipo de render" value={params.visualStyle} 
                      options={['Hiper-realista', 'V-Ray Render', 'Unreal Engine 5', 'Sketch / Croqui', 'Maquete Eletrônica', 'Nenhuma das opção']}
                      onChange={(v: any) => setParams({...params, visualStyle: v})}
                    />
                    <SelectField 
                      icon={Focus} label="Ângulo de Câmera" value={params.cameraAngle} 
                      options={['Manter ângulo da referência', 'Nível do Olhar', 'Grande Angular', 'Close-up', 'Drone / Aéreo', 'Nenhuma das opção']}
                      onChange={(v: CameraAngle) => setParams({...params, cameraAngle: v})}
                    />
                  </div>
                )}

                {activeTab === 'atmos' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <SelectField 
                      icon={Sun} label="Luz Principal" value={params.lighting} 
                      options={['Manhã', 'Tarde', 'Fim de Tarde', 'Noturno', 'Nenhuma das opção']}
                      onChange={(v: any) => setParams({...params, lighting: v})}
                    />
                    <SelectField 
                      icon={Globe} label="Clima / Sky" value={params.weather} 
                      options={['Dia de Sol', 'Nublado', 'Chuvoso', 'Pós-Chuva', 'Nenhuma das opção']}
                      onChange={(v: any) => setParams({...params, weather: v})}
                    />
                    <div 
                      onClick={() => setParams({...params, illuminatedSignage: !params.illuminatedSignage})}
                      className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-200 rounded-[28px] group hover:border-fuchsia-200 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl transition-all ${params.illuminatedSignage ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/20' : 'bg-zinc-200 text-zinc-500'}`}>
                          <Lightbulb className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[12px] font-black text-zinc-800 uppercase tracking-widest block">Letreiro</span>
                          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">Efeito Backlit / Halo</span>
                        </div>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-all relative ${params.illuminatedSignage ? 'bg-fuchsia-600' : 'bg-zinc-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${params.illuminatedSignage ? 'left-7' : 'left-1'}`} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'entorno' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <SelectField 
                      icon={Map} label="Entorno" value={params.environmentType} 
                      options={[
                        'Urbano / Metrópole', 
                        'Residencial / Subúrbio', 
                        'Vegetação / Floresta', 
                        'Litoral / Marítimo', 
                        'Montanhoso / Alpino', 
                        'Industrial / Galpão', 
                        'Centro Histórico', 
                        'Desértico / Árido',
                        'Nenhuma das opção'
                      ]}
                      onChange={(v: any) => setParams({...params, environmentType: v})}
                    />

                    <div className="space-y-5 pt-2">
                      <div 
                        onClick={() => setParams({...params, sidewalkEnabled: !params.sidewalkEnabled})}
                        className="flex items-center justify-between p-5 bg-zinc-50 border border-zinc-200 rounded-[28px] group hover:border-fuchsia-200 transition-all cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          <Footprints className={`w-6 h-6 ${params.sidewalkEnabled ? 'text-fuchsia-600' : 'text-zinc-300'}`} />
                          <div>
                            <span className="text-[12px] font-black text-zinc-800 uppercase tracking-widest block">Calçada / Passeio</span>
                            <span className="text-[11px] font-medium text-zinc-400 uppercase">Presença no entorno</span>
                          </div>
                        </div>
                        <div className={`w-12 h-6 rounded-full transition-all relative ${params.sidewalkEnabled ? 'bg-fuchsia-600' : 'bg-zinc-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${params.sidewalkEnabled ? 'left-7' : 'left-1'}`} />
                        </div>
                      </div>

                      <SelectField 
                        icon={Palette} 
                        label="Tipo de Calçada" 
                        value={params.sidewalkType} 
                        disabled={!params.sidewalkEnabled}
                        options={[
                          'Concreto Clássico', 
                          'Pedra Portuguesa', 
                          'Bloco Intertravado', 
                          'Pedra São Tomé', 
                          'Gramado com Pisantes', 
                          'Cimento Queimado',
                          'Nenhuma das opção'
                        ]}
                        onChange={(v: SidewalkType) => setParams({...params, sidewalkType: v})}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-8 bg-zinc-50 p-6 md:p-8 rounded-[32px] border border-zinc-200 shadow-inner shadow-zinc-200/50">
                      <SliderField 
                        icon={Users} label="Pessoas" value={params.peopleCount} min={0} max={25}
                        onChange={(v: number) => setParams({...params, peopleCount: v})}
                      />
                      <SliderField 
                        icon={Car} label="Veículos" value={params.carCount} min={0} max={20}
                        onChange={(v: number) => setParams({...params, carCount: v})}
                      />
                    </div>
                    <div className="space-y-4">
                      <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-4 h-4 text-fuchsia-600" /> Materiais & Entorno Detalhado
                      </span>
                      <textarea 
                        value={params.environmentDetails}
                        onChange={(e) => setParams({...params, environmentDetails: e.target.value})}
                        placeholder="Ex: Concreto ripado, vegetação tropical, asfalto molhado, mobiliário urbano minimalista..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-3xl p-6 text-sm text-zinc-800 min-h-[140px] resize-none focus:border-fuchsia-500/50 outline-none transition-all leading-relaxed placeholder:text-zinc-300 shadow-inner shadow-zinc-200/50"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={async () => {
                  if (images.length === 0) return;
                  setLoading(true);
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
                }}
                disabled={images.length === 0 || loading}
                className={`w-full py-7 rounded-[32px] font-black text-base md:text-lg uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-5 mt-10 ${
                  images.length === 0 ? 'bg-zinc-100 text-zinc-300 opacity-50' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-fuchsia-500/30'
                }`}
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-white" />}
                {loading ? 'PROCESSANDO...' : 'GERAR MASTER PROMPT'}
              </button>
            </div>
          </div>
        </main>
      )}

      {/* COMPARATOR MODE */}
      {appMode === 'comparator' && (
        <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 md:p-10 flex flex-col gap-10 animate-in fade-in duration-500">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-zinc-900">Comparador de Render</h2>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Visualize a evolução do seu projeto em tempo real</p>
          </div>

          {!beforeImage || !afterImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto w-full">
              {/* Card Upload Antes */}
              <div 
                onClick={() => beforeInputRef.current?.click()}
                className="bg-white border border-zinc-200 rounded-[45px] p-12 flex flex-col items-center justify-center aspect-square md:aspect-[4/3] cursor-pointer hover:bg-zinc-50 hover:border-fuchsia-200 transition-all group relative overflow-hidden shadow-xl shadow-zinc-200/30"
              >
                {beforeImage ? (
                  <>
                    <img src={beforeImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Antes" />
                    <div className="z-10 bg-white/90 px-6 py-3 rounded-2xl backdrop-blur-md border border-zinc-200 shadow-xl">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="z-10 mt-6 font-black uppercase tracking-[0.2em] text-zinc-900 text-sm">Sketch / Base OK</p>
                  </>
                ) : (
                  <>
                    <div className="bg-zinc-50 p-8 rounded-full mb-8 group-hover:scale-110 transition-transform shadow-md border border-zinc-100">
                      <ImageIcon className="w-10 h-10 text-zinc-300 group-hover:text-fuchsia-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-zinc-800 mb-3">Snapshot Antes</h3>
                    <p className="text-xs uppercase tracking-widest text-zinc-400 text-center leading-relaxed mb-4">Arraste seu rascunho ou snapshot inicial</p>
                    <div className="bg-zinc-100/80 px-4 py-2 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200/50">
                      Ou Pressione Ctrl+V
                    </div>
                  </>
                )}
              </div>

              {/* Card Upload Depois */}
              <div 
                onClick={() => afterInputRef.current?.click()}
                className="bg-white border border-zinc-200 rounded-[45px] p-12 flex flex-col items-center justify-center aspect-square md:aspect-[4/3] cursor-pointer hover:bg-zinc-50 hover:border-fuchsia-200 transition-all group relative overflow-hidden shadow-xl shadow-zinc-200/30"
              >
                {afterImage ? (
                   <>
                    <img src={afterImage} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" alt="Depois" />
                    <div className="z-10 bg-white/90 px-6 py-3 rounded-2xl backdrop-blur-md border border-zinc-200 shadow-xl">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="z-10 mt-6 font-black uppercase tracking-[0.2em] text-zinc-900 text-sm">Render Final OK</p>
                  </>
                ) : (
                  <>
                    <div className="bg-zinc-50 p-8 rounded-full mb-8 group-hover:scale-110 transition-transform shadow-md border border-zinc-100">
                      <Sparkles className="w-10 h-10 text-zinc-300 group-hover:text-fuchsia-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-zinc-800 mb-3">Render Depois</h3>
                    <p className="text-xs uppercase tracking-widest text-zinc-400 text-center leading-relaxed mb-4">Arraste sua visualização final fotorrealista</p>
                    <div className="bg-zinc-100/80 px-4 py-2 rounded-xl text-[10px] font-black text-zinc-400 uppercase tracking-widest border border-zinc-200/50">
                      Ou Pressione Ctrl+V
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            // Slider Component
            <div className="w-full max-w-6xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center px-4 md:px-8">
                <div className="bg-white px-6 py-3 rounded-2xl border border-zinc-200 shadow-sm">
                  <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-zinc-900">PROJETO BASE</span>
                </div>
                <div className="bg-fuchsia-600 px-6 py-3 rounded-2xl border border-fuchsia-500 shadow-sm">
                  <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white">RESULTADO FINAL</span>
                </div>
              </div>

              <div 
                ref={containerRef}
                className="relative w-full aspect-video rounded-[40px] md:rounded-[55px] overflow-hidden cursor-ew-resize border border-zinc-200 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.15)] select-none bg-zinc-100"
                onMouseMove={handleSliderMove}
                onTouchMove={handleSliderMove}
                onClick={handleSliderMove}
              >
                {/* Imagem do 'Depois' (Fundo completo) */}
                <img 
                  src={afterImage} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt="Depois" 
                  draggable={false}
                />
                
                {/* Imagem do 'Antes' (Recortada) */}
                <div 
                  className="absolute inset-0 overflow-hidden border-r-4 border-fuchsia-500 shadow-[15px_0_40px_rgba(217,70,239,0.2)]"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={beforeImage} 
                    className="absolute inset-0 w-full h-full object-cover max-w-none" 
                    style={{ width: containerRef.current?.offsetWidth }}
                    alt="Antes" 
                    draggable={false}
                  />
                </div>

                {/* Handle / Puxador */}
                <div 
                  className="absolute top-0 bottom-0 w-12 -ml-6 flex items-center justify-center pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-14 h-14 bg-white rounded-full shadow-2xl flex items-center justify-center border-[4px] border-fuchsia-500 scale-110 transition-transform group-hover:scale-125">
                    <ArrowRightLeft className="w-6 h-6 text-fuchsia-600" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center flex-col items-center gap-4">
                 <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Deslize lateralmente para comparar detalhes</p>
                 <button 
                  onClick={() => { setBeforeImage(null); setAfterImage(null); }}
                  className="bg-white hover:bg-zinc-50 border border-zinc-200 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-sm"
                 >
                   Fazer novo Comparativo
                 </button>
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="p-16 text-center border-t border-zinc-100 bg-zinc-50/50 mt-auto">
        <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.6em] mb-4">FCD VIEWPROMPT</p>
        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.3em]">© {new Date().getFullYear()} ARCHVIZ INTELLIGENCE LAB • HIGH END RENDERING TOOLS</p>
      </footer>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        multiple
        onChange={(e) => handleFileUpload(e, 'main')} 
      />
      <input 
        type="file" 
        ref={beforeInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={(e) => handleFileUpload(e, 'before')} 
      />
      <input 
        type="file" 
        ref={afterInputRef} 
        className="hidden" 
        accept="image/png, image/jpeg, image/webp" 
        onChange={(e) => handleFileUpload(e, 'after')} 
      />
    </div>
  );
};

export default App;
