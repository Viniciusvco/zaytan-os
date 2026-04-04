import { ArrowRight, BarChart3, Kanban, Shield, Target, Users, Zap, FileText, HeadphonesIcon, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import zaytanLogo from "@/assets/zaytan-logo.png";

const features = [
  { icon: BarChart3, title: "Dashboard Multi-Visão", description: "Admin vê tudo, gestor vê métricas avançadas, cliente acompanha resultados simples." },
  { icon: Kanban, title: "Kanban de Demandas", description: "Backlog → Andamento → Revisão → Concluído. Visão dupla: cliente simplificada, equipe detalhada." },
  { icon: Target, title: "CRM Integrado", description: "Pipeline visual de vendas com histórico, notas e relação com campanhas." },
  { icon: Zap, title: "Motor de Regras", description: "Alertas automáticos de orçamento, leads, CTR, CPM, frequência e CPL." },
  { icon: Users, title: "Gestão de Equipe (PDI)", description: "Métricas por colaborador: tarefas, tempo médio, atrasos e volume por tipo." },
  { icon: FileText, title: "Contratos & Financeiro", description: "Lifecycle de contratos com alertas de vencimento e margem real por cliente." },
  { icon: Rocket, title: "Onboarding Guiado", description: "Fluxo de configuração para novos clientes com briefing e upload de materiais." },
  { icon: HeadphonesIcon, title: "White-Label Ready", description: "Logo, cor e nome personalizáveis por cliente. Preparado para virar SaaS." },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center overflow-hidden">
              <img src={zaytanLogo} alt="Zaytan" className="h-9 w-9 object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">Zaytan OS</span>
          </div>
          <Button onClick={() => navigate("/")} size="sm">Entrar <ArrowRight className="h-4 w-4 ml-1" /></Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-6">
          <Zap className="h-3.5 w-3.5" /> Plataforma SaaS para Agências
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.1]">
          O sistema operacional da sua <span className="text-primary">agência</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
          Substitua Trello, Notion, CRM e Meta Ads Manager por uma única plataforma. Escale para 200+ clientes.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Button size="lg" onClick={() => navigate("/")}>Acessar Plataforma <ArrowRight className="h-4 w-4 ml-1" /></Button>
          <Button size="lg" variant="outline" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>Ver funcionalidades</Button>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold tracking-tight">Tudo em um só lugar</h2>
          <p className="text-muted-foreground mt-2">3 níveis de acesso: Admin · Colaborador · Cliente</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
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

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="metric-card flex flex-col md:flex-row items-center gap-6 p-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Privacidade e LGPD</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Zaytan OS respeita a LGPD. Dados criptografados, integrações via OAuth 2.0 com escopo mínimo. Nenhum dado é compartilhado com terceiros. Preparado para white-label com isolamento total por cliente.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">© 2026 Zaytan OS · Todos os direitos reservados</p>
          <p className="text-xs text-muted-foreground">v6.0 — Multi-Tenant SaaS</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
