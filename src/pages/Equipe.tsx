import { ComingSoon } from "@/components/ComingSoon";
import { Users, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  tasks: number;
  completed: number;
  avgDeliveryDays: number;
  lateCount: number;
  byType: { trafego: number; design: number; suporte: number };
}

const teamData: TeamMember[] = [
  { id: "1", name: "João Silva", role: "Gestor de Tráfego", initials: "JS", tasks: 24, completed: 18, avgDeliveryDays: 2.3, lateCount: 2, byType: { trafego: 15, design: 0, suporte: 3 } },
  { id: "2", name: "Maria Santos", role: "Atendimento", initials: "MS", tasks: 32, completed: 28, avgDeliveryDays: 1.8, lateCount: 1, byType: { trafego: 0, design: 0, suporte: 28 } },
  { id: "3", name: "Pedro Costa", role: "Designer", initials: "PC", tasks: 18, completed: 14, avgDeliveryDays: 3.1, lateCount: 4, byType: { trafego: 0, design: 14, suporte: 0 } },
  { id: "4", name: "Ana Oliveira", role: "Editor", initials: "AO", tasks: 15, completed: 13, avgDeliveryDays: 2.0, lateCount: 0, byType: { trafego: 0, design: 8, suporte: 5 } },
];

const chartData = teamData.map(m => ({
  name: m.initials,
  Tarefas: m.tasks,
  Concluídas: m.completed,
  Atrasadas: m.lateCount,
}));

const Equipe = () => {
  return (
    <ComingSoon>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipe — PDI</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance individual dos colaboradores</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="metric-card"><Users className="h-4 w-4 text-primary mb-1" /><p className="text-2xl font-bold">{teamData.length}</p><p className="text-xs text-muted-foreground">Colaboradores</p></div>
          <div className="metric-card"><CheckCircle2 className="h-4 w-4 text-success mb-1" /><p className="text-2xl font-bold">{teamData.reduce((s, m) => s + m.completed, 0)}</p><p className="text-xs text-muted-foreground">Tarefas Concluídas</p></div>
          <div className="metric-card"><Clock className="h-4 w-4 text-info mb-1" /><p className="text-2xl font-bold">{(teamData.reduce((s, m) => s + m.avgDeliveryDays, 0) / teamData.length).toFixed(1)}d</p><p className="text-xs text-muted-foreground">Tempo Médio</p></div>
          <div className="metric-card"><AlertTriangle className="h-4 w-4 text-warning mb-1" /><p className="text-2xl font-bold">{teamData.reduce((s, m) => s + m.lateCount, 0)}</p><p className="text-xs text-muted-foreground">Atrasos Total</p></div>
        </div>

        <div className="metric-card">
          <h3 className="text-sm font-semibold mb-4">Tarefas vs Conclusão por Colaborador</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--foreground))" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="Tarefas" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} opacity={0.3} />
                <Bar dataKey="Concluídas" fill="hsl(17, 100%, 58%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Atrasadas" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Colaborador</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Função</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Tarefas</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Concluídas</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Tempo Médio</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Atrasos</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Tráfego</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Design</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Suporte</th>
              </tr>
            </thead>
            <tbody>
              {teamData.map(m => {
                const completionRate = m.tasks > 0 ? Math.round((m.completed / m.tasks) * 100) : 0;
                return (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{m.initials}</div>
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{m.role}</td>
                    <td className="px-4 py-3 text-right text-sm">{m.tasks}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${completionRate >= 80 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{completionRate}%</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{m.avgDeliveryDays.toFixed(1)}d</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.lateCount === 0 ? "bg-success/10 text-success" : m.lateCount <= 2 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{m.lateCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{m.byType.trafego}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{m.byType.design}</td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">{m.byType.suporte}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ComingSoon>
  );
};

export default Equipe;
