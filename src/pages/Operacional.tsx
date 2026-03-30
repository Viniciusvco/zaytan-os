import { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Rocket, ClipboardCheck, BarChart3, Calendar, Plus, X, Pencil } from "lucide-react";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface OnboardingClient {
  id: string;
  name: string;
  startDate: string;
  checklist: { item: string; done: boolean }[];
}

interface ProductionCard {
  id: string;
  title: string;
  client: string;
  stage: string;
  naming: string;
  validated: boolean;
  createdAt: Date;
}

const onboardingClients: OnboardingClient[] = [
  {
    id: "1", name: "Imobiliária Nova Era", startDate: "25 Mar",
    checklist: [
      { item: "Contrato assinado", done: true },
      { item: "Acessos coletados (Meta, Google, domínio)", done: true },
      { item: "Briefing preenchido", done: false },
      { item: "Kick-off realizado", done: false },
      { item: "Configuração de ferramentas", done: false },
      { item: "Primeira entrega agendada", done: false },
    ],
  },
  {
    id: "2", name: "Construtora Horizonte", startDate: "28 Mar",
    checklist: [
      { item: "Contrato assinado", done: true },
      { item: "Acessos coletados (Meta, Google, domínio)", done: false },
      { item: "Briefing preenchido", done: false },
      { item: "Kick-off realizado", done: false },
      { item: "Configuração de ferramentas", done: false },
      { item: "Primeira entrega agendada", done: false },
    ],
  },
];

const now = new Date();
const initialProductionCards: ProductionCard[] = [
  { id: "1", title: "LP Advogados", client: "Escritório Silva", stage: "criacao", naming: "[ZAYTAN] LP_Silva_Adv_v1", validated: false, createdAt: new Date(now.getTime() - 5 * 86400000) },
  { id: "2", title: "Campanha Meta", client: "Clínica Bella", stage: "revisao", naming: "[ZAYTAN] Camp_Bella_Meta_Mar", validated: true, createdAt: new Date(now.getTime() - 2 * 86400000) },
  { id: "3", title: "Chatbot WhatsApp", client: "Imobiliária Nova Era", stage: "validacao", naming: "[ZAYTAN] Bot_NovaEra_WA_v2", validated: true, createdAt: new Date(now.getTime() - 1 * 86400000) },
  { id: "4", title: "Dashboard BI", client: "TechShop", stage: "no_ar", naming: "[ZAYTAN] BI_TechShop_v1", validated: true, createdAt: new Date(now.getTime() - 7 * 86400000) },
  { id: "5", title: "Automação N8N", client: "Construtora Horizonte", stage: "criacao", naming: "[ZAYTAN] Auto_Horiz_N8N_v1", validated: false, createdAt: new Date(now.getTime() - 4 * 86400000) },
];

const productionStages = [
  { id: "criacao", label: "Criação", color: "bg-info" },
  { id: "revisao", label: "Revisão", color: "bg-warning" },
  { id: "validacao", label: "Validação Técnica", color: "bg-primary" },
  { id: "no_ar", label: "No Ar", color: "bg-success" },
];

const csClients = [
  { name: "Escritório Silva", leadsEnviados: 45, metaLeads: 50, reuniaoMensal: "12 Abr", status: "ok" },
  { name: "Clínica Bella", leadsEnviados: 32, metaLeads: 40, reuniaoMensal: "15 Abr", status: "atencao" },
  { name: "TechShop", leadsEnviados: 68, metaLeads: 60, reuniaoMensal: "10 Abr", status: "ok" },
  { name: "Restaurante Sabor & Arte", leadsEnviados: 12, metaLeads: 30, reuniaoMensal: "Pausado", status: "critico" },
];

