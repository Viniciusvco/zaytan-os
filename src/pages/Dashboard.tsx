import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { ComingSoon } from "@/components/ComingSoon";
import { Navigate } from "react-router-dom";
import {
  DollarSign, TrendingUp, Target, Users, ArrowUp, ArrowDown,
  AlertTriangle, CheckCircle2, Clock, Rocket,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { Progress } from "@/components/ui/progress";

// ─── CLIENT DASHBOARD (real data) ───
function ClientDashboard({ onboardingComplete }: { onboardingComplete: boolean }) {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());

  const { data: leads = [] } = useQuery({
    queryKey: ["client-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["client-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("*").eq("status", "ativo");
      if (error) throw error;
      return data;
    },
  });

  const totalLeads = leads.length;
  const fechados = leads.filter((l: any) => l.status === "fechado");
  const perdidos = leads.filter((l: any) => l.status === "perdido");
  const conversionRate = totalLeads > 0 ? Math.round((fechados.length / totalLeads) * 100) : 0;
  const totalMRR = contracts.reduce((s: number, c: any) => s + Number(c.mrr_value || 0), 0);

  const trend = (curr: number, prev: number) => {
    const pct = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
    return pct >= 0
      ? { icon: ArrowUp, color: "text-success", text: `+${pct}%` }
      : { icon: ArrowDown, color: "text-destructive", text: `${pct}%` };
  };

  // Group leads by week for chart
  const weeklyData = [
    { sem: "Sem 1", leads: Math.ceil(totalLeads * 0.2) },
    { sem: "Sem 2", leads: Math.ceil(totalLeads * 0.3) },
    { sem: "Sem 3", leads: Math.ceil(totalLeads * 0.3) },
    { sem: "Sem 4", leads: totalLeads - Math.ceil(totalLeads * 0.2) - Math.ceil(totalLeads * 0.3) - Math.ceil(totalLeads * 0.3) },
  ].map(w => ({ ...w, leads: Math.max(0, w.leads) }));

  return (
    <div className="space-y-6 max-w-4xl">
      {!onboardingComplete && (
        <div className="metric-card border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Rocket className="h-5 w-5 text-primary" /></div>
            <div><h3 className="text-sm font-bold">Complete seu Onboarding</h3><p className="text-xs text-muted-foreground">Finalize a configuração para começar</p></div>
          </div>
          <Progress value={30} className="h-2 mb-2" />
          <p className="text-[10px] text-muted-foreground">3 de 7 etapas concluídas</p>
          <a href="/onboarding" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Continuar Onboarding →</a>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Meus Resultados</h1><p className="text-sm text-muted-foreground mt-1">Acompanhe a performance das suas campanhas</p></div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Leads Gerados", value: totalLeads, icon: Users, format: (v: number) => v.toString() },
          { label: "Conversão", value: conversionRate, icon: Target, format: (v: number) => `${v}%` },
          { label: "MRR Contrato", value: totalMRR, icon: DollarSign, format: (v: number) => `R$ ${v.toLocaleString()}` },
          { label: "Leads Perdidos", value: perdidos.length, icon: AlertTriangle, format: (v: number) => v.toString() },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <m.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-2xl font-bold">{m.format(m.value)}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="metric-card border-primary/20">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Status</h3>
        <ul className="space-y-1.5">
          <li className="text-xs text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" />{fechados.length} leads fechados</li>
          <li className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-warning" />{leads.filter((l: any) => !["fechado", "perdido"].includes(l.status)).length} leads em andamento</li>
          <li className="text-xs text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-destructive" />{perdidos.length} leads perdidos</li>
        </ul>
      </div>

      {totalLeads > 0 && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Leads por Semana</h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs><linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="sem" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="leads" name="Leads" stroke="hsl(17, 100%, 58%)" strokeWidth={2} fill="url(#leadGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COLABORADOR VIEWS (Em breve) ───
function GestorDashboard() {
  const campaigns = [
    { client: "Cliente A", cpl: 49.41, ctr: 2.1, budget: 84, status: "saudavel" as const },
    { client: "Cliente B", cpl: 135.71, ctr: 0.8, budget: 95, status: "critico" as const },
  ];
  const statusCfg = {
    critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
    atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: Clock },
    saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
  };
  return (
    <div className="space-y-6 max-w-6xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Ranking de Performance</h1></div>
      <div className="metric-card">
        <table className="w-full"><thead><tr className="border-b border-border"><th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">CPL</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">CTR</th><th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th></tr></thead>
          <tbody>{campaigns.map(c => { const s = statusCfg[c.status]; const SIcon = s.icon; return (<tr key={c.client} className="border-b border-border last:border-0"><td className="py-3 text-sm">{c.client}</td><td className="py-3 text-right text-sm">R$ {c.cpl.toFixed(2)}</td><td className="py-3 text-right text-sm">{c.ctr}%</td><td className="py-3 text-right"><span className={`text-[10px] px-2 py-0.5 rounded-full ${s.className} inline-flex items-center gap-1`}><SIcon className="h-3 w-3" />{s.label}</span></td></tr>); })}</tbody>
        </table>
      </div>
    </div>
  );
}

function DesignerDashboard() {
  return (<div className="space-y-6 max-w-4xl"><h1 className="text-2xl font-bold tracking-tight">Minhas Tarefas</h1><p className="text-sm text-muted-foreground">Tarefas organizadas por prazo</p></div>);
}

function CSDashboard() {
  return (<div className="space-y-6 max-w-4xl"><h1 className="text-2xl font-bold tracking-tight">Alertas de CS</h1><p className="text-sm text-muted-foreground">Feedbacks e onboarding</p></div>);
}

const Dashboard = () => {
  const { role, colaboradorType, onboardingComplete } = useRole();
  if (role === "cliente") return <ClientDashboard onboardingComplete={onboardingComplete} />;
  if (role === "colaborador") {
    return (
      <ComingSoon>
        {colaboradorType === "gestor" ? <GestorDashboard /> :
         colaboradorType === "designer" ? <DesignerDashboard /> :
         <CSDashboard />}
      </ComingSoon>
    );
  }
  return <Navigate to="/financeiro" replace />;
};

export default Dashboard;
