import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const revenueProjection = [
  { month: "Abr", atual: 42000, projetado: 42000 },
  { month: "Mai", atual: 0, projetado: 45500 },
  { month: "Jun", atual: 0, projetado: 48000 },
  { month: "Jul", atual: 0, projetado: 52000 },
  { month: "Ago", atual: 0, projetado: 55000 },
  { month: "Set", atual: 0, projetado: 58500 },
];

const healthData = [
  { name: "Tickets Abertos", value: 12 },
  { name: "Em Andamento", value: 8 },
  { name: "Concluídos", value: 34 },
];

const metrics = [
  {
    label: "MRR",
    value: "R$ 42.800",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    description: "vs. mês anterior",
  },
  {
    label: "Churn Rate",
    value: "2.1%",
    change: "-0.8%",
    trend: "down" as const,
    icon: Users,
    description: "vs. mês anterior",
  },
  {
    label: "Margem Média",
    value: "68%",
    change: "+3.2%",
    trend: "up" as const,
    icon: BarChart3,
    description: "por projeto",
  },
  {
    label: "CAC",
    value: "R$ 380",
    change: "-15%",
    trend: "down" as const,
    icon: ArrowUpRight,
    description: "custo de aquisição",
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Executivo</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da operação Zaytan</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <m.icon className="h-4 w-4 text-primary" />
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  m.label === "Churn Rate" || m.label === "CAC"
                    ? m.trend === "down"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                    : m.trend === "up"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {m.change}
              </span>
            </div>
            <p className="text-2xl font-bold">{m.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{m.label} · {m.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="metric-card lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h3 className="text-sm font-semibold mb-4">Projeção de Faturamento (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueProjection}>
                <defs>
                  <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 18%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 55%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 55%)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(225, 22%, 11%)",
                    border: "1px solid hsl(225, 15%, 18%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                />
                <Area
                  type="monotone"
                  dataKey="projetado"
                  stroke="hsl(152, 60%, 45%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProjetado)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Indicator */}
        <div className="metric-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-sm font-semibold mb-4">Saúde da Operação</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm">Tickets Abertos</span>
              </div>
              <span className="text-lg font-bold text-warning">12</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-info/10">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-info" />
                <span className="text-sm">Em Andamento</span>
              </div>
              <span className="text-lg font-bold text-info">8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-success/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-sm">Concluídos</span>
              </div>
              <span className="text-lg font-bold text-success">34</span>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Taxa de Conclusão</span>
                <span className="text-xs font-semibold text-success">63%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "63%" }} />
              </div>
            </div>
          </div>

          <div className="mt-6 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData}>
                <Bar dataKey="value" fill="hsl(152, 60%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
