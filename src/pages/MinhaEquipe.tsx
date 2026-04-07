import { Users, BarChart3 } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  initials: string;
  photo?: string;
  tasksCompleted: number;
  totalTasks: number;
  avgDeliveryDays: number;
}

const allocatedTeam: TeamMember[] = [
  { name: "João Silva", role: "Gestor de Tráfego", initials: "JS", tasksCompleted: 18, totalTasks: 24, avgDeliveryDays: 2.3 },
  { name: "Maria Santos", role: "CS / Atendimento", initials: "MS", tasksCompleted: 28, totalTasks: 32, avgDeliveryDays: 1.8 },
  { name: "Pedro Costa", role: "Designer", initials: "PC", tasksCompleted: 14, totalTasks: 18, avgDeliveryDays: 3.1 },
];

const MinhaEquipe = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Minha Equipe
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Membros da Zaytan alocados para você</p>
      </div>

      <div className="space-y-3">
        {allocatedTeam.map(m => {
          const completion = m.totalTasks > 0 ? Math.round((m.tasksCompleted / m.totalTasks) * 100) : 0;
          return (
            <div key={m.name} className="metric-card flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {m.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold">{m.name}</h4>
                <p className="text-xs text-muted-foreground">{m.role}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold">{completion}%</p>
                  <p className="text-[10px] text-muted-foreground">Conclusão</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{m.avgDeliveryDays.toFixed(1)}d</p>
                  <p className="text-[10px] text-muted-foreground">Tempo Médio</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{m.tasksCompleted}/{m.totalTasks}</p>
                  <p className="text-[10px] text-muted-foreground">Tarefas</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Resumo da Equipe
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{allocatedTeam.length}</p>
            <p className="text-[10px] text-muted-foreground">Membros</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{Math.round(allocatedTeam.reduce((s, m) => s + (m.tasksCompleted / m.totalTasks * 100), 0) / allocatedTeam.length)}%</p>
            <p className="text-[10px] text-muted-foreground">Conclusão Média</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{(allocatedTeam.reduce((s, m) => s + m.avgDeliveryDays, 0) / allocatedTeam.length).toFixed(1)}d</p>
            <p className="text-[10px] text-muted-foreground">Tempo Médio</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MinhaEquipe;
