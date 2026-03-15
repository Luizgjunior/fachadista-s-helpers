import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import LegalFooter from "@/components/shared/LegalFooter";

const sections = [
  {
    title: "1. Controlador dos Dados",
    content: "FCD ViewPrompt — suporte@fcdviewprompt.com.br",
  },
  {
    title: "2. Dados que Coletamos",
    content:
      "• E-mail e nome (fornecidos no cadastro).\n• Imagens enviadas para geração de prompts — processadas em memória e não armazenadas permanentemente.\n• Prompts gerados e parâmetros utilizados.\n• Dados de uso e créditos consumidos.",
  },
  {
    title: "3. Como Usamos seus Dados",
    content:
      "• Prestação do serviço de geração de prompts.\n• Controle de créditos e planos.\n• Comunicações sobre o serviço e atualizações relevantes.",
  },
  {
    title: "4. Compartilhamento de Dados",
    content:
      "As imagens enviadas são processadas pela API do Google Gemini, conforme a política de privacidade do Google. Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.",
  },
  {
    title: "5. Seus Direitos (LGPD)",
    content:
      "Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a:\n\n• Acesso aos seus dados pessoais.\n• Correção de dados incompletos ou desatualizados.\n• Exclusão dos seus dados.\n• Portabilidade dos dados.\n\nSolicitações devem ser enviadas para: suporte@fcdviewprompt.com.br",
  },
  {
    title: "6. Cookies e Armazenamento Local",
    content:
      "Utilizamos localStorage apenas para preferências de sessão. O sistema de autenticação utiliza cookies seguros para gerenciamento de sessão.",
  },
  {
    title: "7. Retenção de Dados",
    content:
      "Seus dados são mantidos enquanto a conta estiver ativa. Após solicitação de exclusão, os dados serão removidos em até 30 dias.",
  },
  {
    title: "8. Contato do Encarregado (DPO)",
    content: "Para questões sobre privacidade e proteção de dados: suporte@fcdviewprompt.com.br",
  },
];

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <header className="border-b border-border bg-surface px-6 py-4 flex items-center gap-4">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      <div className="flex items-center gap-2">
        <div className="bg-gradient-to-br from-primary to-brand-glow p-1.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-black tracking-tight text-foreground uppercase italic">
          FCD <span className="text-primary">VIEW</span>PROMPT
        </span>
      </div>
    </header>

    <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-16">
      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase mb-2">
        Política de Privacidade
      </h1>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
        Em conformidade com a LGPD (Lei 13.709/2018)
      </p>
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

export default Privacy;
