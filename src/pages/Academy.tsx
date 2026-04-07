import { useState } from "react";
import { useRole, ColaboradorSubtype } from "@/contexts/RoleContext";
import { GraduationCap, PlayCircle, CheckCircle2, Circle, BookOpen, FileText, ExternalLink, Lock, ClipboardCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrainingItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  roles: ("gestor" | "designer" | "cs" | "cliente")[];
  mandatory: boolean;
  hasQuiz?: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface SOPItem {
  id: string;
  title: string;
  category: string;
  link: string;
}

const trainingItems: TrainingItem[] = [
  // General (all colaboradores)
  { id: "g1", title: "Boas-vindas ao Zaytan OS", description: "Visão geral da plataforma e cultura da empresa", duration: "5 min", roles: ["gestor", "designer", "cs"], mandatory: true, hasQuiz: true },
  { id: "g2", title: "Como usar o Kanban", description: "Gestão de demandas e fluxo de trabalho", duration: "8 min", roles: ["gestor", "designer", "cs"], mandatory: true, hasQuiz: true },
  { id: "g3", title: "Chamados e SLA", description: "Como responder e gerenciar prazos", duration: "6 min", roles: ["gestor", "designer", "cs"], mandatory: true },
  // Gestor
  { id: "t1", title: "Padrão Zaytan de Tráfego", description: "Setup de conta, nomenclatura e estrutura de campanha", duration: "15 min", roles: ["gestor"], mandatory: true, hasQuiz: true },
  { id: "t2", title: "Contingência de Contas", description: "Procedimentos de BM e perfis de contingência", duration: "10 min", roles: ["gestor"], mandatory: true },
  { id: "t3", title: "Escala de Campanhas", description: "Quando e como escalar orçamento", duration: "12 min", roles: ["gestor"], mandatory: false },
  { id: "t4", title: "Políticas do Meta Ads", description: "Regras de aprovação e restrições", duration: "8 min", roles: ["gestor"], mandatory: false },
  // Designer
  { id: "d1", title: "Criativos de Alta Conversão", description: "Framework de design para anúncios que vendem", duration: "12 min", roles: ["designer"], mandatory: true, hasQuiz: true },
  { id: "d2", title: "Padrão de Nomenclatura de Arquivos", description: "[ZAYTAN] Cliente - Formato - Versão", duration: "5 min", roles: ["designer"], mandatory: true },
  { id: "d3", title: "Landing Pages que Convertem", description: "Estrutura, UX e velocidade", duration: "10 min", roles: ["designer"], mandatory: false },
  // CS
  { id: "c1", title: "Processo de Atendimento Zaytan", description: "Fluxo de comunicação com o cliente", duration: "10 min", roles: ["cs"], mandatory: true, hasQuiz: true },
  { id: "c2", title: "Setup e Operação do CRM", description: "Como registrar e acompanhar leads", duration: "8 min", roles: ["cs"], mandatory: true },
  { id: "c3", title: "Gestão de Feedbacks", description: "Interpretação e ações sobre feedbacks do cliente", duration: "6 min", roles: ["cs"], mandatory: false },
  // CLIENT trails
  { id: "cl1", title: "Como usar o Dashboard", description: "Entenda suas métricas e gráficos de performance", duration: "4 min", roles: ["cliente"], mandatory: false },
  { id: "cl2", title: "Como abrir Solicitações", description: "Aprenda a criar e acompanhar demandas", duration: "3 min", roles: ["cliente"], mandatory: false },
  { id: "cl3", title: "Como usar o CRM", description: "Acompanhe seus leads e vendas", duration: "5 min", roles: ["cliente"], mandatory: false },
  { id: "cl4", title: "Como enviar Feedbacks", description: "Avalie nosso trabalho semanalmente", duration: "2 min", roles: ["cliente"], mandatory: false },
];

const quizzes: Record<string, QuizQuestion[]> = {
  g1: [
    { question: "Qual o principal objetivo do Zaytan OS?", options: ["Gerenciar redes sociais", "Centralizar operação da agência", "Criar sites", "Editar vídeos"], correctIndex: 1 },
    { question: "Quantos tipos de usuário existem no sistema?", options: ["2", "3", "4", "5"], correctIndex: 1 },
  ],
  g2: [
    { question: "Qual indicador mostra que uma tarefa está atrasada?", options: ["Borda azul", "Borda laranja", "Borda verde", "Sem borda"], correctIndex: 1 },
  ],
  t1: [
    { question: "Qual padrão de nomenclatura de campanha?", options: ["[ZAYTAN] Cliente - Objetivo", "Cliente_Campanha", "Livre", "Sem padrão"], correctIndex: 0 },
    { question: "Qual tipo de estrutura de campanha é recomendado?", options: ["ABO sempre", "CBO com grupos segmentados", "Sem estrutura fixa", "Uma campanha por público"], correctIndex: 1 },
  ],
  d1: [
    { question: "Qual o framework principal para criativos?", options: ["AIDA", "Hook → Problema → Solução → CTA", "Apenas imagem bonita", "Copiar concorrente"], correctIndex: 1 },
  ],
  c1: [
    { question: "Qual o tempo máximo de resposta para um chamado?", options: ["1h", "4h", "24h", "48h"], correctIndex: 2 },
  ],
};

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
  const [quizDialog, setQuizDialog] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());

  const isAdmin = role === "admin";
  const isClient = role === "cliente";
  const relevantTrainings = isAdmin
    ? trainingItems
    : isClient
    ? trainingItems.filter(t => t.roles.includes("cliente"))
    : trainingItems.filter(t => t.roles.includes(colaboradorType));

  const mandatoryIds = relevantTrainings.filter(t => t.mandatory).map(t => t.id);
  const mandatoryComplete = mandatoryIds.every(id => completedIds.has(id));
  const progress = mandatoryIds.length > 0
    ? Math.round((mandatoryIds.filter(id => completedIds.has(id)).length / mandatoryIds.length) * 100)
    : 100;

  const toggleComplete = (id: string) => {
    const training = trainingItems.find(t => t.id === id);
    // If has quiz and not passed, open quiz instead
    if (training?.hasQuiz && !passedQuizzes.has(id) && !completedIds.has(id)) {
      setQuizDialog(id);
      setQuizAnswers({});
      setQuizSubmitted(false);
      return;
    }
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      if (!isClient && !isAdmin) {
        const allMandatoryDone = mandatoryIds.every(mid => next.has(mid));
        setTrainingComplete(allMandatoryDone);
      }
      return next;
    });
  };

  const handleQuizSubmit = () => {
    if (!quizDialog || !quizzes[quizDialog]) return;
    setQuizSubmitted(true);
    const qs = quizzes[quizDialog];
    const allCorrect = qs.every((q, i) => quizAnswers[i] === q.correctIndex);
    if (allCorrect) {
      setPassedQuizzes(prev => new Set(prev).add(quizDialog));
      // Auto-complete the training
      setCompletedIds(prev => {
        const next = new Set(prev).add(quizDialog);
        if (!isClient && !isAdmin) {
          const allMandatoryDone = mandatoryIds.every(mid => next.has(mid));
          setTrainingComplete(allMandatoryDone);
        }
        return next;
      });
      setTimeout(() => { setQuizDialog(null); setQuizSubmitted(false); }, 1500);
    }
  };

  const toggleSopRead = (id: string) => {
    setReadSops(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const currentQuiz = quizDialog ? quizzes[quizDialog] : null;
  const quizPassed = quizDialog ? currentQuiz?.every((q, i) => quizAnswers[i] === q.correctIndex) : false;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" /> Zaytan Academy
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? "Visão geral de todas as trilhas de treinamento" :
           isClient ? "Aprenda a usar a plataforma" :
           `Trilha de ${colaboradorType === "gestor" ? "Gestor de Tráfego" : colaboradorType === "designer" ? "Designer" : "CS / Atendimento"}`}
        </p>
      </div>

      {/* Progress (colaborador only) */}
      {!isAdmin && !isClient && (
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
          <PlayCircle className="h-4 w-4 text-primary" /> {isClient ? "Tutoriais" : "Trilha de Treinamento"}
        </h3>
        <div className="space-y-2">
          {relevantTrainings.map(t => {
            const done = completedIds.has(t.id);
            const hasQuiz = t.hasQuiz && !isClient;
            const quizPassed = passedQuizzes.has(t.id);
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
                    {hasQuiz && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${quizPassed ? "bg-success/10 text-success" : "bg-info/10 text-info"}`}>
                        <ClipboardCheck className="h-2.5 w-2.5 inline mr-0.5" />
                        {quizPassed ? "Aprovado" : "Prova"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">{t.duration}</span>
                  {!isClient && (
                    <div className="flex gap-1">
                      {t.roles.filter(r => r !== "cliente").map(r => (
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
      {!isClient && (
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
      )}

      {/* Quiz Dialog */}
      <Dialog open={!!quizDialog} onOpenChange={() => { setQuizDialog(null); setQuizSubmitted(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Prova de Avaliação
            </DialogTitle>
          </DialogHeader>
          {currentQuiz && (
            <div className="space-y-4">
              {currentQuiz.map((q, qi) => (
                <div key={qi}>
                  <p className="text-sm font-medium mb-2">{qi + 1}. {q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => {
                      const selected = quizAnswers[qi] === oi;
                      const isCorrect = quizSubmitted && oi === q.correctIndex;
                      const isWrong = quizSubmitted && selected && oi !== q.correctIndex;
                      return (
                        <button
                          key={oi}
                          onClick={() => { if (!quizSubmitted) setQuizAnswers(prev => ({ ...prev, [qi]: oi })); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                            isCorrect ? "bg-success/10 text-success border border-success/30" :
                            isWrong ? "bg-destructive/10 text-destructive border border-destructive/30" :
                            selected ? "bg-primary/10 text-primary border border-primary/30" :
                            "bg-muted hover:bg-muted/80 border border-transparent"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {quizSubmitted && !quizPassed && (
                <p className="text-xs text-destructive font-medium">❌ Algumas respostas estão incorretas. Revise e tente novamente.</p>
              )}
              {quizSubmitted && quizPassed && (
                <p className="text-xs text-success font-medium">✅ Aprovado! Treinamento concluído.</p>
              )}
            </div>
          )}
          <DialogFooter>
            {!quizSubmitted ? (
              <Button onClick={handleQuizSubmit} disabled={!currentQuiz || Object.keys(quizAnswers).length < (currentQuiz?.length || 0)}>
                Enviar Respostas
              </Button>
            ) : !quizPassed ? (
              <Button onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}>Tentar Novamente</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Academy;
