import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Zap, Image, Layers, Eye, MessageSquare, ChevronDown, Star, Check } from "lucide-react";
import { useState, useEffect } from "react";
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

/* ─── Before / After Slider ─── */
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
        {/* After (full) */}
        <img src={after} alt="Depois" className="absolute inset-0 w-full h-full object-cover" />
        {/* Before (clipped) */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
          <img src={before} alt="Antes" className="absolute inset-0 w-full h-full object-cover" style={{ minWidth: `${10000 / position}%` }} />
        </div>
        {/* Divider */}
        <div className="absolute top-0 bottom-0 z-10" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0.5 h-full bg-primary-foreground/80 shadow-lg" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
            <ArrowRight className="w-4 h-4 text-primary-foreground rotate-180" />
            <ArrowRight className="w-4 h-4 text-primary-foreground -ml-1" />
          </div>
        </div>
        {/* Labels */}
        <span className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-20">SketchUp</span>
        <span className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full z-20">NewRender</span>
      </div>
      <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
};

/* ─── Data ─── */
const FEATURES = [
  { icon: Sparkles, title: "Prompts com IA", desc: "Análise inteligente da sua imagem para gerar prompts profissionais otimizados para Midjourney e DALL·E." },
  { icon: Image, title: "Render com IA", desc: "Gere renders fotorrealistas diretamente na plataforma a partir do prompt criado, sem sair do sistema." },
  { icon: Layers, title: "Comparador", desc: "Compare lado a lado o projeto original e o render gerado para apresentações impactantes ao cliente." },
  { icon: Eye, title: "Referência Borrada", desc: "Oculte a referência original para que a IA crie sem viés, gerando resultados mais criativos e únicos." },
  { icon: Zap, title: "Parâmetros Avançados", desc: "Controle iluminação, estilo, vegetação, entorno urbano, formato social e muito mais com controles granulares." },
  { icon: MessageSquare, title: "Prompt Bilíngue", desc: "Receba o prompt em inglês (para IA) e português (para entender), com tags e estrutura profissional." },
];

const USE_CASES = [
  { title: "Fachadas Comerciais", desc: "Transforme croquis de fachadas em renders apresentáveis para aprovação do cliente em minutos." },
  { title: "Interiores Residenciais", desc: "Visualize cozinhas, salas e quartos com acabamentos realistas antes de executar a obra." },
  { title: "Edifícios Residenciais", desc: "Apresente empreendimentos com qualidade de estúdio sem o custo de um renderista profissional." },
  { title: "Paisagismo", desc: "Adicione vegetação realista, iluminação natural e contexto urbano aos seus projetos." },
];

const PLANS = [
  { name: "Starter", credits: 50, price: "R$ 29,90", perCredit: "R$ 0,60", popular: false, features: ["50 créditos", "~16 prompts ou ~5 renders", "Sem expiração", "Suporte por e-mail"] },
  { name: "Pro", credits: 200, price: "R$ 79,90", perCredit: "R$ 0,40", popular: true, features: ["200 créditos", "~66 prompts ou ~20 renders", "Sem expiração", "Suporte prioritário", "Acesso antecipado a novidades"] },
  { name: "Studio", credits: 500, price: "R$ 149,90", perCredit: "R$ 0,30", popular: false, features: ["500 créditos", "~166 prompts ou ~50 renders", "Sem expiração", "Suporte VIP", "Acesso antecipado a novidades", "Consultoria de prompt"] },
];

const FAQ = [
  { q: "Como funciona o NewRender?", a: "Você faz upload de uma imagem do seu projeto (SketchUp, planta, croqui), configura parâmetros como iluminação e estilo, e nossa IA gera um prompt profissional otimizado. Com esse prompt, você pode gerar um render fotorrealista diretamente na plataforma." },
  { q: "Preciso saber usar Midjourney?", a: "Não! O NewRender gera o prompt pronto para copiar e colar. Além disso, você pode gerar o render direto na nossa plataforma sem precisar de nenhuma outra ferramenta." },
  { q: "Quanto custa gerar um prompt?", a: "Cada geração de prompt consome 3 créditos. Cada render com IA consome 10 créditos. Você pode comprar pacotes de créditos sem mensalidade." },
  { q: "Os créditos expiram?", a: "Não! Seus créditos ficam na conta até serem usados. Sem prazo de validade, sem surpresas." },
  { q: "Posso usar qualquer tipo de imagem?", a: "Sim! SketchUp, Revit, AutoCAD, fotos de maquete, croquis à mão livre, plantas humanizadas — qualquer referência visual funciona." },
  { q: "A qualidade do render é profissional?", a: "Sim. Nosso sistema usa modelos de IA de última geração com prompts otimizados especificamente para arquitetura, gerando resultados com qualidade de estúdio de renderização." },
];

