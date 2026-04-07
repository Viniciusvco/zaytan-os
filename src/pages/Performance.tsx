import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { BarChart3, AlertTriangle, CheckCircle2, AlertCircle, Pencil } from "lucide-react";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";

interface CampaignData {
  id: string; client: string; nicho: string;
  leads: number; metaLeads: number; vendas: number; cliques: number;
  investimento: number; orcamentoTotal: number; diasPassados: number; diasTotal: number;
  cpc: number; cpl: number; ctr: number; cpm: number; frequencia: number; roas: number;
}

const campaignData: CampaignData[] = [
  { id: "1", client: "Escritório Silva", nicho: "Advocacia", leads: 85, metaLeads: 100, vendas: 12, cliques: 2400, investimento: 4200, orcamentoTotal: 5000, diasPassados: 20, diasTotal: 30, cpc: 1.75, cpl: 49.41, ctr: 2.1, cpm: 22, frequencia: 2.4, roas: 3.8 },
  { id: "2", client: "Clínica Bella", nicho: "Saúde", leads: 120, metaLeads: 150, vendas: 18, cliques: 3800, investimento: 5600, orcamentoTotal: 6000, diasPassados: 25, diasTotal: 30, cpc: 1.47, cpl: 46.67, ctr: 2.5, cpm: 18, frequencia: 1.8, roas: 4.2 },
  { id: "3", client: "Imobiliária Nova Era", nicho: "Imobiliário", leads: 45, metaLeads: 80, vendas: 3, cliques: 1800, investimento: 6200, orcamentoTotal: 6000, diasPassados: 18, diasTotal: 30, cpc: 3.44, cpl: 137.78, ctr: 0.9, cpm: 45, frequencia: 5.2, roas: 2.1 },
  { id: "4", client: "TechShop", nicho: "E-commerce", leads: 320, metaLeads: 300, vendas: 48, cliques: 8500, investimento: 12000, orcamentoTotal: 15000, diasPassados: 22, diasTotal: 30, cpc: 1.41, cpl: 37.50, ctr: 3.2, cpm: 15, frequencia: 1.5, roas: 5.6 },
  { id: "5", client: "Construtora Horizonte", nicho: "Imobiliário", leads: 28, metaLeads: 60, vendas: 2, cliques: 950, investimento: 3800, orcamentoTotal: 4000, diasPassados: 28, diasTotal: 30, cpc: 4.00, cpl: 135.71, ctr: 0.8, cpm: 52, frequencia: 7.1, roas: 1.8 },
];

type AlertLevel = "ok" | "atencao" | "critico";
interface RuleResult { metric: string; level: AlertLevel; message: string; }

function evaluateRules(c: CampaignData): RuleResult[] {
  const results: RuleResult[] = [];
  const tempoPercent = c.diasPassados / c.diasTotal;
  const gastoPercent = c.investimento / c.orcamentoTotal;
  const desvio = Math.abs(gastoPercent - tempoPercent) / tempoPercent;
  if (gastoPercent > tempoPercent && desvio > 0.2) results.push({ metric: "Orçamento", level: "critico", message: `Desvio de ${Math.round(desvio * 100)}%` });
  else if (gastoPercent > tempoPercent && desvio > 0.1) results.push({ metric: "Orçamento", level: "atencao", message: `Desvio de ${Math.round(desvio * 100)}%` });
  const leadsExpected = c.metaLeads * tempoPercent;
  const leadsPercent = c.leads / leadsExpected;
  if (leadsPercent < 0.7) results.push({ metric: "Leads", level: "critico", message: `${Math.round(leadsPercent * 100)}% da meta` });
  else if (leadsPercent < 0.85) results.push({ metric: "Leads", level: "atencao", message: `${Math.round(leadsPercent * 100)}% da meta` });
  if (c.ctr < 1) results.push({ metric: "CTR", level: "critico", message: `${c.ctr}%` });
  else if (c.ctr < 1.5) results.push({ metric: "CTR", level: "atencao", message: `${c.ctr}%` });
  if (c.frequencia > 6) results.push({ metric: "Frequência", level: "critico", message: `${c.frequencia}` });
  else if (c.frequencia >= 3) results.push({ metric: "Frequência", level: "atencao", message: `${c.frequencia}` });
  if (c.cpm > 30) results.push({ metric: "CPM", level: "critico", message: `R$${c.cpm}` });
  else if (c.cpm > 24) results.push({ metric: "CPM", level: "atencao", message: `R$${c.cpm}` });
  const baseCPL = 50;
  if (c.cpl > baseCPL * 1.3) results.push({ metric: "CPL", level: "critico", message: `R$${c.cpl.toFixed(2)}` });
  else if (c.cpl > baseCPL * 1.15) results.push({ metric: "CPL", level: "atencao", message: `R$${c.cpl.toFixed(2)}` });
  return results;
}

function getOverallStatus(rules: RuleResult[]): "critico" | "atencao" | "saudavel" {
  if (rules.some(r => r.level === "critico")) return "critico";
  if (rules.some(r => r.level === "atencao")) return "atencao";
  return "saudavel";
}

const statusConfig = {
  critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
  atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: AlertCircle },
  saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
};

