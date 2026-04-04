import { useState } from "react";
import { CheckCircle2, Circle, Upload, Palette, FileText, Video, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  completed: boolean;
  fields?: { label: string; value: string; type: "text" | "color" | "textarea" | "url" }[];
}

const Onboarding = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([
    { id: "1", title: "Cadastro Inicial", description: "Informações básicas da empresa", icon: FileText, completed: true, fields: [
      { label: "Nome da Empresa", value: "Escritório Silva Advocacia", type: "text" },
      { label: "CNPJ", value: "12.345.678/0001-90", type: "text" },
      { label: "Responsável", value: "Dr. Ricardo Silva", type: "text" },
    ]},
    { id: "2", title: "Upload de Logo", description: "Envie o logo da sua empresa", icon: Upload, completed: false, fields: [
      { label: "URL do Logo", value: "", type: "url" },
    ]},
    { id: "3", title: "Cor Principal", description: "Escolha a cor da sua marca", icon: Palette, completed: false, fields: [
      { label: "Cor Primária", value: "#FF6E27", type: "color" },
    ]},
    { id: "4", title: "Briefing", description: "Conte sobre seu negócio e objetivos", icon: FileText, completed: false, fields: [
      { label: "Público-alvo", value: "", type: "textarea" },
      { label: "Objetivo principal", value: "", type: "textarea" },
      { label: "Orçamento mensal", value: "", type: "text" },
      { label: "Concorrentes", value: "", type: "textarea" },
    ]},
    { id: "5", title: "Upload de Materiais", description: "Envie logos, fotos e materiais", icon: Upload, completed: false, fields: [
      { label: "Link do Google Drive", value: "", type: "url" },
    ]},
    { id: "6", title: "Integração Meta Ads", description: "Conecte sua conta de anúncios", icon: Zap, completed: false, fields: [
      { label: "ID da Conta (placeholder)", value: "", type: "text" },
    ]},
    { id: "7", title: "Vídeo Explicativo", description: "Assista ao vídeo de boas-vindas", icon: Video, completed: false },
  ]);

  const [activeStep, setActiveStep] = useState(1);
  const completedCount = steps.filter(s => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const updateField = (stepIdx: number, fieldIdx: number, value: string) => {
    setSteps(prev => prev.map((s, si) => si === stepIdx && s.fields ? {
      ...s, fields: s.fields.map((f, fi) => fi === fieldIdx ? { ...f, value } : f)
    } : s));
  };

  const completeStep = (idx: number) => {
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, completed: true } : s));
    if (idx < steps.length - 1) setActiveStep(idx + 1);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure sua conta passo a passo</p>
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Progresso do Onboarding</p>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{completedCount} de {steps.length} etapas concluídas</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === activeStep;
          return (
            <div key={step.id} className={`metric-card cursor-pointer transition-all ${isActive ? "border-primary/50 shadow-md" : ""} ${step.completed ? "opacity-70" : ""}`}
              onClick={() => !step.completed && setActiveStep(idx)}>
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  {step.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-border" />}
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <StepIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{idx + 1}/{steps.length}</span>
              </div>

              {isActive && !step.completed && (
                <div className="mt-4 pl-8 space-y-3" onClick={e => e.stopPropagation()}>
                  {step.id === "7" ? (
                    <div className="bg-muted rounded-lg p-4 text-center">
                      <Video className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Vídeo de boas-vindas (placeholder)</p>
                      <p className="text-xs text-muted-foreground mt-1">Em breve: embed de vídeo explicativo</p>
                    </div>
                  ) : step.fields?.map((field, fi) => (
                    <div key={fi}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
                      {field.type === "textarea" ? (
                        <textarea className="w-full h-16 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" value={field.value} onChange={e => updateField(idx, fi, e.target.value)} />
                      ) : field.type === "color" ? (
                        <div className="flex items-center gap-2">
                          <input type="color" className="h-9 w-12 rounded border-0 cursor-pointer" value={field.value} onChange={e => updateField(idx, fi, e.target.value)} />
                          <input className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={field.value} onChange={e => updateField(idx, fi, e.target.value)} />
                        </div>
                      ) : (
                        <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={field.value} onChange={e => updateField(idx, fi, e.target.value)} />
                      )}
                    </div>
                  ))}
                  <Button size="sm" onClick={() => completeStep(idx)}>
                    Concluir etapa <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {progress === 100 && (
        <div className="metric-card border-success/50 text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
          <h2 className="text-lg font-bold">Onboarding Completo! 🎉</h2>
          <p className="text-sm text-muted-foreground mt-1">Sua conta está configurada e pronta para uso.</p>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
