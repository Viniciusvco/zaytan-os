import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Receipt, Repeat, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Out", receita: 28000, custos: 12000 },
  { month: "Nov", receita: 32000, custos: 13500 },
  { month: "Dez", receita: 35000, custos: 14000 },
  { month: "Jan", receita: 38000, custos: 14200 },
  { month: "Fev", receita: 40000, custos: 15000 },
  { month: "Mar", receita: 42800, custos: 14800 },
];

const nicheData = [
  { name: "Advocacia", value: 35, profit: 72 },
  { name: "Saúde/Estética", value: 25, profit: 65 },
  { name: "Imobiliário", value: 20, profit: 58 },
  { name: "E-commerce", value: 12, profit: 70 },
  { name: "Serviços", value: 8, profit: 55 },
];

const COLORS = [
  "hsl(17, 100%, 58%)",
  "hsl(200, 70%, 55%)",
  "hsl(262, 60%, 60%)",
  "hsl(152, 60%, 42%)",
  "hsl(340, 65%, 55%)",
];

const costs = [
  { name: "Ferramentas IA (GPT, Claude)", value: 2800, type: "fixo" },
  { name: "Meta Ads (Conta Agência)", value: 1200, type: "fixo" },
  { name: "N8N Cloud", value: 800, type: "fixo" },
  { name: "Freelancers", value: 4500, type: "variavel" },
  { name: "Hospedagem / Domínios", value: 600, type: "fixo" },
  { name: "APIs Externas", value: 1200, type: "variavel" },
];

const clientMargins = [
  { client: "Escritório Silva", mrr: 4500, oneOff: 0, costs: 1800, margin: 60 },
  { client: "Clínica Bella", mrr: 3200, oneOff: 1500, costs: 1400, margin: 66 },
  { client: "Imobiliária Nova Era", mrr: 6800, oneOff: 3000, costs: 3200, margin: 67 },
  { client: "TechShop", mrr: 5500, oneOff: 0, costs: 2100, margin: 62 },
  { client: "Construtora Horizonte", mrr: 8000, oneOff: 5000, costs: 4500, margin: 65 },
];

const Financeiro = () => {
  const mrrTotal = 42800;
  const oneOffTotal = 9500;
  const tcv = mrrTotal * 12 + oneOffTotal;
  const totalCustos = costs.reduce((s, c) => s + c.value, 0);
  const lucro = mrrTotal + oneOffTotal - totalCustos;
  const margem = Math.round((lucro / (mrrTotal + oneOffTotal)) * 100);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">Receitas, custos operacionais e margem real por cliente</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Repeat className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {mrrTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">MRR (Recorrência)</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {oneOffTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">One-offs (LPs, Setups)</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {tcv.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">TCV (Anual Projetado)</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {totalCustos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Custos Operacionais</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold">{margem}%</p>
          <p className="text-xs text-muted-foreground mt-1">Margem Real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="metric-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Receita vs Custos (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                />
                <Bar dataKey="receita" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="custos" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Custos" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Lucratividade por Nicho</h3>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={nicheData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={2}>
                  {nicheData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {nicheData.map((n, i) => (
              <div key={n.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{n.name}</span>
                </div>
                <span className="font-medium">{n.profit}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Margem Real por Cliente */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Margem Real por Cliente</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Cliente</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">MRR</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">One-off</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Custos (Equipe+Tools)</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Lucro</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Margem</th>
            </tr>
          </thead>
          <tbody>
            {clientMargins.map((c) => {
              const totalRev = c.mrr + c.oneOff;
              const profit = totalRev - c.costs;
              return (
                <tr key={c.client} className="border-b border-border last:border-0">
                  <td className="py-2.5 text-sm font-medium">{c.client}</td>
                  <td className="py-2.5 text-right text-sm">R$ {c.mrr.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-sm text-muted-foreground">{c.oneOff > 0 ? `R$ ${c.oneOff.toLocaleString()}` : "—"}</td>
                  <td className="py-2.5 text-right text-sm text-destructive">R$ {c.costs.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-sm font-semibold text-success">R$ {profit.toLocaleString()}</td>
                  <td className="py-2.5 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.margin >= 65 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{c.margin}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detalhamento de Custos */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Detalhamento de Custos Operacionais</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Item</th>
              <th className="text-left text-xs font-medium text-muted-foreground pb-2">Tipo</th>
              <th className="text-right text-xs font-medium text-muted-foreground pb-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((c) => (
              <tr key={c.name} className="border-b border-border last:border-0">
                <td className="py-2.5 text-sm">{c.name}</td>
                <td className="py-2.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.type === "fixo" ? "bg-info/10 text-info" : "bg-warning/10 text-warning"}`}>
                    {c.type === "fixo" ? "Fixo" : "Variável"}
                  </span>
                </td>
                <td className="py-2.5 text-right text-sm font-medium">R$ {c.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Financeiro;