function generateActionPlan(c: CampaignData, rules: RuleResult[]): string {
  const actions: string[] = [];
  for (const r of rules) {
    if (r.metric === "CTR" && r.level === "critico") actions.push("Trocar criativos urgentemente. Testar novos hooks e CTAs.");
    else if (r.metric === "CTR" && r.level === "atencao") actions.push("Testar variações de criativos para melhorar CTR.");
    if (r.metric === "Frequência" && r.level === "critico") actions.push("Saturação de público. Expandir audiência ou criar novos conjuntos.");
    else if (r.metric === "Frequência") actions.push("Monitorar frequência. Considerar rotação de criativos.");
    if (r.metric === "CPM" && r.level === "critico") actions.push("CPM elevado. Revisar segmentação e testar posicionamentos.");
    if (r.metric === "CPL" && r.level === "critico") actions.push("CPL muito alto. Revisar funil, LP e qualificação do público.");
    else if (r.metric === "CPL") actions.push("CPL acima do ideal. Otimizar copy e segmentação.");
    if (r.metric === "Orçamento" && r.level === "critico") actions.push("Budget acima do ritmo. Reduzir gasto diário ou pausar conjuntos com baixo ROAS.");
    if (r.metric === "Leads" && r.level === "critico") actions.push("Leads muito abaixo da meta. Escalar budget em conjuntos que performam.");
  }
  if (actions.length === 0) return "Performance saudável. Manter estratégia atual e monitorar.";
  return actions.join(" ");
}

const Performance = () => {
  const { role } = useRole();
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [diagnoses, setDiagnoses] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const isClient = role === "cliente";
  const data = isClient ? campaignData.filter(c => c.client === "Escritório Silva") : campaignData;

  // Sort by severity: critico first
  const ranked = data.map(c => ({ ...c, rules: evaluateRules(c), status: getOverallStatus(evaluateRules(c)) }))
    .sort((a, b) => {
      const order = { critico: 0, atencao: 1, saudavel: 2 };
      return order[a.status] - order[b.status];
    });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            {isClient ? "Performance da Campanha" : "Ranking de Performance"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient ? "Métricas das suas campanhas" : "Clientes ordenados por criticidade — Motor de Regras"}
          </p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* Client simple view */}
      {isClient ? (
        <div className="space-y-4">
          {ranked.map(c => (
            <div key={c.id} className="metric-card">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div><p className="text-lg font-bold">{c.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                <div><p className="text-lg font-bold">R$ {c.cpl.toFixed(0)}</p><p className="text-[10px] text-muted-foreground">CPL</p></div>
                <div><p className="text-lg font-bold">{c.cliques.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Cliques</p></div>
                <div><p className="text-lg font-bold">{Math.round((c.investimento / c.orcamentoTotal) * 100)}%</p><p className="text-[10px] text-muted-foreground">Orçamento</p></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Admin/Gestor ranking table */
        <div className="metric-card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">#</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">CPL</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">CTR</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Budget</th>
              <th className="text-center text-xs font-medium text-muted-foreground pb-2">Status</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 pl-4">Alertas</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2 w-[180px] max-w-[220px]">Diagnóstico & Plano de Ação</th>
            </tr></thead>
            <tbody>
              {ranked.map((c, i) => {
                const s = statusConfig[c.status];
                const SIcon = s.icon;
                return (
                  <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${c.status === "critico" ? "bg-destructive/5" : ""}`}>
                    <td className="py-3 text-sm text-muted-foreground font-mono">{i + 1}</td>
                    <td className="py-3"><p className="text-sm font-medium">{c.client}</p><p className="text-[10px] text-muted-foreground">{c.nicho}</p></td>
                    <td className="py-3 text-right text-sm">R$ {c.cpl.toFixed(2)}</td>
                    <td className="py-3 text-right text-sm">{c.ctr}%</td>
                    <td className="py-3 text-right text-sm">{Math.round((c.investimento / c.orcamentoTotal) * 100)}%</td>
                    <td className="py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${s.className} inline-flex items-center gap-1`}><SIcon className="h-3 w-3" />{s.label}</span></td>
                    <td className="py-3 pl-4">
                      <div className="space-y-0.5">
                        {c.rules.map((r, ri) => (
                          <p key={ri} className={`text-[10px] ${r.level === "critico" ? "text-destructive" : "text-warning"}`}>
                            {r.metric}: {r.message}
                          </p>
                        ))}
                        {c.rules.length === 0 && <p className="text-[10px] text-success">Tudo OK</p>}
                      </div>
                    </td>
                    <td className="py-3 min-w-[200px]">
                      {editingId === c.id ? (
                        <input
                          autoFocus
                          className="w-full h-8 px-2 rounded bg-muted border-0 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                          value={diagnoses[c.id] ?? generateActionPlan(c, c.rules)}
                          onChange={e => setDiagnoses(prev => ({ ...prev, [c.id]: e.target.value }))}
                          onBlur={() => setEditingId(null)}
                          onKeyDown={e => e.key === "Enter" && setEditingId(null)}
                          placeholder="Escreva o diagnóstico..."
                        />
                      ) : (
                        <button onClick={() => setEditingId(c.id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 w-full text-left">
                          {diagnoses[c.id] || generateActionPlan(c, c.rules)}
                        </button>
                      )}
                    </td>
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

export default Performance;