const TESTIMONIALS = [
  { name: "Arq. Marina S.", text: "Reduzi de 3 dias para 15 minutos o tempo de apresentação de fachadas para o cliente. Impressionante.", stars: 5 },
  { name: "Arq. Ricardo L.", text: "Os renders gerados são tão bons que meus clientes não acreditam que foram feitos com IA. Excelente custo-benefício.", stars: 5 },
  { name: "Designer Juliana M.", text: "Uso para interiores e fachadas. A função de comparação antes/depois é perfeita para reuniões com o cliente.", stars: 5 },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <span className="text-sm font-black uppercase tracking-[0.15em]">
            NEW<span className="text-primary">RENDER</span>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Entrar
            </button>
            <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/20">
              Começar grátis
            </button>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="px-4 pt-16 pb-12 md:pt-28 md:pb-20 text-center">
        <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest mb-6 animate-in fade-in duration-700">
          ✦ INTELIGÊNCIA ARTIFICIAL PARA ARQUITETURA
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter mb-5 leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
          Do <span className="text-primary">SketchUp</span> ao<br />
          Render <span className="text-primary">Fotorrealista</span><br />
          em minutos
        </h1>
        <p className="text-sm md:text-base text-muted-foreground font-medium max-w-lg mx-auto mb-8 animate-in fade-in duration-700 delay-200">
          Transforme qualquer projeto em renders profissionais com IA. 
          Sem renderista, sem horas de espera, sem software pesado.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <button onClick={() => navigate("/login")} className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Começar grátis
          </button>
          <a href="#exemplos" className="border border-border bg-surface px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-foreground hover:border-primary/30 transition-all active:scale-95 text-center">
            Ver exemplos
          </a>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-4 font-bold uppercase tracking-widest">
          10 créditos grátis • Sem cartão de crédito
        </p>
      </section>

      {/* ═══ BEFORE / AFTER ═══ */}
      <section id="exemplos" className="px-4 pb-16 md:pb-24">
        <div className="text-center mb-10">
          <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">RESULTADOS REAIS</span>
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
            Antes & <span className="text-primary">Depois</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Arraste para comparar o projeto original com o render gerado</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <BeforeAfterSlider before={beforeFacade} after={afterFacade} label="Fachada Comercial" />
          <BeforeAfterSlider before={beforeKitchen} after={afterKitchen} label="Cozinha Gourmet" />
          <BeforeAfterSlider before={beforeBuilding} after={afterBuilding} label="Edifício Residencial" />
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-5xl mx-auto py-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">FUNCIONALIDADES</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Tudo que você <span className="text-primary">precisa</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-surface border border-border rounded-3xl p-6 hover:border-primary/30 transition-all group">
                <div className="w-11 h-11 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">PARA QUEM É</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Casos de <span className="text-primary">uso</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {USE_CASES.map((uc, i) => (
              <div key={i} className="bg-surface border border-border rounded-3xl p-6 flex gap-4 items-start">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-black">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider mb-1">{uc.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{uc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-4xl mx-auto py-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">DEPOIMENTOS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              O que dizem nossos <span className="text-primary">usuários</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-surface border border-border rounded-3xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground mb-4 italic">"{t.text}"</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PLANS ═══ */}
      <section id="planos" className="px-4 pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">CRÉDITOS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Escolha seu <span className="text-primary">pacote</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">Sem assinatura. Sem mensalidade. Pague apenas quando precisar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan, i) => (
              <div key={i} className={`relative bg-surface rounded-[32px] p-7 shadow-xl transition-all ${plan.popular ? 'border-2 border-primary shadow-primary/20 scale-[1.02]' : 'border border-border'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
                    MAIS POPULAR
                  </span>
                )}
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-3">{plan.name}</p>
                <div className="mb-1">
                  <span className="text-5xl font-black tabular-nums">{plan.credits}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">créditos</p>
                <p className="text-2xl font-black mb-1">{plan.price}</p>
                <p className="text-[10px] text-muted-foreground mb-2">/pagamento único</p>
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
                <button
                  onClick={() => navigate("/login")}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-field-bg border border-border text-foreground hover:border-primary/30'
                  }`}
                >
                  Começar agora
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="px-4 pb-16 md:pb-24 bg-surface-muted/50">
        <div className="max-w-2xl mx-auto py-16">
          <div className="text-center mb-10">
            <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest mb-4">DÚVIDAS</span>
            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-surface border border-border rounded-2xl px-6 overflow-hidden">
                <AccordionTrigger className="text-sm font-bold text-foreground hover:no-underline py-5 text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="px-4 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto bg-primary/5 border border-primary/20 rounded-[32px] p-8 md:p-12 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-3">
            Pronto para revolucionar<br />seus renders?
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Comece agora com 10 créditos grátis. Sem cartão de crédito, sem compromisso.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            Criar conta grátis
          </button>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
};

export default Landing;
