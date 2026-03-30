import { Lightbulb, Copy, Zap, FileText, Plus, BookOpen, Bot } from "lucide-react";
import { useState } from "react";

const offers = [
  {
    name: "Pack Tráfego + LP",
    pmf: "Profissionais liberais que precisam de presença digital rápida e leads qualificados. Dor: não sabem usar Meta Ads e não têm LP.",
    price: "R$ 2.500–4.000/mês",
    icp: "Advogados, dentistas, médicos",
  },
  {
    name: "Automação WhatsApp + IA",
    pmf: "Empresas com alto volume de leads que perdem vendas por demora no atendimento. Dor: resposta lenta = perda de deal.",
    price: "R$ 4.000–8.000/mês",
    icp: "Imobiliárias, clínicas, e-commerce",
  },
  {
    name: "Sistema Completo (Tráfego + Automação)",
    pmf: "Empresas maduras que querem escalar operação com IA. Dor: crescimento estagnado, processos manuais.",
    price: "R$ 8.000–15.000/mês",
    icp: "Construtoras, franquias, SaaS B2B",
  },
];

const prompts = [
  { title: "Qualificação de Lead", category: "Vendas", content: "Você é um SDR da Zaytan. Qualifique o lead perguntando: 1) Qual seu faturamento mensal? 2) Quantos leads recebe por mês? 3) Qual sua maior dor em marketing? ..." },
  { title: "Geração de Copy para LP", category: "Criação", content: "Crie uma copy para landing page seguindo o framework PAS (Problem-Agitate-Solve). O nicho é {nicho}, o serviço é {servico}..." },
  { title: "Análise de Concorrência", category: "Estratégia", content: "Analise os 5 principais concorrentes do cliente no nicho {nicho}. Para cada um, identifique: posicionamento, preço, pontos fortes e fracos..." },
  { title: "Script Chatbot Vendas", category: "Automação", content: "Crie um fluxo conversacional para WhatsApp que qualifique leads e agende reuniões automaticamente. O tom deve ser profissional mas acolhedor..." },
];

const blueprints = [
  { title: "Funil WhatsApp → CRM", tools: "N8N, Evolution API, Supabase", steps: 8 },
  { title: "Lead Scoring com IA", tools: "N8N, GPT-4, Google Sheets", steps: 5 },
  { title: "Onboarding Automático", tools: "N8N, Slack, Notion API", steps: 12 },
  { title: "Relatório Semanal Auto", tools: "N8N, Meta Ads API, GPT-4", steps: 6 },
];

const Estrategia = () => {
  const [activeTab, setActiveTab] = useState<"pmf" | "prompts" | "blueprints">("pmf");

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estratégia & IA</h1>
        <p className="text-sm text-muted-foreground mt-1">Product Market Fit, prompts e blueprints de automação</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {[
          { value: "pmf" as const, label: "Product Market Fit", icon: Lightbulb },
          { value: "prompts" as const, label: "Prompts", icon: Bot },
          { value: "blueprints" as const, label: "Blueprints", icon: Zap },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* PMF */}
      {activeTab === "pmf" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <div key={offer.name} className="metric-card animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{offer.name}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">PMF / Dor</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{offer.pmf}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">ICP</p>
                    <p className="text-xs font-medium">{offer.icp}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Preço</p>
                    <p className="text-xs font-semibold text-primary">{offer.price}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prompts */}
      {activeTab === "prompts" && (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div key={prompt.title} className="metric-card animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{prompt.title}</h3>
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{prompt.category}</span>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{prompt.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Blueprints */}
      {activeTab === "blueprints" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {blueprints.map((bp) => (
            <div key={bp.title} className="metric-card animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{bp.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{bp.steps} etapas</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {bp.tools.split(", ").map((tool) => (
                  <span key={tool} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tool}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Estrategia;
