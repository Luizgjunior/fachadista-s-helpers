import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import LegalFooter from "@/components/shared/LegalFooter";

const sections = [
  {
    title: "1. Aceitação dos Termos",
    content:
      "Ao acessar ou utilizar o FCD ViewPrompt, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize o serviço.",
  },
  {
    title: "2. Descrição do Serviço",
    content:
      "O NewRender é uma ferramenta de geração de prompts para visualização arquitetônica (ArchViz) utilizando inteligência artificial. O serviço analisa imagens de projetos arquitetônicos e gera prompts otimizados para ferramentas como Midjourney.",
  },
  {
    title: "3. Conta e Acesso",
    content:
      "O cadastro é obrigatório e requer um e-mail válido. Você é responsável por manter a segurança de sua conta e por todas as atividades realizadas sob suas credenciais.",
  },
  {
    title: "4. Sistema de Créditos",
    content: `Cada geração de prompt consome créditos da sua conta.\n\n• Plano Free: 10 créditos iniciais, sem renovação automática.\n• Créditos comprados não expiram.\n• Não há reembolso de créditos já utilizados.\n• Os créditos são pessoais e intransferíveis.`,
  },
  {
    title: "5. Uso Aceitável",
    content:
      "É proibido utilizar o serviço para fins ilegais, tentar burlar o sistema de créditos ou realizar engenharia reversa. O conteúdo gerado é de inteira responsabilidade do usuário.",
  },
  {
    title: "6. Propriedade Intelectual",
    content:
      "Os prompts gerados pertencem ao usuário que os criou. A plataforma FCD ViewPrompt, incluindo seu código-fonte, design e marca, são propriedade exclusiva da FCD ViewPrompt.",
  },
  {
    title: "7. Limitação de Responsabilidade",
    content:
      'O serviço é fornecido "como está" (as-is). Não garantimos resultados específicos das imagens geradas a partir dos prompts. Não nos responsabilizamos por danos indiretos decorrentes do uso da plataforma.',
  },
  {
    title: "8. Alterações nos Termos",
    content:
      "Reservamo-nos o direito de alterar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou aviso na plataforma.",
  },
  {
    title: "9. Contato",
    content: "Para dúvidas sobre estes termos, entre em contato: suporte@fcdviewprompt.com.br",
  },
];

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    {/* Header */}
    <header className="border-b border-border bg-surface px-6 py-4 flex items-center gap-4">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-primary to-brand-glow p-1.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-black tracking-tight text-foreground uppercase italic">
          NEW<span className="text-primary">RENDER</span>
        </span>
      </div>
    </header>

    {/* Content */}
    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase mb-2">
        Termos de Uso
      </h1>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-10">
        Vigência: 15 de março de 2026
      </p>

      <div className="space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-3">
              {s.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {s.content}
            </p>
          </section>
        ))}
      </div>
    </main>

    <LegalFooter />
  </div>
);

export default Terms;
