import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Image, Layers, Eye, MessageSquare, Star, Check, Clock, Shield, TrendingUp, Play, ChevronDown, Paintbrush, Video, Target, Award, Rocket, Heart } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from "framer-motion";
import LegalFooter from "@/components/shared/LegalFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import beforeBuilding from "@/assets/landing/before-building.jpg";
import afterBuilding from "@/assets/landing/after-building.jpg";
import beforeKitchen from "@/assets/landing/before-kitchen.jpg";
import afterKitchen from "@/assets/landing/after-kitchen.jpg";
import beforeFacade from "@/assets/landing/before-facade.jpg";
import afterFacade from "@/assets/landing/after-facade.jpg";

/* ─── Animation variants ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

/* ─── Animated Counter ─── */
const CountUp = ({ target, suffix = "", duration = 1.5 }: { target: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const steps = 40;
    const increment = target / steps;
    const stepTime = (duration * 1000) / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.round(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ─── Hero Before/After with auto-animation ─── */
const HeroComparator = ({ before, after }: { before: string; after: string }) => {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const animRef = useRef<number>();

  useEffect(() => {
    if (!isAutoPlaying) return;
    let t = 0;
    const animate = () => {
      t += 0.012;
      const pos = 50 + Math.sin(t * Math.PI) * 45;
      setPosition(pos);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isAutoPlaying]);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  const startDrag = () => { setDragging(true); setIsAutoPlaying(false); };

  return (
    <div
      className="relative w-full aspect-[16/10] md:aspect-video rounded-3xl md:rounded-[40px] overflow-hidden cursor-col-resize select-none border-2 border-border shadow-2xl shadow-primary/10 group"
      onMouseDown={startDrag}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onMouseMove={(e) => dragging && handleMove(e.clientX, e.currentTarget.getBoundingClientRect())}
      onTouchStart={startDrag}
      onTouchEnd={() => setDragging(false)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
    >
      <img src={after} alt="Render final" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={before} alt="Projeto original" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${10000 / Math.max(position, 1)}%` }} draggable={false} />
      </div>
      <div className="absolute top-0 bottom-0 z-10" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
        <div className="w-[3px] h-full bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)]" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 bg-surface rounded-full flex items-center justify-center shadow-2xl border-[3px] border-primary">
          <ArrowRight className="w-4 h-4 text-primary rotate-180" />
          <ArrowRight className="w-4 h-4 text-primary -ml-1" />
        </div>
      </div>
      <span className="absolute top-4 left-4 bg-background/90 backdrop-blur-md text-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full z-20 border border-border">SketchUp</span>
      <span className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full z-20">NewRender IA</span>
      {isAutoPlaying && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-border animate-pulse">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Toque para interagir</span>
        </div>
      )}
    </div>
  );
};

/* ─── Small Before/After for gallery ─── */
const BeforeAfterSlider = ({ before, after, label }: { before: string; after: string; label: string }) => {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);

  const handleMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  return (
    <div className="space-y-3">
      <div
        className="relative w-full aspect-[4/5] md:aspect-[3/4] rounded-3xl overflow-hidden cursor-col-resize select-none border border-border shadow-xl"
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={(e) => dragging && handleMove(e.clientX, e.currentTarget.getBoundingClientRect())}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
      >
        <img src={after} alt="Depois" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <img src={before} alt="Antes" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${10000 / Math.max(position, 1)}%` }} />
        </div>
        <div className="absolute top-0 bottom-0 z-10" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0.5 h-full bg-primary-foreground/80 shadow-lg" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <ArrowRight className="w-4 h-4 text-primary-foreground rotate-180" />
            <ArrowRight className="w-4 h-4 text-primary-foreground -ml-1" />
          </div>
        </div>
        <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-20">Antes</span>
        <span className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-20">Depois</span>
      </div>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
};

/* ─── Typewriter effect ─── */
const TypewriterText = ({ texts, className }: { texts: string[]; className?: string }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % texts.length), 3000);
    return () => clearInterval(timer);
  }, [texts.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
        transition={{ duration: 0.5 }}
        className={className}
      >
        {texts[index]}
      </motion.span>
    </AnimatePresence>
  );
};

/* ─── Data ─── */
const FEATURES = [
  { icon: Sparkles, title: "Prompts com IA", desc: "Análise inteligente da sua imagem para gerar prompts otimizados para Midjourney e DALL·E." },
  { icon: Image, title: "Render com IA", desc: "Gere renders fotorrealistas direto na plataforma, sem sair do sistema." },
  { icon: Paintbrush, title: "Montagem de Fachada", desc: "Envie a foto do local, a fachada desejada, marque onde quer posicionar e a IA faz a montagem perfeita." },
  { icon: Video, title: "Vídeo Animação IA", desc: "Transforme seus renders em vídeos animados cinematográficos para impressionar clientes." },
  { icon: Layers, title: "Comparador", desc: "Compare lado a lado o projeto original e o render para apresentações impactantes." },
  { icon: Eye, title: "Referência Borrada", desc: "Oculte a referência para que a IA crie sem viés, gerando resultados mais criativos." },
  { icon: Zap, title: "Parâmetros Avançados", desc: "Controle iluminação, estilo, vegetação, entorno urbano e muito mais." },
  { icon: MessageSquare, title: "Prompt Bilíngue", desc: "Prompt em inglês (para IA) e português (para você entender), com tags profissionais." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Faça upload", desc: "Envie qualquer imagem: SketchUp, Revit, croqui à mão, foto de maquete.", icon: Image },
  { step: "02", title: "Configure", desc: "Ajuste estilo, iluminação, vegetação e parâmetros com controles intuitivos.", icon: Zap },
  { step: "03", title: "Gere com IA", desc: "Nossa IA cria o prompt perfeito e gera o render fotorrealista em segundos.", icon: Sparkles },
  { step: "04", title: "Apresente", desc: "Compare antes/depois, monte fachadas e crie vídeos para surpreender seu cliente.", icon: TrendingUp },
];

const PAIN_POINTS = [
  { problem: "3-5 dias esperando o render", solution: "Pronto em 30 segundos", icon: Clock },
  { problem: "R$ 500-2.000 por render externo", solution: "A partir de R$ 1,00 por render", icon: TrendingUp },
  { problem: "Software pesado + máquina cara", solution: "100% online, sem instalação", icon: Shield },
  { problem: "Horas montando fachada no Photoshop", solution: "Montagem IA em 1 clique", icon: Paintbrush },
];

const PLANS = [
  { name: "Starter", credits: 50, price: "R$ 19,90", perCredit: "R$ 0,40", popular: false, features: ["50 créditos/mês", "~16 prompts, ~10 renders ou ~1 vídeo IA", "Montagem de fachada com IA", "Recarga automática mensal", "Comparador de renders"] },
  { name: "Pro", credits: 200, price: "R$ 49,90", perCredit: "R$ 0,25", popular: true, features: ["200 créditos/mês", "~66 prompts, ~40 renders ou ~6 vídeos IA", "Montagem de fachada com IA", "Recarga automática mensal", "Economia de 37%", "Preview visual IA", "Suporte prioritário"] },
  { name: "Studio", credits: 500, price: "R$ 99,90", perCredit: "R$ 0,20", popular: false, features: ["500 créditos/mês", "~166 prompts, ~100 renders ou ~16 vídeos IA", "Montagem de fachada ilimitada", "Recarga automática mensal", "Economia de 50%", "Acesso antecipado a novidades", "Suporte VIP"] },
];

const FAQ = [
  { q: "Como funciona o NewRender?", a: "Você faz upload de uma imagem do seu projeto (SketchUp, planta, croqui), configura parâmetros como iluminação e estilo, e nossa IA gera um prompt profissional otimizado. Com esse prompt, você pode gerar um render fotorrealista diretamente na plataforma." },
  { q: "O que é a Montagem de Fachada?", a: "É a funcionalidade mais poderosa do NewRender. Você envia a foto real do local (terreno, prédio), envia o projeto da fachada, marca na foto onde quer posicionar e a IA faz a composição fotorrealista — como se a fachada já estivesse construída. Perfeito para apresentar ao cliente." },
  { q: "Preciso saber usar Midjourney?", a: "Não! O NewRender gera o prompt pronto para copiar e colar. Além disso, você pode gerar o render direto na nossa plataforma sem precisar de nenhuma outra ferramenta." },
  { q: "Quanto custa cada operação?", a: "Prompt: 3 créditos. Render com IA: 5 créditos. Montagem de Fachada: 10 créditos. Vídeo animação IA: 30 créditos. Você pode comprar pacotes de créditos sem mensalidade." },
  { q: "Os créditos expiram?", a: "Não! Seus créditos ficam na conta até serem usados. Sem prazo de validade, sem surpresas." },
  { q: "Posso usar qualquer tipo de imagem?", a: "Sim! SketchUp, Revit, AutoCAD, fotos de maquete, croquis à mão livre, plantas humanizadas, fotos de terrenos reais — qualquer referência visual funciona." },
  { q: "A qualidade do render é profissional?", a: "Sim. Nosso sistema usa modelos de IA de última geração com prompts otimizados especificamente para arquitetura, gerando resultados com qualidade de estúdio de renderização." },
];

const TESTIMONIALS = [
  { name: "Arq. Marina S.", role: "Escritório de Fachadas", text: "Reduzi de 3 dias para 15 minutos o tempo de apresentação de fachadas para o cliente. Impressionante.", stars: 5 },
  { name: "Arq. Ricardo L.", role: "Projetos Residenciais", text: "A montagem de fachada é absurda. Mostro pro cliente como vai ficar o prédio no terreno real. Nunca mais perco venda.", stars: 5 },
  { name: "Designer Juliana M.", role: "Interiores & Comercial", text: "Uso para interiores e fachadas. A função de comparação antes/depois é perfeita para reuniões com o cliente.", stars: 5 },
  { name: "Eng. Carlos P.", role: "Construtora", text: "Os vídeos animados e montagens de fachada mudaram o nível das nossas apresentações. O cliente assina na hora.", stars: 5 },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Faça upload", desc: "Envie qualquer imagem: SketchUp, Revit, croqui à mão, foto de maquete.", icon: Image },
  { step: "02", title: "Configure", desc: "Ajuste estilo, iluminação, vegetação e parâmetros com controles intuitivos.", icon: Zap },
  { step: "03", title: "Gere com IA", desc: "Nossa IA cria o prompt perfeito e gera o render fotorrealista em segundos.", icon: Sparkles },
  { step: "04", title: "Apresente", desc: "Compare antes/depois e surpreenda seu cliente com resultados de estúdio.", icon: TrendingUp },
];

const PAIN_POINTS = [
  { problem: "3-5 dias esperando o render", solution: "Pronto em 30 segundos", icon: Clock },
  { problem: "R$ 500-2.000 por render externo", solution: "A partir de R$ 1,00 por render", icon: TrendingUp },
  { problem: "Software pesado + máquina cara", solution: "100% online, sem instalação", icon: Shield },
];

const PLANS = [
  { name: "Starter", credits: 50, price: "R$ 19,90", perCredit: "R$ 0,40", popular: false, features: ["50 créditos/mês", "~16 prompts, ~10 renders ou ~1 vídeo IA", "Recarga automática mensal", "Comparador de renders"] },
  { name: "Pro", credits: 200, price: "R$ 49,90", perCredit: "R$ 0,25", popular: true, features: ["200 créditos/mês", "~66 prompts, ~40 renders ou ~6 vídeos IA", "Recarga automática mensal", "Economia de 37%", "Preview visual IA", "Suporte prioritário"] },
  { name: "Studio", credits: 500, price: "R$ 99,90", perCredit: "R$ 0,20", popular: false, features: ["500 créditos/mês", "~166 prompts, ~100 renders ou ~16 vídeos IA", "Recarga automática mensal", "Economia de 50%", "Acesso antecipado a novidades", "Suporte VIP"] },
];

const FAQ = [
  { q: "Como funciona o NewRender?", a: "Você faz upload de uma imagem do seu projeto (SketchUp, planta, croqui), configura parâmetros como iluminação e estilo, e nossa IA gera um prompt profissional otimizado. Com esse prompt, você pode gerar um render fotorrealista diretamente na plataforma." },
  { q: "Preciso saber usar Midjourney?", a: "Não! O NewRender gera o prompt pronto para copiar e colar. Além disso, você pode gerar o render direto na nossa plataforma sem precisar de nenhuma outra ferramenta." },
  { q: "Quanto custa cada operação?", a: "Prompt: 3 créditos. Render com IA: 5 créditos. Vídeo animação IA: 30 créditos. Você pode comprar pacotes de créditos sem mensalidade." },
  { q: "Os créditos expiram?", a: "Não! Seus créditos ficam na conta até serem usados. Sem prazo de validade, sem surpresas." },
  { q: "Posso usar qualquer tipo de imagem?", a: "Sim! SketchUp, Revit, AutoCAD, fotos de maquete, croquis à mão livre, plantas humanizadas — qualquer referência visual funciona." },
  { q: "A qualidade do render é profissional?", a: "Sim. Nosso sistema usa modelos de IA de última geração com prompts otimizados especificamente para arquitetura, gerando resultados com qualidade de estúdio de renderização." },
];

const TESTIMONIALS = [
  { name: "Arq. Marina S.", role: "Escritório de Fachadas", text: "Reduzi de 3 dias para 15 minutos o tempo de apresentação de fachadas para o cliente. Impressionante.", stars: 5 },
  { name: "Arq. Ricardo L.", role: "Projetos Residenciais", text: "Os renders gerados são tão bons que meus clientes não acreditam que foram feitos com IA. Excelente custo-benefício.", stars: 5 },
  { name: "Designer Juliana M.", role: "Interiores & Comercial", text: "Uso para interiores e fachadas. A função de comparação antes/depois é perfeita para reuniões com o cliente.", stars: 5 },
];

const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* ═══ NAV ═══ */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-sm font-black uppercase tracking-[0.15em]">
            NEW<span className="text-primary">RENDER</span>
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/login")} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Entrar
            </button>
            <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
              Começar grátis
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale }} className="px-4 pt-12 pb-8 md:pt-24 md:pb-16 text-center relative">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary rounded-full px-5 py-2 text-[9px] font-black uppercase tracking-widest mb-8"
        >
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          IA PARA ARQUITETURA — RESULTADOS EM SEGUNDOS
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-8xl font-black uppercase italic tracking-tighter mb-6 leading-[0.85]"
        >
          Seu projeto.<br />
          <span className="text-primary">
            <TypewriterText texts={["Render profissional.", "Em 30 segundos.", "Sem renderista.", "Qualidade de estúdio."]} />
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sm md:text-lg text-muted-foreground font-medium max-w-xl mx-auto mb-8"
        >
          Transforme qualquer SketchUp, croqui ou planta em renders fotorrealistas
          com inteligência artificial. <strong className="text-foreground">Zero software pesado. Zero espera.</strong>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-4"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Testar grátis agora
          </motion.button>
          <a href="#exemplos" className="border border-border bg-surface px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-foreground hover:border-primary/30 transition-all active:scale-95 text-center flex items-center justify-center gap-2">
            <Play className="w-4 h-4" /> Ver resultados
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-6 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest"
        >
          <span>✦ 30 créditos grátis</span>
          <span>✦ Sem cartão</span>
          <span className="hidden sm:inline">✦ Cancele quando quiser</span>
        </motion.div>
      </motion.section>

      {/* ═══ HERO COMPARATOR ═══ */}
      <section className="px-4 pb-12 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <HeroComparator before={beforeFacade} after={afterFacade} />
        </motion.div>
      </section>

      {/* ═══ SOCIAL PROOF STRIP ═══ */}
      <section className="px-4 pb-12 md:pb-20">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="max-w-4xl mx-auto grid grid-cols-3 gap-4"
        >
          {[
            { number: 500, suffix: "+", label: "Renders gerados" },
            { number: 30, suffix: "s", label: "Tempo médio" },
            { number: 95, suffix: "%", label: "Satisfação" },
          ].map((stat, i) => (
            <div key={i} className="text-center bg-surface border border-border rounded-3xl py-6 md:py-8 px-3">
              <p className="text-3xl md:text-5xl font-black text-primary tabular-nums">
                <CountUp target={stat.number} suffix={stat.suffix} />
              </p>
              <p className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══ PAIN POINTS → SOLUTION ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-4xl mx-auto py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-destructive/10 text-destructive rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">O PROBLEMA</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Você ainda <span className="text-destructive">perde tempo</span> assim?
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-5"
          >
            {PAIN_POINTS.map((pp, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-surface border border-border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-4 md:gap-8 group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center flex-shrink-0">
                    <pp.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm md:text-base font-bold text-muted-foreground line-through decoration-destructive/40">{pp.problem}</span>
                </div>
                <div className="hidden md:block text-2xl text-primary font-black">→</div>
                <div className="flex items-center gap-4 flex-1 w-full">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-sm md:text-base font-black text-foreground">{pp.solution}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto pt-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">SIMPLES ASSIM</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              4 passos para um <span className="text-primary">render perfeito</span>
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="relative bg-surface border border-border rounded-3xl p-6 text-center group hover:border-primary/30 transition-all"
              >
                <span className="text-6xl font-black text-primary/10 group-hover:text-primary/20 transition-colors absolute top-3 right-4">{item.step}</span>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ BEFORE / AFTER GALLERY ═══ */}
      <section id="exemplos" className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-5xl mx-auto py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-10"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">RESULTADOS REAIS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Antes & <span className="text-primary">Depois</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">Arraste para comparar — estes são resultados reais do NewRender</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { before: beforeFacade, after: afterFacade, label: "Fachada Comercial" },
              { before: beforeKitchen, after: afterKitchen, label: "Cozinha Gourmet" },
              { before: beforeBuilding, after: afterBuilding, label: "Edifício Residencial" },
            ].map((item, i) => (
              <motion.div key={i} variants={scaleUp}>
                <BeforeAfterSlider {...item} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto pt-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">FUNCIONALIDADES</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Tudo num <span className="text-primary">só lugar</span>
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-4xl mx-auto py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">DEPOIMENTOS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Profissionais que já <span className="text-primary">transformaram</span> seus projetos
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} variants={fadeUp} whileHover={{ y: -4 }} className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/20 transition-all">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-5 leading-relaxed">"{t.text}"</p>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ PLANS ═══ */}
      <section id="planos" className="px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto pt-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">ASSINATURAS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Invista menos que um <span className="text-primary">cafézinho por dia</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">Receba créditos todo mês. Cancele quando quiser.</p>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {PLANS.map((plan, i) => (
              <motion.div
                key={i}
                variants={scaleUp}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={`relative bg-surface rounded-[32px] p-7 shadow-xl transition-colors ${plan.popular ? 'border-2 border-primary shadow-primary/20 scale-[1.02]' : 'border border-border'}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap shadow-lg shadow-primary/30">
                    🔥 MAIS POPULAR
                  </span>
                )}
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">{plan.name}</p>
                <div className="mb-1">
                  <span className="text-5xl font-black tabular-nums"><CountUp target={plan.credits} /></span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">créditos/mês</p>
                <p className="text-2xl font-black mb-1">{plan.price}</p>
                <p className="text-[10px] text-muted-foreground mb-2">/mês • cobrado automaticamente</p>
                <span className="inline-block bg-field-bg border border-border rounded-xl px-3 py-1 text-[10px] font-bold text-muted-foreground mb-5">
                  {plan.perCredit} por crédito
                </span>
                <div className="border-t border-border my-4" />
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/login")}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-field-bg border border-border text-foreground hover:border-primary/30'
                  }`}
                >
                  Assinar agora
                </motion.button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-10 text-center bg-surface border border-border rounded-3xl p-6 max-w-lg mx-auto"
          >
            <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground mb-1">Acabou os créditos?</p>
            <p className="text-xs text-muted-foreground">
              Compre créditos avulsos a qualquer momento, sem assinatura.{" "}
              <button onClick={() => navigate("/login")} className="text-primary font-bold hover:underline">
                Acessar minha conta →
              </button>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-2xl mx-auto py-16">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-10"
          >
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">DÚVIDAS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
          </motion.div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ.map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <AccordionItem value={`faq-${i}`} className="bg-surface border border-border rounded-2xl px-6 overflow-hidden">
                    <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-5 text-left">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-5">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <motion.section
        variants={scaleUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="px-4 pb-16 md:pb-24"
      >
        <div className="max-w-3xl mx-auto relative overflow-hidden bg-primary/5 border border-primary/20 rounded-[40px] p-8 md:p-16 text-center">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="relative z-10"
          >
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-6" />
          </motion.div>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-4 relative z-10">
            Pare de esperar.<br />
            <span className="text-primary">Comece a impressionar.</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-md mx-auto relative z-10">
            30 créditos grátis. Sem cartão. Em 30 segundos você terá seu primeiro render.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="relative z-10 bg-primary text-primary-foreground px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-colors"
          >
            Criar conta grátis — É instantâneo
          </motion.button>
        </div>
      </motion.section>

      <LegalFooter />
    </div>
  );
};

export default Landing;
