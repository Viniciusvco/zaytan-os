import { ComingSoon } from "@/components/ComingSoon";
import { Rocket, CheckCircle2, Circle, Upload, FileText, Video } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const steps = [
  { id: 1, title: "Briefing da Empresa", desc: "Preencha informações sobre seu negócio", done: true, icon: FileText },
  { id: 2, title: "Enviar Acessos", desc: "Compartilhe acessos de Meta Ads e Google", done: true, icon: Upload },
  { id: 3, title: "Assistir Vídeo de Boas-vindas", desc: "Conheça a plataforma Zaytan", done: false, icon: Video },
  { id: 4, title: "Configurar CRM", desc: "Defina etapas do seu funil de vendas", done: false, icon: Rocket },
];

const Onboarding = () => {
  const completed = steps.filter(s => s.done).length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <ComingSoon>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" /> Onboarding
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure sua conta passo a passo</p>
        </div>

        {/* Progress */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Progresso do Onboarding</span>
            <span className="text-sm font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">{completed} de {steps.length} etapas concluídas</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.id} className={`metric-card flex items-start gap-4 ${step.done ? "opacity-70" : ""}`}>
                <div className={`mt-0.5 ${step.done ? "text-success" : "text-muted-foreground"}`}>
                  {step.done ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
                {!step.done && i === completed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Próximo</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ComingSoon>
  );
};

export default Onboarding;
