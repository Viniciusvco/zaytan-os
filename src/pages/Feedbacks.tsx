import { useState } from "react";
import { Star, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Feedback {
  id: string;
  type: "semanal" | "mensal";
  atendimento: number;
  entrega: number;
  satisfacao: number;
  comentario: string;
  date: string;
}

const mockFeedbacks: Feedback[] = [
  { id: "1", type: "semanal", atendimento: 5, entrega: 4, satisfacao: 5, comentario: "Ótimo atendimento esta semana!", date: "2026-03-30" },
  { id: "2", type: "mensal", atendimento: 4, entrega: 4, satisfacao: 4, comentario: "Resultados melhoraram bastante em março.", date: "2026-03-01" },
  { id: "3", type: "semanal", atendimento: 3, entrega: 2, satisfacao: 3, comentario: "Demora nas respostas.", date: "2026-03-23" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => onChange(i)} className="focus:outline-none">
          <Star className={`h-5 w-5 transition-colors ${i <= value ? "text-primary fill-primary" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

const Feedbacks = () => {
  const [tab, setTab] = useState<"semanal" | "mensal">("semanal");
  const [feedbacks, setFeedbacks] = useState(mockFeedbacks);
  const [form, setForm] = useState({ atendimento: 0, entrega: 0, satisfacao: 0, comentario: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = feedbacks.filter(f => f.type === tab);

  const handleSubmit = () => {
    if (form.atendimento === 0 || form.entrega === 0 || form.satisfacao === 0) return;
    setFeedbacks(prev => [{
      id: Date.now().toString(), type: tab,
      ...form, date: new Date().toISOString().split("T")[0],
    }, ...prev]);
    setForm({ atendimento: 0, entrega: 0, satisfacao: 0, comentario: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedbacks</h1>
        <p className="text-sm text-muted-foreground mt-1">Avalie nosso trabalho para melhorarmos continuamente</p>
      </div>

      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {(["semanal", "mensal"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "semanal" ? "Semanal" : "Mensal"}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="metric-card">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Novo Feedback {tab === "semanal" ? "Semanal" : "Mensal"}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Qualidade do Atendimento</span>
            <StarRating value={form.atendimento} onChange={v => setForm(p => ({ ...p, atendimento: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Entrega dos Funcionários</span>
            <StarRating value={form.entrega} onChange={v => setForm(p => ({ ...p, entrega: v }))} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Satisfação Geral</span>
            <StarRating value={form.satisfacao} onChange={v => setForm(p => ({ ...p, satisfacao: v }))} />
          </div>
          <textarea className="w-full h-20 px-3 py-2 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            placeholder="Comentários adicionais..." value={form.comentario} onChange={e => setForm(p => ({ ...p, comentario: e.target.value }))} />
          <div className="flex items-center justify-between">
            {submitted && <span className="text-xs text-success font-medium">✓ Feedback enviado!</span>}
            <Button onClick={handleSubmit} className="ml-auto"><Send className="h-3.5 w-3.5 mr-1.5" />Enviar</Button>
          </div>
        </div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Histórico</h3>
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{new Date(f.date).toLocaleDateString("pt-BR")}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.type === "semanal" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"}`}>
                  {f.type === "semanal" ? "Semanal" : "Mensal"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-2">
                <div><p className="text-[10px] text-muted-foreground">Atendimento</p><div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= f.atendimento ? "text-primary fill-primary" : "text-muted-foreground/20"}`} />)}</div></div>
                <div><p className="text-[10px] text-muted-foreground">Entrega</p><div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= f.entrega ? "text-primary fill-primary" : "text-muted-foreground/20"}`} />)}</div></div>
                <div><p className="text-[10px] text-muted-foreground">Satisfação</p><div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`h-3 w-3 ${i <= f.satisfacao ? "text-primary fill-primary" : "text-muted-foreground/20"}`} />)}</div></div>
              </div>
              {f.comentario && <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg p-2">"{f.comentario}"</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Feedbacks;
