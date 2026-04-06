import { useState } from "react";
import { useRole, ColaboradorSubtype } from "@/contexts/RoleContext";
import { GraduationCap, PlayCircle, CheckCircle2, Circle, BookOpen, FileText, ExternalLink, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TrainingItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  roles: ColaboradorSubtype[];
  mandatory: boolean;
}

interface SOPItem {
  id: string;
  title: string;
  category: string;
  link: string;
}

const trainingItems: TrainingItem[] = [
  // General
  { id: "g1", title: "Boas-vindas ao Zaytan OS", description: "Visão geral da plataforma e cultura da empresa", duration: "5 min", roles: ["gestor", "designer", "cs"], mandatory: true },
  { id: "g2", title: "Como usar o Kanban", description: "Gestão de demandas e fluxo de trabalho", duration: "8 min", roles: ["gestor", "designer", "cs"], mandatory: true },
  { id: "g3", title: "Chamados e SLA", description: "Como responder e gerenciar prazos", duration: "6 min", roles: ["gestor", "designer", "cs"], mandatory: true },
  // Gestor
  { id: "t1", title: "Padrão Zaytan de Tráfego", description: "Setup de conta, nomenclatura e estrutura de campanha", duration: "15 min", roles: ["gestor"], mandatory: true },
  { id: "t2", title: "Contingência de Contas", description: "Procedimentos de BM e perfis de contingência", duration: "10 min", roles: ["gestor"], mandatory: true },
  { id: "t3", title: "Escala de Campanhas", description: "Quando e como escalar orçamento", duration: "12 min", roles: ["gestor"], mandatory: false },
  { id: "t4", title: "Políticas do Meta Ads", description: "Regras de aprovação e restrições", duration: "8 min", roles: ["gestor"], mandatory: false },
  // Designer
  { id: "d1", title: "Criativos de Alta Conversão", description: "Framework de design para anúncios que vendem", duration: "12 min", roles: ["designer"], mandatory: true },
  { id: "d2", title: "Padrão de Nomenclatura de Arquivos", description: "[ZAYTAN] Cliente - Formato - Versão", duration: "5 min", roles: ["designer"], mandatory: true },
  { id: "d3", title: "Landing Pages que Convertem", description: "Estrutura, UX e velocidade", duration: "10 min", roles: ["designer"], mandatory: false },
  // CS
  { id: "c1", title: "Processo de Atendimento Zaytan", description: "Fluxo de comunicação com o cliente", duration: "10 min", roles: ["cs"], mandatory: true },
  { id: "c2", title: "Setup e Operação do CRM", description: "Como registrar e acompanhar leads", duration: "8 min", roles: ["cs"], mandatory: true },
  { id: "c3", title: "Gestão de Feedbacks", description: "Interpretação e ações sobre feedbacks do cliente", duration: "6 min", roles: ["cs"], mandatory: false },
];

const sopItems: SOPItem[] = [
  { id: "s1", title: "Manual de Onboarding de Clientes", category: "Operação", link: "#" },
  { id: "s2", title: "Checklist de Lançamento de Campanha", category: "Tráfego", link: "#" },
  { id: "s3", title: "Guia de Briefing de Design", category: "Design", link: "#" },
  { id: "s4", title: "Protocolo de Atendimento ao Cliente", category: "CS", link: "#" },
  { id: "s5", title: "Política de Contingência de BMs", category: "Tráfego", link: "#" },
  { id: "s6", title: "Template de Relatório Mensal", category: "Operação", link: "#" },
];

const Academy = () => {
  const { role, colaboradorType, trainingComplete, setTrainingComplete } = useRole();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [readSops, setReadSops] = useState<Set<string>>(new Set());

  const isAdmin = role === "admin";
  const relevantTrainings = isAdmin
    ? trainingItems
    : trainingItems.filter(t => t.roles.includes(colaboradorType));

  const mandatoryIds = relevantTrainings.filter(t => t.mandatory).map(t => t.id);
  const mandatoryComplete = mandatoryIds.every(id => completedIds.has(id));
  const progress = mandatoryIds.length > 0
    ? Math.round((mandatoryIds.filter(id => completedIds.has(id)).length / mandatoryIds.length) * 100)
    : 100;

  const toggleComplete = (id: string) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      const allMandatoryDone = mandatoryIds.every(mid => next.has(mid));
      setTrainingComplete(allMandatoryDone);
      return next;
    });
  };

  const toggleSopRead = (id: string) => {
    setReadSops(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Zaytan Academy
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? "Visão geral de todas as trilhas de treinamento" : `Trilha de ${colaboradorType === "gestor" ? "Gestor de Tráfego" : colaboradorType === "designer" ? "Designer" : "CS / Atendimento"}`}
        </p>
      </div>

      {/* Progress */}
      {!isAdmin && (
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Progresso Obrigatório</h3>
            <span className={`text-xs font-bold ${mandatoryComplete ? "text-success" : "text-primary"}`}>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {!mandatoryComplete && (
            <div className="flex items-center gap-2 mt-3 p-2 rounded-lg bg-warning/10">
              <Lock className="h-4 w-4 text-warning" />
              <p className="text-xs text-warning font-medium">Complete todos os treinamentos obrigatórios para acessar o sistema</p>
            </div>
          )}
        </div>
      )}

      {/* Training Trails */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-primary" /> Trilha de Treinamento
        </h3>
        <div className="space-y-2">
          {relevantTrainings.map(t => {
            const done = completedIds.has(t.id);
            return (
              <div key={t.id} className={`metric-card flex items-center gap-4 ${done ? "opacity-60" : ""}`}>
                <button onClick={() => toggleComplete(t.id)} className="shrink-0">
                  {done
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Circle className="h-5 w-5 text-muted-foreground/40" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm font-medium ${done ? "line-through" : ""}`}>{t.title}</h4>
                    {t.mandatory && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">Obrigatório</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{t.duration}</span>
                  {!isAdmin && (
                    <div className="flex gap-1">
                      {t.roles.map(r => (
                        <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          r === "gestor" ? "bg-info/10 text-info" : r === "designer" ? "bg-chart-3/10 text-chart-3" : "bg-success/10 text-success"
                        }`}>{r === "gestor" ? "Tráfego" : r === "designer" ? "Design" : "CS"}</span>
                      ))}
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex gap-1">
                      {t.roles.map(r => (
                        <span key={r} className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          r === "gestor" ? "bg-info/10 text-info" : r === "designer" ? "bg-chart-3/10 text-chart-3" : "bg-success/10 text-success"
                        }`}>{r === "gestor" ? "Tráfego" : r === "designer" ? "Design" : "CS"}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SOPs */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Base de Conhecimento (SOPs)
        </h3>
        <div className="space-y-2">
          {sopItems.map(s => {
            const isRead = readSops.has(s.id);
            return (
              <div key={s.id} className="metric-card flex items-center gap-4">
                <button onClick={() => toggleSopRead(s.id)} className="shrink-0">
                  {isRead
                    ? <CheckCircle2 className="h-5 w-5 text-success" />
                    : <Circle className="h-5 w-5 text-muted-foreground/40" />
                  }
                </button>
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium ${isRead ? "line-through opacity-60" : ""}`}>{s.title}</h4>
                  <span className="text-[10px] text-muted-foreground">{s.category}</span>
                </div>
                <a href={s.link} className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0">
                  <ExternalLink className="h-3.5 w-3.5" /> Abrir
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Academy;
