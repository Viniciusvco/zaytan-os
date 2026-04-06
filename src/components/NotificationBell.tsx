import { useState } from "react";
import { Bell, MessageSquare, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";

interface Notification {
  id: string;
  title: string;
  description: string;
  type: "feedback" | "reuniao" | "alerta" | "sucesso";
  read: boolean;
  time: string;
}

const mockNotifications: Record<string, Notification[]> = {
  cliente: [
    { id: "1", title: "Feedback Semanal Pendente", description: "Avalie o atendimento desta semana", type: "feedback", read: false, time: "Há 2h" },
    { id: "2", title: "Reunião Mensal", description: "Agendada para 10/04 às 14h", type: "reuniao", read: false, time: "Há 1d" },
    { id: "3", title: "Relatório Disponível", description: "Performance de Março pronta", type: "sucesso", read: true, time: "Há 3d" },
  ],
  admin: [
    { id: "1", title: "Cliente Insatisfeito", description: "Escritório Silva deu nota 2 no feedback", type: "alerta", read: false, time: "Há 1h" },
    { id: "2", title: "Churn Risk", description: "Construtora Horizonte — contrato vence em 5d", type: "alerta", read: false, time: "Há 3h" },
    { id: "3", title: "Nova venda fechada", description: "Camila Santos fechou R$ 5.500", type: "sucesso", read: true, time: "Há 1d" },
  ],
  colaborador: [
    { id: "1", title: "Nova tarefa atribuída", description: "Criar campanha Páscoa — Clínica Bella", type: "feedback", read: false, time: "Há 30min" },
    { id: "2", title: "SLA próximo do vencimento", description: "LP Imobiliária Nova Era — 1d restante", type: "alerta", read: false, time: "Há 2h" },
  ],
};

const typeIcons = { feedback: MessageSquare, reuniao: Calendar, alerta: AlertTriangle, sucesso: CheckCircle2 };
const typeColors = { feedback: "text-info", reuniao: "text-primary", alerta: "text-destructive", sucesso: "text-success" };

export function NotificationBell() {
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const items = notifications[role] || [];
  const unread = items.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifications(prev => ({
      ...prev,
      [role]: prev[role].map(n => n.id === id ? { ...n, read: true } : n),
    }));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors relative">
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold">Notificações</h3>
            </div>
            <div className="max-h-80 overflow-auto">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">Nenhuma notificação</p>
              ) : items.map(n => {
                const Icon = typeIcons[n.type];
                return (
                  <button key={n.id} onClick={() => markRead(n.id)}
                    className={`w-full text-left p-3 flex gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeColors[n.type]}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
