import { ComingSoon } from "@/components/ComingSoon";
import { useRole } from "@/contexts/RoleContext";
import { GraduationCap, PlayCircle, BookOpen, FileText, CheckCircle2, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const mockTrilhas = [
  { id: 1, title: "Como usar o Dashboard", duration: "12 min", progress: 100, locked: false },
  { id: 2, title: "Como abrir solicitações", duration: "8 min", progress: 45, locked: false },
  { id: 3, title: "Como usar o CRM", duration: "15 min", progress: 0, locked: false },
  { id: 4, title: "Boas práticas de Feedback", duration: "10 min", progress: 0, locked: true },
];

const mockSOPs = [
  { id: 1, title: "Manual de Onboarding", type: "PDF", read: true },
  { id: 2, title: "Processo de Atendimento ao Cliente", type: "Link", read: false },
  { id: 3, title: "Nomenclatura de Campanhas", type: "PDF", read: false },
];

const Academy = () => {
  const { role } = useRole();
  const isColaborador = role === "colaborador";

  return (
    <ComingSoon>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Treinamentos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isColaborador ? "Complete os treinamentos para desbloquear o acesso" : "Trilhas de treinamento e base de conhecimento"}
          </p>
        </div>

        {/* Trilhas de Vídeo */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" /> Trilhas de Treinamento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockTrilhas.map(t => (
              <div key={t.id} className="metric-card relative">
                {t.locked && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm font-medium">{t.title}</span>
                  </div>
                  {t.progress === 100 && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{t.duration}</p>
                <Progress value={t.progress} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">{t.progress}% concluído</p>
              </div>
            ))}
          </div>
        </div>

        {/* SOPs */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Base de Conhecimento (SOPs)
          </h3>
          <div className="space-y-2">
            {mockSOPs.map(s => (
              <div key={s.id} className="metric-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">{s.type}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.read ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  {s.read ? "Lido" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prova (Colaborador) */}
        {isColaborador && (
          <div className="metric-card border-primary/20">
            <h3 className="text-sm font-semibold mb-2">📝 Avaliação Obrigatória</h3>
            <p className="text-xs text-muted-foreground mb-3">Complete todas as trilhas e alcance nota mínima de 70% para desbloquear o acesso a clientes reais.</p>
            <div className="flex items-center gap-3">
              <div className="h-9 px-4 rounded-lg bg-muted flex items-center text-sm text-muted-foreground">
                <Lock className="h-3.5 w-3.5 mr-2" /> Iniciar Prova
              </div>
              <span className="text-[10px] text-muted-foreground">Requer 100% das trilhas</span>
            </div>
          </div>
        )}
      </div>
    </ComingSoon>
  );
};

export default Academy;