function getDaysInStage(createdAt: Date): number {
  return Math.ceil((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
}

const Operacional = () => {
  const [activeTab, setActiveTab] = useState<"onboarding" | "producao" | "cs">("onboarding");
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [onboarding, setOnboarding] = useState(onboardingClients);
  const [production, setProduction] = useState(initialProductionCards);
  const [newCheckItem, setNewCheckItem] = useState<Record<string, string>>({});

  const addCheckItem = (clientId: string) => {
    const text = newCheckItem[clientId]?.trim();
    if (!text) return;
    setOnboarding(prev => prev.map(c => c.id === clientId ? { ...c, checklist: [...c.checklist, { item: text, done: false }] } : c));
    setNewCheckItem(prev => ({ ...prev, [clientId]: "" }));
  };

  const toggleCheckItem = (clientId: string, idx: number) => {
    setOnboarding(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      const checklist = [...c.checklist];
      checklist[idx] = { ...checklist[idx], done: !checklist[idx].done };
      return { ...c, checklist };
    }));
  };

  const removeCheckItem = (clientId: string, idx: number) => {
    setOnboarding(prev => prev.map(c => c.id === clientId ? { ...c, checklist: c.checklist.filter((_, i) => i !== idx) } : c));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operacional</h1>
          <p className="text-sm text-muted-foreground mt-1">Onboarding, produção e customer success</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {[
          { value: "onboarding" as const, label: "Onboarding", icon: Rocket },
          { value: "producao" as const, label: "Kanban Produção", icon: ClipboardCheck },
          { value: "cs" as const, label: "CS Dashboard", icon: BarChart3 },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Onboarding with customizable checklists */}
      {activeTab === "onboarding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {onboarding.map((client) => {
            const done = client.checklist.filter((c) => c.done).length;
            const total = client.checklist.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div key={client.id} className="metric-card animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{client.name}</h3>
                      <p className="text-[10px] text-muted-foreground">Início: {client.startDate}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 80 ? "bg-success/10 text-success" : pct >= 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-2">
                  {client.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs group">
                      <button onClick={() => toggleCheckItem(client.id, i)} className="shrink-0">
                        {item.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}
                      </button>
                      <span className={`flex-1 ${item.done ? "text-muted-foreground line-through" : ""}`}>{item.item}</span>
                      <button onClick={() => removeCheckItem(client.id, i)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    className="flex-1 h-8 px-3 rounded-lg bg-muted border-0 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Adicionar etapa..."
                    value={newCheckItem[client.id] || ""}
                    onChange={(e) => setNewCheckItem(prev => ({ ...prev, [client.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCheckItem(client.id)}
                  />
                  <Button size="sm" variant="outline" onClick={() => addCheckItem(client.id)}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kanban with lead time */}
      {activeTab === "producao" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {productionStages.map((stage) => {
            const cards = production.filter((c) => c.stage === stage.id);
            return (
              <div key={stage.id} className="kanban-column min-w-[260px] flex-1">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map((card) => {
                    const days = getDaysInStage(card.createdAt);
                    const isDelayed = days > 3;
                    return (
                      <div key={card.id} className={`kanban-card ${isDelayed ? "border-primary/60 bg-primary/5" : ""}`}>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium">{card.title}</h4>
                          {isDelayed && <AlertTriangle className="h-3.5 w-3.5 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{card.client}</p>
                        <div className="flex items-center justify-between">
                          <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">{card.naming}</code>
                          {card.validated ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-warning" />
                          )}
                        </div>
                        <div className={`mt-2 flex items-center gap-1 text-[10px] ${isDelayed ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          {days}d nesta etapa
                          {isDelayed && <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Atrasado</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CS Dashboard */}
      {activeTab === "cs" && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Monitoramento de Customer Success</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Leads Enviados</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Meta</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">% Atingido</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Reunião Mensal</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {csClients.map((c) => {
                const pct = Math.round((c.leadsEnviados / c.metaLeads) * 100);
                const statusConfig = {
                  ok: { label: "Saudável", className: "bg-success/10 text-success" },
                  atencao: { label: "Atenção", className: "bg-warning/10 text-warning" },
                  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive" },
                };
                const st = statusConfig[c.status as keyof typeof statusConfig];
                return (
                  <tr key={c.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 text-sm font-medium">{c.name}</td>
                    <td className="py-2.5 text-right text-sm">{c.leadsEnviados}</td>
                    <td className="py-2.5 text-right text-sm text-muted-foreground">{c.metaLeads}</td>
                    <td className="py-2.5 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-success/10 text-success" : pct >= 70 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{pct}%</span></td>
                    <td className="py-2.5 text-right text-xs text-muted-foreground flex items-center justify-end gap-1"><Calendar className="h-3 w-3" /> {c.reuniaoMensal}</td>
                    <td className="py-2.5 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Operacional;
