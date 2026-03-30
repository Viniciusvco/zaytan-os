import { useState } from "react";
import { Plus, AlertTriangle, AlertCircle, CheckCircle2, Circle, Clock, Calendar, BarChart3, Trash2, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";

interface Ticket {
  id: string;
  client: string;
  title: string;
  priority: "critico" | "atencao" | "saudavel";
  category: "erro" | "sugestao" | "otimizacao";
  status: "aberto" | "tratamento" | "resolvido";
  createdAt: string;
  description: string;
}

interface CSCheck { id: string; label: string; done: boolean; date?: string }

const initialTickets: Ticket[] = [
  { id: "1", client: "Escritório Silva", title: "Leads não estão chegando no CRM", priority: "critico", category: "erro", status: "aberto", createdAt: "28 Mar", description: "Integração N8N parou de enviar leads para o CRM" },
  { id: "2", client: "Clínica Bella", title: "Sugestão de nova campanha sazonal", priority: "saudavel", category: "sugestao", status: "aberto", createdAt: "29 Mar", description: "Cliente pediu campanha de Páscoa" },
  { id: "3", client: "TechShop", title: "CPC acima da média no Google Ads", priority: "atencao", category: "otimizacao", status: "tratamento", createdAt: "27 Mar", description: "CPC subiu 35% na última semana" },
  { id: "4", client: "Imobiliária Nova Era", title: "Erro na landing page mobile", priority: "critico", category: "erro", status: "tratamento", createdAt: "26 Mar", description: "Formulário não funciona em iOS" },
  { id: "5", client: "Construtora Horizonte", title: "Otimizar funil de conversão", priority: "saudavel", category: "otimizacao", status: "resolvido", createdAt: "25 Mar", description: "Implementar remarketing dinâmico" },
  { id: "6", client: "Escritório Silva", title: "Relatório mensal atrasado", priority: "atencao", category: "erro", status: "resolvido", createdAt: "24 Mar", description: "Enviar relatório de Fevereiro" },
];

const priorityConfig = {
  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: AlertCircle },
  saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
};

const categoryConfig = {
  erro: { label: "Erro", className: "bg-destructive/10 text-destructive" },
  sugestao: { label: "Sugestão", className: "bg-info/10 text-info" },
  otimizacao: { label: "Otimização", className: "bg-warning/10 text-warning" },
};

const columns = [
  { key: "aberto" as const, label: "Abertos", color: "destructive" },
  { key: "tratamento" as const, label: "Em Tratamento", color: "warning" },
  { key: "resolvido" as const, label: "Resolvidos", color: "success" },
];

type ViewMode = "kanban" | "diario" | "semanal" | "mensal";

const dailyChecks: CSCheck[] = [
  { id: "d1", label: "Verificar envio de leads em todos os clientes", done: false },
  { id: "d2", label: "Checar orçamento diário Meta Ads", done: true, date: "30 Mar" },
  { id: "d3", label: "Monitorar conversões ativas", done: false },
];
const weeklyChecks: CSCheck[] = [
  { id: "w1", label: "Relatório semanal de performance", done: true, date: "28 Mar" },
  { id: "w2", label: "Coletar feedbacks dos clientes", done: false },
  { id: "w3", label: "Revisão de campanhas ativas", done: false },
];
const monthlyChecks: CSCheck[] = [
  { id: "m1", label: "Reunião mensal de resultados", done: false },
  { id: "m2", label: "Relatório completo com ROI por cliente", done: false },
  { id: "m3", label: "Planejamento estratégico do próximo mês", done: false },
];

