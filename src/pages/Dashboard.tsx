import { useState } from "react";
import { useRole, mockPayments } from "@/contexts/RoleContext";
import {
  DollarSign, TrendingUp, Target, Repeat, Zap, Users, MousePointer, BarChart3,
  AlertTriangle, CheckCircle2, Clock, Rocket, ArrowUp, ArrowDown,
  Package, Kanban, Receipt,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell,
} from "recharts";
import { DateRangeFilter, useDefaultDateRange } from "@/components/DateRangeFilter";
import { Progress } from "@/components/ui/progress";

// ─── MOCK DATA ───
const revenueBreakdown = [
  { month: "Out", mrr: 22000, setup: 4000, spot: 2000 },
  { month: "Nov", mrr: 25000, setup: 5000, spot: 2500 },
  { month: "Dez", mrr: 27000, setup: 3500, spot: 4500 },
  { month: "Jan", mrr: 30000, setup: 4000, spot: 4000 },
  { month: "Fev", mrr: 33000, setup: 3000, spot: 4000 },
  { month: "Mar", mrr: 35500, setup: 5000, spot: 2300 },
];

const clientsOverview = [
  { name: "Escritório Silva", status: "ativo", mrr: 3500, onboarding: false },
  { name: "Clínica Bella", status: "ativo", mrr: 5600, onboarding: false },
  { name: "Imobiliária Nova Era", status: "ativo", mrr: 6200, onboarding: false },
  { name: "TechShop", status: "ativo", mrr: 12000, onboarding: false },
  { name: "Construtora Horizonte", status: "ativo", mrr: 3800, onboarding: false },
  { name: "Studio Fitness", status: "onboarding", mrr: 2500, onboarding: true },
  { name: "Farmácia Vida", status: "onboarding", mrr: 3000, onboarding: true },
];

const contractsOverview = [
  { client: "Escritório Silva", status: "ativo", valor: 3500, vencimento: "2026-05-01", diasRestantes: 25 },
  { client: "Clínica Bella", status: "ativo", valor: 5600, vencimento: "2026-04-15", diasRestantes: 9 },
  { client: "TechShop", status: "ativo", valor: 12000, vencimento: "2026-06-01", diasRestantes: 56 },
  { client: "Construtora Horizonte", status: "ativo", valor: 3800, vencimento: "2026-04-10", diasRestantes: 4 },
];

const leadQualityData = [
  { name: "Sem Interesse", value: 35 },
  { name: "Não Atende", value: 25 },
  { name: "Concorrente", value: 20 },
  { name: "Sem Perfil", value: 15 },
  { name: "Dados Incorretos", value: 5 },
];
const QUAL_COLORS = ["hsl(0, 72%, 51%)", "hsl(35, 90%, 55%)", "hsl(262, 60%, 55%)", "hsl(200, 70%, 50%)", "hsl(152, 60%, 42%)"];

