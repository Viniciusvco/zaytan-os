import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  "hsl(152, 60%, 45%)",
  "hsl(200, 70%, 55%)",
  "hsl(262, 60%, 60%)",
  "hsl(35, 90%, 60%)",
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

const Financeiro = () => {
  const totalReceita = 42800;
  const totalCustos = costs.reduce((s, c) => s + c.value, 0);
  const lucro = totalReceita - totalCustos;
  const margem = Math.round((lucro / totalReceita) * 100);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Controle de receitas, custos e lucratividade</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {totalReceita.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Receita Mensal</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {totalCustos.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Custos Totais</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold">R$ {lucro.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Lucro Líquido</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-bold">{margem}%</p>
          <p className="text-xs text-muted-foreground mt-1">Margem de Lucro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue vs Costs chart */}
        <div className="metric-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Receita vs Custos (6 meses)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 15%, 18%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 55%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 55%)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(225, 22%, 11%)", border: "1px solid hsl(225, 15%, 18%)", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, ""]}
                />
                <Bar dataKey="receita" fill="hsl(152, 60%, 45%)" radius={[4, 4, 0, 0]} name="Receita" />
                <Bar dataKey="custos" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} name="Custos" opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profitability by niche */}
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
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(225, 22%, 11%)", border: "1px solid hsl(225, 15%, 18%)", borderRadius: "8px", fontSize: "12px" }}
                />
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

      {/* Costs table */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4">Detalhamento de Custos</h3>
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
