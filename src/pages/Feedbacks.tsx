import { useState, useEffect } from "react";
import { Send, MessageSquare, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";

interface Feedback {
  id: string;
  type: "semanal" | "mensal";
  qualidadeLeads: number;
  quantidadeLeads: number;
  comentario: string;
  date: string;
}

const mockFeedbacks: Feedback[] = [
  { id: "1", type: "semanal", qualidadeLeads: 4, quantidadeLeads: 5, comentario: "Leads qualificados esta semana!", date: "2026-03-30" },
  { id: "2", type: "mensal", qualidadeLeads: 3, quantidadeLeads: 4, comentario: "Resultados melhoraram em março.", date: "2026-03-01" },
  { id: "3", type: "semanal", qualidadeLeads: 2, quantidadeLeads: 3, comentario: "Leads frios demais.", date: "2026-03-23" },
];

function ScaleRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground block mb-1.5">{label}</span>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`h-9 w-9 rounded-lg text-sm font-bold transition-all ${
              i === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : i <= value
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Mock: next Sunday at 23:59
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (7 - now.getDay()));
    sunday.setHours(23, 59, 59, 0);
    setTimeLeft(Math.max(0, Math.floor((sunday.getTime() - now.getTime()) / 1000)));

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex items-center gap-2">
      {[
        { v: days, l: "d" },
        { v: hours, l: "h" },
        { v: minutes, l: "m" },
        { v: secs, l: "s" },
      ].map(({ v, l }) => (
        <div key={l} className="flex items-center gap-0.5">
          <span className="bg-primary/10 text-primary font-mono font-bold text-sm px-1.5 py-0.5 rounded">
            {String(v).padStart(2, "0")}
          </span>
          <span className="text-[10px] text-muted-foreground">{l}</span>
        </div>
      ))}
    </div>
  );
}

const Feedbacks = () => {
  const { setFeedbackPending } = useRole();
  const [tab, setTab] = useState<"semanal" | "mensal">("semanal");
  const [feedbacks, setFeedbacks] = useState(mockFeedbacks);
  const [form, setForm] = useState({ qualidadeLeads: 0, quantidadeLeads: 0, comentario: "" });
  const [submitted, setSubmitted] = useState(false);

  const filtered = feedbacks.filter(f => f.type === tab);

  const handleSubmit = () => {
    if (form.qualidadeLeads === 0 && form.quantidadeLeads === 0) return;
    setFeedbacks(prev => [{
      id: Date.now().toString(), type: tab,
      ...form, date: new Date().toISOString().split("T")[0],
    }, ...prev]);
    setForm({ qualidadeLeads: 0, quantidadeLeads: 0, comentario: "" });
    setSubmitted(true);
    setFeedbackPending(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feedbacks</h1>
        <p className="text-sm text-muted-foreground mt-1">Avalie a qualidade e quantidade dos seus leads</p>
      </div>

      {/* Countdown Timer Banner */}
      <div className="metric-card border-warning/30 bg-warning/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-warning" />
            <span className="text-xs font-semibold">Prazo para envio do Feedback Semanal</span>
          </div>
          <CountdownTimer />
        </div>
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
        <div className="space-y-5">
          <ScaleRating label="Qualidade dos Leads" value={form.qualidadeLeads} onChange={v => setForm(p => ({ ...p, qualidadeLeads: v }))} />
          <ScaleRating label="Quantidade dos Leads" value={form.quantidadeLeads} onChange={v => setForm(p => ({ ...p, quantidadeLeads: v }))} />
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{new Date(f.date).toLocaleDateString("pt-BR")}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${f.type === "semanal" ? "bg-info/10 text-info" : "bg-primary/10 text-primary"}`}>
                  {f.type === "semanal" ? "Semanal" : "Mensal"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Qualidade dos Leads</p>
                  <div className="flex gap-1">
                    {[0,1,2,3,4,5].map(i => (
                      <span key={i} className={`h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center ${i <= f.qualidadeLeads ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/30"}`}>{i}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Quantidade dos Leads</p>
                  <div className="flex gap-1">
                    {[0,1,2,3,4,5].map(i => (
                      <span key={i} className={`h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center ${i <= f.quantidadeLeads ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground/30"}`}>{i}</span>
                    ))}
                  </div>
                </div>
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
