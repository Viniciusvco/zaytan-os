import { useState } from "react";
import { CheckCircle2, Circle, Calendar, Phone, Mail, BarChart3, Clock } from "lucide-react";

interface CSCheck { id: string; label: string; done: boolean; date?: string }
interface CSClient {
  id: string; name: string; leadsEnviados: number; metaLeads: number;
  reuniaoMensal: string; status: "ok" | "atencao" | "critico";
  dailyChecks: CSCheck[]; weeklyChecks: CSCheck[]; monthlyChecks: CSCheck[];
}

const initialClients: CSClient[] = [
  {
    id: "1", name: "Escritório Silva", leadsEnviados: 45, metaLeads: 50, reuniaoMensal: "12 Abr", status: "ok",
    dailyChecks: [
      { id: "d1", label: "Verificar envio de leads", done: true, date: "30 Mar" },
      { id: "d2", label: "Checar orçamento diário Meta", done: true, date: "30 Mar" },
      { id: "d3", label: "Monitorar conversões", done: false },
    ],
    weeklyChecks: [
      { id: "w1", label: "Relatório semanal de performance", done: true, date: "28 Mar" },
      { id: "w2", label: "Feedback do cliente sobre leads", done: false },
    ],
    monthlyChecks: [
      { id: "m1", label: "Reunião mensal de resultados", done: false },
      { id: "m2", label: "Relatório completo com ROI", done: false },
      { id: "m3", label: "Planejamento do próximo mês", done: false },
    ],
  },
  {
    id: "2", name: "Clínica Bella", leadsEnviados: 32, metaLeads: 40, reuniaoMensal: "15 Abr", status: "atencao",
    dailyChecks: [
      { id: "d1", label: "Verificar envio de leads", done: true, date: "30 Mar" },
      { id: "d2", label: "Checar orçamento diário Meta", done: false },
    ],
    weeklyChecks: [
      { id: "w1", label: "Relatório semanal", done: false },
    ],
    monthlyChecks: [
      { id: "m1", label: "Reunião mensal de resultados", done: false },
    ],
  },
  {
    id: "3", name: "TechShop", leadsEnviados: 68, metaLeads: 60, reuniaoMensal: "10 Abr", status: "ok",
    dailyChecks: [
      { id: "d1", label: "Verificar envio de leads", done: true, date: "30 Mar" },
      { id: "d2", label: "Monitorar Google Ads", done: true, date: "30 Mar" },
    ],
    weeklyChecks: [
      { id: "w1", label: "Relatório semanal", done: true, date: "28 Mar" },
    ],
    monthlyChecks: [
      { id: "m1", label: "Reunião mensal de resultados", done: true, date: "15 Mar" },
    ],
  },
  {
    id: "4", name: "Restaurante Sabor & Arte", leadsEnviados: 12, metaLeads: 30, reuniaoMensal: "Pausado", status: "critico",
    dailyChecks: [{ id: "d1", label: "Verificar envio de leads", done: false }],
    weeklyChecks: [{ id: "w1", label: "Relatório semanal", done: false }],
    monthlyChecks: [{ id: "m1", label: "Reunião mensal", done: false }],
  },
];

const statusMap = {
  ok: { label: "Saudável", className: "bg-success/10 text-success" },
  atencao: { label: "Atenção", className: "bg-warning/10 text-warning" },
  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive" },
};

type ViewMode = "diario" | "semanal" | "mensal";

const CustomerSuccess = () => {
  const [clients, setClients] = useState(initialClients);
  const [view, setView] = useState<ViewMode>("diario");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleCheck = (clientId: string, checkType: "dailyChecks" | "weeklyChecks" | "monthlyChecks", checkId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      return {
        ...c,
        [checkType]: c[checkType].map(ch =>
          ch.id === checkId ? { ...ch, done: !ch.done, date: !ch.done ? new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ch.date } : ch
        ),
      };
    }));
  };

  const checkTypeMap: Record<ViewMode, "dailyChecks" | "weeklyChecks" | "monthlyChecks"> = {
    diario: "dailyChecks", semanal: "weeklyChecks", mensal: "monthlyChecks",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customer Success</h1>
        <p className="text-sm text-muted-foreground mt-1">Checklist de acompanhamento e monitoramento de clientes</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {([
          { value: "diario" as const, label: "Diário", icon: Clock },
          { value: "semanal" as const, label: "Semanal", icon: Calendar },
          { value: "mensal" as const, label: "Mensal", icon: BarChart3 },
        ]).map(tab => (
          <button key={tab.value} onClick={() => setView(tab.value)} className={`px-4 py-2 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${view === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="h-3.5 w-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Table */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Visão Geral</h3>
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Leads</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Meta</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">%</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Reunião</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
          </tr></thead>
          <tbody>
            {clients.map(c => {
              const pct = Math.round((c.leadsEnviados / c.metaLeads) * 100);
              const st = statusMap[c.status];
              return (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 text-sm font-medium">{c.name}</td>
                  <td className="py-2.5 text-right text-sm">{c.leadsEnviados}</td>
                  <td className="py-2.5 text-right text-sm text-muted-foreground">{c.metaLeads}</td>
                  <td className="py-2.5 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 100 ? "bg-success/10 text-success" : pct >= 70 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{pct}%</span></td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground flex items-center justify-end gap-1"><Calendar className="h-3 w-3" />{c.reuniaoMensal}</td>
                  <td className="py-2.5 text-right"><span className={`text-xs px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Checklists per client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clients.map(c => {
          const checks = c[checkTypeMap[view]];
          const done = checks.filter(ch => ch.done).length;
          const total = checks.length;
          return (
            <div key={c.id} className="metric-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold">{c.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{done}/{total} concluídos — {view === "diario" ? "Hoje" : view === "semanal" ? "Esta semana" : "Este mês"}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusMap[c.status].className}`}>{statusMap[c.status].label}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
              </div>
              <div className="space-y-2">
                {checks.map(ch => (
                  <div key={ch.id} className="flex items-center gap-2.5 group">
                    <button onClick={() => toggleCheck(c.id, checkTypeMap[view], ch.id)} className="shrink-0">
                      {ch.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-border hover:text-primary transition-colors" />}
                    </button>
                    <span className={`text-sm flex-1 ${ch.done ? "line-through text-muted-foreground" : ""}`}>{ch.label}</span>
                    {ch.done && ch.date && <span className="text-[10px] text-muted-foreground">{ch.date}</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CustomerSuccess;
