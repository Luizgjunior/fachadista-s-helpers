import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, ShoppingCart, CreditCard, Zap, Check, ChevronDown, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/fachadista/AppHeader";
import LegalFooter from "@/components/shared/LegalFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_brl: number;
  is_popular: boolean;
  is_active: boolean;
  features: unknown;
}

const getFeatures = (features: unknown): string[] => {
  if (!features) return [];
  if (Array.isArray(features)) return features as string[];
  return [];
};

const FAQ_ITEMS = [
  {
    q: "Os créditos expiram?",
    a: "Não. Seus créditos não têm prazo de validade e ficam disponíveis na sua conta até serem utilizados.",
  },
  {
    q: "Posso comprar mais de um pacote?",
    a: "Sim! Os créditos se acumulam. Você pode comprar quantos pacotes quiser e eles serão somados ao seu saldo atual.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Os pagamentos serão processados com segurança pela plataforma Cakto, aceitando Pix, cartão de crédito (parcelado) e boleto bancário.",
  },
  {
    q: "Quanto tempo para os créditos aparecerem?",
    a: "Após confirmação do pagamento, os créditos são adicionados automaticamente em até 1 minuto via integração direta.",
  },
  {
    q: "E se eu tiver algum problema?",
    a: "Nossa equipe está disponível pelo e-mail suporte@fcdviewprompt.com.br para resolver qualquer situação.",
  },
];

const STEPS = [
  { icon: ShoppingCart, title: "Escolha seu pacote", desc: "Selecione a quantidade de créditos ideal para seu volume de trabalho" },
  { icon: CreditCard, title: "Pague com segurança", desc: "Pix, cartão de crédito ou boleto bancário via plataforma Cakto" },
  { icon: Zap, title: "Créditos instantâneos", desc: "Seus créditos são adicionados automaticamente em até 1 minuto" },
];

const Plans = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("price_brl", { ascending: true });
      if (data) setPackages(data as unknown as CreditPackage[]);
      setLoading(false);
    };
    load();
  }, []);

  const costPerCredit = (pkg: CreditPackage) =>
    (pkg.price_brl / pkg.credits).toFixed(2).replace(".", ",");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-surface px-4 md:px-10 py-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao app
        </button>
      </div>

      {/* Hero */}
      <section className="text-center px-4 pt-12 pb-8 md:pt-20 md:pb-12">
        <span className="inline-block bg-primary/10 text-primary rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-6">
          ⚡ CRÉDITOS
        </span>
        <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-foreground mb-4">
          Recarregue seus Créditos
        </h1>
        <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto mb-8">
          Gere mais prompts profissionais. Sem assinatura, sem mensalidade.
        </p>
        {profile && !profile.is_admin && (
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-2xl px-6 py-3 shadow-sm">
            <span className="text-sm font-black text-foreground">
              Saldo atual: ⚡ {profile.credits} créditos
            </span>
          </div>
        )}
      </section>

      {/* Packages */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div key={i} className="bg-muted animate-pulse rounded-[40px] h-[480px]" />
              ))
            : packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-surface rounded-[40px] p-8 shadow-xl transition-all ${
                    pkg.is_popular
                      ? "border-2 border-primary shadow-primary/20"
                      : "border border-border"
                  }`}
                >
                  {pkg.is_popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full whitespace-nowrap">
                      MAIS POPULAR
                    </span>
                  )}

                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">
                    {pkg.name}
                  </p>

                  <div className="mb-1">
                    <span className="text-6xl font-black text-foreground tabular-nums">
                      {pkg.credits}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">créditos</p>

                  <p className="text-2xl font-black text-foreground mb-1">
                    R$ {pkg.price_brl.toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-3">/pagamento único</p>

                  <span className="inline-block bg-field-bg border border-border rounded-xl px-3 py-1 text-[10px] font-bold text-muted-foreground mb-6">
                    R$ {costPerCredit(pkg)} por crédito
                  </span>

                  <div className="border-t border-border my-6" />

                  <ul className="space-y-3 mb-8">
                    {getFeatures(pkg.features).map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] cursor-not-allowed opacity-70 transition-all ${
                      pkg.is_popular
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "bg-field-bg border border-border text-muted-foreground"
                    }`}
                    title="Pagamento disponível em breve"
                  >
                    Em breve
                  </button>
                </div>
              ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-black uppercase tracking-tight text-foreground mb-10">
            Como vai funcionar
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center flex-1 w-full md:w-auto">
                <div className="flex flex-col items-center text-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-1">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-black">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-[200px]">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block flex-shrink-0 w-16 h-px bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl md:text-2xl font-black uppercase tracking-tight text-foreground mb-8">
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-surface border border-border rounded-2xl px-6 overflow-hidden"
              >
                <AccordionTrigger className="text-sm font-black uppercase tracking-wider text-foreground hover:no-underline py-5">
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

      {/* Coming soon banner */}
      <section className="px-4 pb-16 md:pb-20">
        <div className="max-w-2xl mx-auto bg-primary/5 border border-primary/20 rounded-[32px] p-8 text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-3">
            Pagamentos chegando em breve!
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Estamos finalizando a integração com a Cakto. Em breve você poderá comprar créditos
            diretamente aqui. Por enquanto, seu plano Free inclui 10 créditos para explorar.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all active:scale-95"
          >
            Voltar ao app e gerar prompts
          </button>
        </div>
      </section>

      <LegalFooter />
    </div>
  );
};

export default Plans;