const CustomerSuccess = () => {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [view, setView] = useState<ViewMode>("kanban");
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [showAdd, setShowAdd] = useState(false);
  const [checks, setChecks] = useState({ daily: dailyChecks, weekly: weeklyChecks, monthly: monthlyChecks });
  const [newTicket, setNewTicket] = useState<Omit<Ticket, "id" | "createdAt">>({ client: "", title: "", priority: "saudavel", category: "erro", status: "aberto", description: "" });

  const moveTicket = (id: string, newStatus: Ticket["status"]) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const toggleCheck = (type: "daily" | "weekly" | "monthly", checkId: string) => {
    setChecks(prev => ({
      ...prev,
      [type]: prev[type].map(c => c.id === checkId ? { ...c, done: !c.done, date: !c.done ? new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : c.date } : c),
    }));
  };

  const abertos = tickets.filter(t => t.status === "aberto").length;
  const tratamento = tickets.filter(t => t.status === "tratamento").length;
  const resolvidos = tickets.filter(t => t.status === "resolvido").length;

  const checklistsMap: Record<string, { type: "daily" | "weekly" | "monthly"; label: string; items: CSCheck[] }> = {
    diario: { type: "daily", label: "Diário — Hoje", items: checks.daily },
    semanal: { type: "weekly", label: "Semanal — Esta semana", items: checks.weekly },
    mensal: { type: "monthly", label: "Mensal — Este mês", items: checks.monthly },
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Success</h1>
          <p className="text-sm text-muted-foreground mt-1">Central de chamados e checklists de sucesso</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Chamado</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card"><p className="text-2xl font-bold text-destructive">{abertos}</p><p className="text-xs text-muted-foreground">Abertos</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-warning">{tratamento}</p><p className="text-xs text-muted-foreground">Em Tratamento</p></div>
        <div className="metric-card"><p className="text-2xl font-bold text-success">{resolvidos}</p><p className="text-xs text-muted-foreground">Resolvidos</p></div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {([
          { value: "kanban" as const, label: "Kanban", icon: Tag },
          { value: "diario" as const, label: "Diário", icon: Clock },
          { value: "semanal" as const, label: "Semanal", icon: Calendar },
          { value: "mensal" as const, label: "Mensal", icon: BarChart3 },
        ]).map(tab => (
          <button key={tab.value} onClick={() => setView(tab.value)} className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Kanban View */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => (
            <div key={col.key} className="kanban-column">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-${col.color}/10 text-${col.color}`}>
                  {tickets.filter(t => t.status === col.key).length}
                </span>
              </div>
              <div className="space-y-2">
                {tickets.filter(t => t.status === col.key).map(ticket => {
                  const pri = priorityConfig[ticket.priority];
                  const cat = categoryConfig[ticket.category];
                  const PriIcon = pri.icon;
                  return (
                    <div key={ticket.id} className="kanban-card">
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${pri.className} inline-flex items-center gap-1`}>
                          <PriIcon className="h-3 w-3" /> {pri.label}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.className}`}>{cat.label}</span>
                      </div>
                      <h4 className="text-sm font-medium mb-1">{ticket.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{ticket.client}</p>
                      <p className="text-xs text-muted-foreground/70 mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{ticket.createdAt}</span>
                        <div className="flex gap-1">
                          {col.key !== "aberto" && <button onClick={() => moveTicket(ticket.id, col.key === "tratamento" ? "aberto" : "tratamento")} className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted-foreground/10">← Voltar</button>}
                          {col.key !== "resolvido" && <button onClick={() => moveTicket(ticket.id, col.key === "aberto" ? "tratamento" : "resolvido")} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20">Avançar →</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checklist Views */}
      {(view === "diario" || view === "semanal" || view === "mensal") && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">{checklistsMap[view].label}</h3>
          <div className="space-y-3">
            {checklistsMap[view].items.map(ch => (
              <div key={ch.id} className="flex items-center gap-3 group">
                <button onClick={() => toggleCheck(checklistsMap[view].type, ch.id)} className="shrink-0">
                  {ch.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-border hover:text-primary transition-colors" />}
                </button>
                <span className={`text-sm flex-1 ${ch.done ? "line-through text-muted-foreground" : ""}`}>{ch.label}</span>
                {ch.done && ch.date && <span className="text-[10px] text-muted-foreground">{ch.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Chamado</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do Cliente" value={newTicket.client} onChange={e => setNewTicket(p => ({ ...p, client: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Título do chamado" value={newTicket.title} onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))} />
            <textarea className="w-full h-20 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Descrição do problema..." value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value as any }))}>
              <option value="critico">Crítico</option><option value="atencao">Atenção</option><option value="saudavel">Saudável</option>
            </select>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newTicket.category} onChange={e => setNewTicket(p => ({ ...p, category: e.target.value as any }))}>
              <option value="erro">Erro</option><option value="sugestao">Sugestão</option><option value="otimizacao">Otimização</option>
            </select>
          </div>
          <DialogFooter><Button onClick={() => {
            if (newTicket.client && newTicket.title) {
              setTickets(prev => [...prev, { ...newTicket, id: Date.now().toString(), createdAt: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) }]);
              setNewTicket({ client: "", title: "", priority: "saudavel", category: "erro", status: "aberto", description: "" });
              setShowAdd(false);
            }
          }}>Criar Chamado</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSuccess;
