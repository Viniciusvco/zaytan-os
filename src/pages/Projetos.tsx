import { CheckCircle2, Clock, AlertCircle, FolderOpen, Plus, MoreHorizontal } from "lucide-react";

interface Project {
  id: string;
  name: string;
  client: string;
  pillar: string;
  status: "em_andamento" | "concluido" | "atrasado";
  progress: number;
  deadline: string;
  tasks: string[];
}

const projects: Project[] = [
  { id: "1", name: "Funil WhatsApp + IA", client: "Escritório Silva", pillar: "Automação/IA", status: "em_andamento", progress: 65, deadline: "15 Abr", tasks: ["Configurar N8N", "Treinar modelo GPT", "Testar fluxo"] },
  { id: "2", name: "Pack LP + Tráfego", client: "Clínica Bella", pillar: "Tráfego/LPs", status: "em_andamento", progress: 40, deadline: "20 Abr", tasks: ["Design LP", "Copy", "Configurar Meta Ads"] },
  { id: "3", name: "Onboarding Completo", client: "Imobiliária Nova Era", pillar: "Automação/IA", status: "atrasado", progress: 15, deadline: "08 Abr", tasks: ["Coletar acessos", "Mapear processos", "Setup CRM"] },
  { id: "4", name: "Chatbot Vendas", client: "Construtora Horizonte", pillar: "Automação/IA", status: "em_andamento", progress: 20, deadline: "30 Abr", tasks: ["Script conversacional", "Integrar API", "Treinar base"] },
  { id: "5", name: "Campanha Google Ads", client: "TechShop", pillar: "Tráfego/LPs", status: "concluido", progress: 100, deadline: "01 Abr", tasks: [] },
];

const statusMap = {
  em_andamento: { label: "Em Andamento", icon: Clock, className: "bg-info/10 text-info" },
  concluido: { label: "Concluído", icon: CheckCircle2, className: "bg-success/10 text-success" },
  atrasado: { label: "Atrasado", icon: AlertCircle, className: "bg-destructive/10 text-destructive" },
};

const Projetos = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe entregas e prazos</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => {
          const st = statusMap[project.status];
          const StIcon = st.icon;
          return (
            <div key={project.id} className="metric-card animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{project.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{project.client}</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${st.className}`}>
                  <StIcon className="h-3 w-3" /> {st.label}
                </span>
                <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{project.pillar}</span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${project.status === "atrasado" ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {project.tasks.length > 0 && (
                <div className="space-y-1.5 border-t border-border pt-3">
                  {project.tasks.slice(0, 3).map((task, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-3.5 w-3.5 rounded border border-border shrink-0" />
                      {task}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Prazo: {project.deadline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projetos;