// ─── CLIENT VIEW ───
function ClientDashboard({ onboardingComplete }: { onboardingComplete: boolean }) {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const totalLeads = 85;
  const prevLeads = 72;
  const cpl = 49.41;
  const prevCpl = 54.20;
  const cliques = 2400;
  const prevCliques = 2100;
  const faturamento = 42500;
  const ticketMedio = 4200;
  const evolution = [
    { sem: "Sem 1", leads: 18, anterior: 15 },
    { sem: "Sem 2", leads: 22, anterior: 19 },
    { sem: "Sem 3", leads: 25, anterior: 20 },
    { sem: "Sem 4", leads: 20, anterior: 18 },
  ];

  const trend = (curr: number, prev: number) => {
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct >= 0
      ? { icon: ArrowUp, color: "text-success", text: `+${pct}%` }
      : { icon: ArrowDown, color: "text-destructive", text: `${pct}%` };
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {!onboardingComplete && (
        <div className="metric-card border-primary/30 bg-primary/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Complete seu Onboarding</h3>
              <p className="text-xs text-muted-foreground">Finalize a configuração para começar</p>
            </div>
          </div>
          <Progress value={30} className="h-2 mb-2" />
          <p className="text-[10px] text-muted-foreground">3 de 7 etapas concluídas</p>
          <a href="/onboarding" className="text-xs text-primary font-medium hover:underline mt-2 inline-block">Continuar Onboarding →</a>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus Resultados</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe a performance das suas campanhas</p>
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Leads Gerados", value: totalLeads, prev: prevLeads, icon: Users, format: (v: number) => v.toString() },
          { label: "Custo por Lead", value: cpl, prev: prevCpl, icon: DollarSign, format: (v: number) => `R$ ${v.toFixed(2)}` },
          { label: "Cliques", value: cliques, prev: prevCliques, icon: MousePointer, format: (v: number) => v.toLocaleString() },
          { label: "Faturamento", value: faturamento, prev: faturamento * 0.9, icon: Receipt, format: (v: number) => `R$ ${(v / 1000).toFixed(1)}k` },
          { label: "Ticket Médio", value: ticketMedio, prev: ticketMedio * 0.95, icon: Target, format: (v: number) => `R$ ${v.toLocaleString()}` },
        ].map(m => {
          const t = trend(m.value, m.prev);
          const TrendIcon = t.icon;
          return (
            <div key={m.label} className="metric-card">
              <m.icon className="h-4 w-4 text-primary mb-1" />
              <p className="text-2xl font-bold">{m.format(m.value)}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <span className={`text-[10px] ${t.color} flex items-center gap-0.5 font-medium`}>
                  <TrendIcon className="h-3 w-3" /> {t.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Steps card */}
      <div className="metric-card border-primary/20">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" /> Próximos Passos
        </h3>
        <ul className="space-y-1.5">
          <li className="text-xs text-muted-foreground flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-success" />Campanha de Páscoa aprovada e no ar</li>
          <li className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-warning" />Aguardando aprovação do criativo novo</li>
          <li className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Reunião mensal agendada para 10/04</li>
        </ul>
      </div>

      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Evolução de Leads (vs Semana Anterior)</h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(17, 100%, 58%)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="sem" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area type="monotone" dataKey="anterior" name="Sem. Anterior" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
              <Area type="monotone" dataKey="leads" name="Atual" stroke="hsl(17, 100%, 58%)" strokeWidth={2} fill="url(#leadGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── COLABORADOR VIEWS ───
function GestorDashboard() {
  const campaigns = [
    { client: "Construtora Horizonte", cpl: 135.71, ctr: 0.8, budget: 95, status: "critico" as const },
    { client: "Imobiliária Nova Era", cpl: 137.78, ctr: 0.9, budget: 103, status: "critico" as const },
    { client: "Escritório Silva", cpl: 49.41, ctr: 2.1, budget: 84, status: "atencao" as const },
    { client: "Clínica Bella", cpl: 46.67, ctr: 2.5, budget: 93, status: "saudavel" as const },
    { client: "TechShop", cpl: 37.50, ctr: 3.2, budget: 80, status: "saudavel" as const },
  ];
  const statusConfig = {
    critico: { label: "Crítico", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
    atencao: { label: "Atenção", className: "bg-warning/10 text-warning", icon: Clock },
    saudavel: { label: "Saudável", className: "bg-success/10 text-success", icon: CheckCircle2 },
  };
  return (
    <div className="space-y-6 max-w-6xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Ranking de Performance</h1><p className="text-sm text-muted-foreground mt-1">Clientes ordenados por criticidade</p></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "CPL Médio", value: "R$ 81.41" }, { label: "CTR Médio", value: "1.9%" },
          { label: "Clientes Críticos", value: "2" }, { label: "Budget Médio", value: "91%" },
        ].map(m => <div key={m.label} className="metric-card"><p className="text-xl font-bold">{m.value}</p><p className="text-[10px] text-muted-foreground">{m.label}</p></div>)}
      </div>
      <div className="metric-card">
        <table className="w-full">
          <thead><tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">CPL</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">CTR</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Budget</th>
            <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
          </tr></thead>
          <tbody>
            {campaigns.map(c => {
              const s = statusConfig[c.status];
              const SIcon = s.icon;
              return (
                <tr key={c.client} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-3 text-sm font-medium">{c.client}</td>
                  <td className="py-3 text-right text-sm">R$ {c.cpl.toFixed(2)}</td>
                  <td className="py-3 text-right text-sm">{c.ctr}%</td>
                  <td className="py-3 text-right text-sm">{c.budget}%</td>
                  <td className="py-3 text-right"><span className={`text-[10px] px-2 py-0.5 rounded-full ${s.className} inline-flex items-center gap-1`}><SIcon className="h-3 w-3" />{s.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesignerDashboard() {
  const tasks = [
    { title: "LP Imobiliária Nova Era", sla: 1, status: "warning" },
    { title: "Criativos Páscoa Clínica Bella", sla: 3, status: "success" },
    { title: "Vídeo TechShop", sla: 0, status: "destructive" },
    { title: "Banner Construtora Horizonte", sla: 5, status: "success" },
  ];
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Minhas Tarefas</h1><p className="text-sm text-muted-foreground mt-1">Organizado por prazo (SLA)</p></div>
      <div className="space-y-2">
        {tasks.sort((a, b) => a.sla - b.sla).map(t => (
          <div key={t.title} className={`metric-card flex items-center justify-between border-${t.status}/30`}>
            <div>
              <h4 className="text-sm font-medium">{t.title}</h4>
              <p className="text-[10px] text-muted-foreground">Design</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full bg-${t.status}/10 text-${t.status} font-medium`}>
              {t.sla <= 0 ? "Atrasado" : `${t.sla}d restante`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CSDashboard() {
  const alerts = [
    { client: "Escritório Silva", type: "Feedback baixo (nota 2)", level: "critico" as const },
    { client: "Construtora Horizonte", type: "Contrato vencendo em 4d", level: "atencao" as const },
    { client: "Studio Fitness", type: "Onboarding pendente", level: "info" as const },
    { client: "Farmácia Vida", type: "Onboarding pendente", level: "info" as const },
  ];
  const levelConfig = {
    critico: { className: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle },
    atencao: { className: "bg-warning/10 text-warning border-warning/30", icon: Clock },
    info: { className: "bg-info/10 text-info border-info/30", icon: Rocket },
  };
  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold tracking-tight">Alertas de CS</h1><p className="text-sm text-muted-foreground mt-1">Feedbacks, onboarding e contratos</p></div>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const cfg = levelConfig[a.level];
          const Icon = cfg.icon;
          return (
            <div key={i} className={`metric-card flex items-center gap-3 ${cfg.className}`}>
              <Icon className="h-5 w-5 shrink-0" />
              <div>
                <h4 className="text-sm font-medium">{a.client}</h4>
                <p className="text-xs opacity-80">{a.type}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ADMIN MASTER DASHBOARD ───
function AdminDashboard() {
  const [dateRange, setDateRange] = useState(useDefaultDateRange());
  const [tab, setTab] = useState<"geral" | "financeiro" | "clientes" | "contratos" | "pagamentos">("geral");

  const mrrTotal = 35500; const ltvMedio = 42600; const churnRate = 4.2;
  const onboardingCount = clientsOverview.filter(c => c.onboarding).length;
  const faturamentoAtual = 42800; const metaMes = 55000;
  const pctMeta = Math.round((faturamentoAtual / metaMes) * 100);
  const totalFuncionarios = 4;
  const totalTasksPendentes = 12;
  const totalProdutos = 5;

  const inadimplentes = mockPayments.filter(p => p.status === "inadimplente");
  const custoInadimplencia = inadimplentes.reduce((s, p) => s + p.amount, 0);

  const paymentStatusConfig = {
    em_dia: { label: "Em dia", className: "bg-success/10 text-success" },
    atrasado: { label: "Atrasado", className: "bg-warning/10 text-warning" },
    inadimplente: { label: "Inadimplente", className: "bg-destructive/10 text-destructive" },
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Dashboard Mestre</h1><p className="text-sm text-muted-foreground mt-1">Saúde da operação</p></div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: "MRR Total", value: `R$ ${mrrTotal.toLocaleString()}`, icon: Repeat, color: "primary" },
          { label: "LTV Médio", value: `R$ ${ltvMedio.toLocaleString()}`, icon: TrendingUp, color: "success" },
          { label: "Churn Rate", value: `${churnRate}%`, icon: AlertTriangle, color: "destructive" },
          { label: "Em Onboarding", value: onboardingCount.toString(), icon: Rocket, color: "info" },
          { label: "Funcionários", value: totalFuncionarios.toString(), icon: Users, color: "primary" },
          { label: "Tasks Pendentes", value: totalTasksPendentes.toString(), icon: Kanban, color: "warning" },
          { label: "Produtos", value: totalProdutos.toString(), icon: Package, color: "info" },
          { label: "Inadimplência", value: `R$ ${custoInadimplencia.toLocaleString()}`, icon: AlertTriangle, color: "destructive" },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <m.icon className={`h-4 w-4 text-${m.color} mb-1`} />
            <p className="text-lg font-bold">{m.value}</p>
            <p className="text-[10px] text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit flex-wrap">
        {([
          { key: "geral", label: "Visão Geral" },
          { key: "financeiro", label: "Financeiro" },
          { key: "clientes", label: "Clientes" },
          { key: "contratos", label: "Contratos" },
          { key: "pagamentos", label: "Pagamentos" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "geral" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Meta do Mês</h3>
              <span className={`text-xs font-bold ${pctMeta >= 80 ? "text-success" : "text-warning"}`}>{pctMeta}%</span>
            </div>
            <Progress value={pctMeta} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">R$ {faturamentoAtual.toLocaleString()} de R$ {metaMes.toLocaleString()}</p>
          </div>
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-4">Receita (6 meses)</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={v => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="mrr" name="MRR" stackId="a" fill="hsl(17, 100%, 58%)" />
                  <Bar dataKey="setup" name="Setup" stackId="a" fill="hsl(200, 70%, 50%)" />
                  <Bar dataKey="spot" name="Spot" stackId="a" fill="hsl(340, 65%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Lead Quality Chart */}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Qualidade de Leads (Motivos de Perda)</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadQualityData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {leadQualityData.map((_, i) => <Cell key={i} fill={QUAL_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1 mt-2">
              {leadQualityData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: QUAL_COLORS[i] }} /><span className="text-muted-foreground">{d.name}</span></div>
                  <span className="font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Performance Summary */}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Performance Geral da Agência</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "CPL Médio", value: "R$ 81.41" },
                { label: "CTR Médio", value: "1.9%" },
                { label: "Taxa de Conversão", value: "16.7%" },
                { label: "Leads Totais (mês)", value: "340" },
              ].map(m => (
                <div key={m.label} className="bg-muted/50 rounded-lg p-3">
                  <p className="text-lg font-bold">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "financeiro" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Faturamento Atual", value: `R$ ${faturamentoAtual.toLocaleString()}`, icon: DollarSign },
            { label: "Meta do Mês", value: `R$ ${metaMes.toLocaleString()}`, icon: Target },
            { label: "MRR", value: `R$ ${mrrTotal.toLocaleString()}`, icon: Repeat },
            { label: "Setup Fees", value: "R$ 5.000", icon: Receipt },
            { label: "Pontuais", value: "R$ 2.300", icon: Zap },
            { label: "% Meta", value: `${pctMeta}%`, icon: BarChart3 },
          ].map(m => (
            <div key={m.label} className="metric-card">
              <m.icon className="h-4 w-4 text-primary mb-1" />
              <p className="text-xl font-bold">{m.value}</p>
              <p className="text-[10px] text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "clientes" && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-3">Todos os Clientes</h3>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">MRR</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
            </tr></thead>
            <tbody>
              {clientsOverview.map(c => (
                <tr key={c.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 text-sm font-medium">{c.name}</td>
                  <td className="py-2.5 text-right text-sm">R$ {c.mrr.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.onboarding ? "bg-info/10 text-info" : "bg-success/10 text-success"}`}>
                      {c.onboarding ? "Onboarding" : "Ativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "contratos" && (
        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-3">Contratos & Vencimentos</h3>
          <table className="w-full">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Vencimento</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
            </tr></thead>
            <tbody>
              {contractsOverview.map(c => (
                <tr key={c.client} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 text-sm font-medium">{c.client}</td>
                  <td className="py-2.5 text-right text-sm">R$ {c.valor.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-xs text-muted-foreground">{new Date(c.vencimento).toLocaleDateString("pt-BR")}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.diasRestantes <= 30 ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                      {c.diasRestantes <= 30 ? `⚠ ${c.diasRestantes}d` : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "pagamentos" && (
        <div className="space-y-4">
          {custoInadimplencia > 0 && (
            <div className="metric-card border-destructive/30 bg-destructive/5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="text-sm font-bold text-destructive">Custo de Inadimplência</h3>
                  <p className="text-2xl font-bold text-destructive">R$ {custoInadimplencia.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{inadimplentes.length} cliente(s) inadimplente(s)</p>
                </div>
              </div>
            </div>
          )}
          <div className="metric-card">
            <h3 className="text-sm font-semibold mb-3">Status de Pagamento por Cliente</h3>
            <table className="w-full">
              <thead><tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Vencimento</th>
                <th className="text-right text-xs font-medium text-muted-foreground pb-2">Status</th>
              </tr></thead>
              <tbody>
                {mockPayments.map(p => {
                  const cfg = paymentStatusConfig[p.status];
                  return (
                    <tr key={p.clientName} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 text-sm font-medium">{p.clientName}</td>
                      <td className="py-2.5 text-right text-sm">R$ {p.amount.toLocaleString()}</td>
                      <td className="py-2.5 text-right text-xs text-muted-foreground">{new Date(p.dueDate).toLocaleDateString("pt-BR")}</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.className}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const Dashboard = () => {
  const { role, colaboradorType, onboardingComplete } = useRole();
  if (role === "cliente") return <ClientDashboard onboardingComplete={onboardingComplete} />;
  if (role === "colaborador") {
    if (colaboradorType === "gestor") return <GestorDashboard />;
    if (colaboradorType === "designer") return <DesignerDashboard />;
    return <CSDashboard />;
  }
  return <AdminDashboard />;
};

export default Dashboard;
