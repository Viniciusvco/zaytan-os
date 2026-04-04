import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { DollarSign, TrendingUp, Target, Receipt, Repeat, Zap, Users, MousePointer, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";

const revenueBreakdown = [
  { month: "Out", mrr: 22000, setup: 4000, spot: 2000 },
  { month: "Nov", mrr: 25000, setup: 5000, spot: 2500 },
  { month: "Dez", mrr: 27000, setup: 3500, spot: 4500 },
  { month: "Jan", mrr: 30000, setup: 4000, spot: 4000 },
  { month: "Fev", mrr: 33000, setup: 3000, spot: 4000 },
  { month: "Mar", mrr: 35500, setup: 5000, spot: 2300 },
];

const projectionData = [
  { month: "Abr", atual: 42800, projetado: 42800 },
  { month: "Mai", atual: 0, projetado: 47200 },
  { month: "Jun", atual: 0, projetado: 51000 },
];

const clientPerformance = [
  { name: "Silva Adv", leads: 85, cpl: 49, cliques: 2400 },
  { name: "Clínica Bella", leads: 120, cpl: 47, cliques: 3800 },
  { name: "TechShop", leads: 320, cpl: 38, cliques: 8500 },
];

// ─── CLIENT VIEW ───
function ClientDashboard() {
  const totalLeads = 85;
  const cpl = 49.41;
  const cliques = 2400;
  const evolution = [
    { sem: "Sem 1", leads: 18 }, { sem: "Sem 2", leads: 22 },
    { sem: "Sem 3", leads: 25 }, { sem: "Sem 4", leads: 20 },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Resultados</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe a performance das suas campanhas</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Users className="h-4 w-4 text-primary" /></div><p className="text-3xl font-bold">{totalLeads}</p><p className="text-xs text-muted-foreground mt-1">Leads Gerados</p></div>
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2"><DollarSign className="h-4 w-4 text-info" /></div><p className="text-3xl font-bold">R$ {cpl.toFixed(2)}</p><p className="text-xs text-muted-foreground mt-1">Custo por Lead</p></div>
        <div className="metric-card"><div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><MousePointer className="h-4 w-4 text-success" /></div><p className="text-3xl font-bold">{cliques.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-1">Cliques</p></div>
      </div>
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Evolução de Leads</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolution}>
              <defs><linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="sem" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
              <Area type="monotone" dataKey="leads" stroke="hsl(17, 100%, 58%)" strokeWidth={2} fill="url(#leadGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── COLABORADOR (GESTOR) VIEW ───
function GestorDashboard() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Gestor</h1>
        <p className="text-sm text-muted-foreground mt-1">Métricas avançadas de campanhas</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "CPL Médio", value: "R$ 44.70", icon: DollarSign, color: "primary" },
          { label: "CTR", value: "2.3%", icon: MousePointer, color: "info" },
          { label: "CPM", value: "R$ 18.50", icon: BarChart3, color: "warning" },
          { label: "Frequência", value: "2.4", icon: Repeat, color: "success" },
          { label: "Leads Total", value: "525", icon: Users, color: "primary" },
          { label: "Orçamento", value: "78%", icon: Target, color: "chart-5" },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <m.icon className={`h-4 w-4 text-${m.color} mb-1`} />
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Performance por Cliente</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientPerformance}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="leads" name="Leads" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cliques" name="Cliques" fill="hsl(200, 70%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ───
function AdminDashboard() {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const mrrTotal = 35500; const setupTotal = 5000; const spotTotal = 2300;
  const faturamentoAtual = mrrTotal + setupTotal + spotTotal;
  const metaMes = 55000;
  const projecao = faturamentoAtual + 3200;
  const tcv = mrrTotal * 12 + setupTotal + spotTotal;
  const pctMeta = Math.round((faturamentoAtual / metaMes) * 100);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão estratégica da operação</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Faturamento Atual", value: `R$ ${faturamentoAtual.toLocaleString()}`, sub: `${pctMeta}% da meta`, icon: DollarSign },
          { label: "Meta do Mês", value: `R$ ${metaMes.toLocaleString()}`, sub: "Manual", icon: Target },
          { label: "Projeção", value: `R$ ${projecao.toLocaleString()}`, sub: "MRR+Setup+Spot", icon: TrendingUp },
          { label: "MRR", value: `R$ ${mrrTotal.toLocaleString()}`, sub: "Recorrência", icon: Repeat },
          { label: "Pontuais", value: `R$ ${spotTotal.toLocaleString()}`, sub: "LPs/Serviços", icon: Zap },
          { label: "Setup Fees", value: `R$ ${setupTotal.toLocaleString()}`, sub: "Implementações", icon: Receipt },
        ].map(m => (
          <div key={m.label} className="metric-card animate-fade-in">
            <m.icon className="h-4 w-4 text-primary mb-1" />
            <p className="text-xl font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
            <p className="text-[10px] text-muted-foreground/70">{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="metric-card flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">TCV — Total Contract Value</p>
          <p className="text-3xl font-bold mt-1">R$ {tcv.toLocaleString()}</p>
        </div>
        <p className="text-xs text-muted-foreground">MRR anualizado + Setup + Spot</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Receita (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBreakdown}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={v => `${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="mrr" name="MRR" stackId="a" fill="hsl(17, 100%, 58%)" />
                <Bar dataKey="setup" name="Setup" stackId="a" fill="hsl(200, 70%, 50%)" />
                <Bar dataKey="spot" name="Spot" stackId="a" fill="hsl(340, 65%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Projeção</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs><linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={v => `${v / 1000}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="projetado" stroke="hsl(17, 100%, 58%)" strokeWidth={2} fillOpacity={1} fill="url(#colorProj)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { role, colaboradorType } = useRole();
  if (role === "cliente") return <ClientDashboard />;
  if (role === "colaborador") return <GestorDashboard />;
  return <AdminDashboard />;
};

export default Dashboard;
