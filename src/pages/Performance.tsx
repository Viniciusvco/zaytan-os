import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { BarChart3, TrendingUp, MousePointer, Users, DollarSign, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

interface RuleResult {
  metric: string;
  level: AlertLevel;
  message: string;
}

function evaluateRules(c: CampaignData): RuleResult[] {
  const results: RuleResult[] = [];
  // Budget
  const tempoPercent = c.diasPassados / c.diasTotal;
  const gastoPercent = c.investimento / c.orcamentoTotal;
  const desvio = Math.abs(gastoPercent - tempoPercent) / tempoPercent;
  if (gastoPercent > tempoPercent && desvio > 0.2) results.push({ metric: "Orçamento", level: "critico", message: `Desvio de ${Math.round(desvio * 100)}% — orçamento pode esgotar antes do prazo` });
  else if (gastoPercent > tempoPercent && desvio > 0.1) results.push({ metric: "Orçamento", level: "atencao", message: `Desvio de ${Math.round(desvio * 100)}%` });
  // Leads
  const leadsExpected = c.metaLeads * tempoPercent;
  const leadsPercent = c.leads / leadsExpected;
  if (leadsPercent < 0.7) results.push({ metric: "Leads", level: "critico", message: `${Math.round(leadsPercent * 100)}% da meta proporcional` });
  else if (leadsPercent < 0.85) results.push({ metric: "Leads", level: "atencao", message: `${Math.round(leadsPercent * 100)}% da meta proporcional` });
  // CTR
  if (c.ctr < 1) results.push({ metric: "CTR", level: "critico", message: `CTR ${c.ctr}% — muito baixo` });
  else if (c.ctr < 1.5) results.push({ metric: "CTR", level: "atencao", message: `CTR ${c.ctr}%` });
  // Frequência
  if (c.frequencia > 6) results.push({ metric: "Frequência", level: "critico", message: `Frequência ${c.frequencia} — fadiga de anúncio` });
  else if (c.frequencia >= 3) results.push({ metric: "Frequência", level: "atencao", message: `Frequência ${c.frequencia}` });
  // CPM
  if (c.cpm > 30) results.push({ metric: "CPM", level: "critico", message: `CPM R$${c.cpm} — +50% acima do ideal` });
  else if (c.cpm > 24) results.push({ metric: "CPM", level: "atencao", message: `CPM R$${c.cpm}` });
  // CPL
  const baseCPL = 50;
  if (c.cpl > baseCPL * 1.3) results.push({ metric: "CPL", level: "critico", message: `CPL R$${c.cpl.toFixed(2)} — +30% acima do base` });
  else if (c.cpl > baseCPL * 1.15) results.push({ metric: "CPL", level: "atencao", message: `CPL R$${c.cpl.toFixed(2)}` });
  return results;
}

function getCardColor(rules: RuleResult[]): string {
  if (rules.some(r => r.level === "critico")) return "border-destructive/60 bg-destructive/5";
  if (rules.some(r => r.level === "atencao")) return "border-warning/60 bg-warning/5";
  return "border-success/30";
}

const alertIcons = { ok: CheckCircle2, atencao: AlertCircle, critico: AlertTriangle };
const alertColors = { ok: "text-success", atencao: "text-warning", critico: "text-destructive" };

const Performance = () => {
  const { role } = useRole();
  const [dateRange, setDateRange] = useState(useDefaultDateRange());

  const isClient = role === "cliente";
  const data = isClient ? campaignData.filter(c => c.client === "Escritório Silva") : campaignData;
  const chartData = data.map(c => ({ name: c.client.split(" ").slice(0, 2).join(" "), Leads: c.leads, Vendas: c.vendas }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isClient ? "Performance das Campanhas" : "Performance + Motor de Regras"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise de tráfego com alertas automáticos</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {!isClient && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Leads vs Vendas</h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Leads" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Vendas" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {data.map(c => {
          const rules = evaluateRules(c);
          const cardColor = getCardColor(rules);
          return (
            <div key={c.id} className={`metric-card ${cardColor}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">{c.client}</h3>
                  <span className="text-xs text-muted-foreground">{c.nicho}</span>
                </div>
                <div className="flex items-center gap-1">
                  {rules.length === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Saudável</span>}
                  {rules.some(r => r.level === "critico") && <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</span>}
                  {!rules.some(r => r.level === "critico") && rules.some(r => r.level === "atencao") && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atenção</span>}
                </div>
              </div>
              <div className={`grid ${isClient ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"} gap-3 mb-3`}>
                <div><p className="text-lg font-bold">{c.leads}</p><p className="text-[10px] text-muted-foreground">Leads</p></div>
                {!isClient && <div><p className="text-lg font-bold">{c.ctr}%</p><p className="text-[10px] text-muted-foreground">CTR</p></div>}
                <div><p className="text-lg font-bold">R$ {c.cpl.toFixed(0)}</p><p className="text-[10px] text-muted-foreground">CPL</p></div>
                <div><p className="text-lg font-bold">{c.cliques.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">Cliques</p></div>
                {!isClient && <div><p className="text-lg font-bold">{c.frequencia}</p><p className="text-[10px] text-muted-foreground">Frequência</p></div>}
                {!isClient && <div><p className="text-lg font-bold">R$ {c.cpm}</p><p className="text-[10px] text-muted-foreground">CPM</p></div>}
                <div><p className="text-lg font-bold">{Math.round((c.investimento / c.orcamentoTotal) * 100)}%</p><p className="text-[10px] text-muted-foreground">Orçamento</p></div>
              </div>
              {/* Rules Alerts */}
              {rules.length > 0 && !isClient && (
                <div className="space-y-1 border-t border-border pt-2">
                  {rules.map((r, i) => {
                    const Icon = alertIcons[r.level];
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Icon className={`h-3.5 w-3.5 ${alertColors[r.level]}`} />
                        <span className="font-medium">{r.metric}:</span>
                        <span className="text-muted-foreground">{r.message}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Performance;
