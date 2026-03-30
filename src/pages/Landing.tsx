import { ArrowRight, BarChart3, Brain, FileText, Globe, Kanban, Shield, Target, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zaytanLogo from "@/assets/zaytan-logo.png";

const features = [
  { icon: BarChart3, title: "Dashboard Executivo", description: "Visão completa de MRR, churn, margem e projeções financeiras em tempo real." },
  { icon: Kanban, title: "Pipeline de Vendas", description: "Funil comercial visual com deals, probabilidades e valor ponderado." },
  { icon: Users, title: "Gestão de Clientes", description: "CRM completo com checklists, histórico de reuniões e central de ativos." },
  { icon: FileText, title: "Contratos & Lifecycle", description: "Cadastro com alertas de vencimento, status e cálculo automático de TCV." },
  { icon: Target, title: "Comercial & Metas", description: "Meta vs Realizado por vendedor com cálculo automático de comissões." },
  { icon: Brain, title: "Zaytan Mind (IA)", description: "Agente estratégico que analisa dados e sugere ações para os sócios." },
  { icon: Globe, title: "Captação de Leads", description: "Formulários whitelabel e pipeline de conversão com tracking completo." },
  { icon: Zap, title: "Operacional Kanban", description: "Esteira de produção com onboarding, kanban e customer success." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
              <img src={zaytanLogo} alt="Zaytan" className="h-9 w-9 object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">Zaytan OS</span>
          </div>
          <Button onClick={() => navigate("/")} size="sm">
            Entrar <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" /> Plataforma Enterprise para Agências
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
          O hub de decisão estratégica da sua{" "}
          <span className="text-primary">agência</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Una operação, finanças e inteligência artificial em uma única plataforma.
          Controle total para sócios de agências de tráfego e automação.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button size="lg" onClick={() => navigate("/")}>
            Acessar Dashboard <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
            Ver funcionalidades
          </Button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Tudo que você precisa em um só lugar</h2>
          <p className="text-muted-foreground mt-2">Módulos integrados para gestão completa da sua agência</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="metric-card group hover:border-primary/40">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="metric-card flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Como usamos seus dados</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Zaytan OS respeita integralmente a LGPD. Seus dados financeiros, de clientes e operacionais são armazenados com
              criptografia de ponta a ponta. Integrações com Google Calendar e outras plataformas utilizam OAuth 2.0 com escopo
              mínimo de permissões. Nenhum dado é compartilhado com terceiros. Você mantém controle total sobre suas informações.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 Zaytan OS · Todos os direitos reservados</p>
          <p className="text-xs text-muted-foreground">v4.0 — Enterprise Edition</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
