import { useState } from "react";
import { Calendar as CalendarIcon, Plus, Clock, Users, Video, Trash2, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface Event {
  id: string;
  title: string;
  client: string;
  date: string;
  time: string;
  type: "kickoff" | "mensal" | "alinhamento" | "outro";
  team: string[];
}

const initialEvents: Event[] = [
  { id: "1", title: "Kickoff - Nova Era", client: "Imobiliária Nova Era", date: "2026-04-02", time: "10:00", type: "kickoff", team: ["Rafael", "Camila"] },
  { id: "2", title: "Reunião Mensal", client: "Escritório Silva", date: "2026-04-05", time: "14:00", type: "mensal", team: ["Lucas"] },
  { id: "3", title: "Alinhamento Campanha", client: "Clínica Bella", date: "2026-04-07", time: "09:30", type: "alinhamento", team: ["Ana", "Camila"] },
  { id: "4", title: "Kickoff - Horizonte", client: "Construtora Horizonte", date: "2026-04-10", time: "11:00", type: "kickoff", team: ["Rafael", "Lucas", "Ana"] },
  { id: "5", title: "Reunião Mensal", client: "TechShop", date: "2026-04-12", time: "15:00", type: "mensal", team: ["Camila"] },
  { id: "6", title: "Review Trimestral", client: "Escritório Silva", date: "2026-04-15", time: "10:00", type: "outro", team: ["Rafael", "Lucas"] },
];

const typeConfig = {
  kickoff: { label: "Kickoff", className: "bg-primary/10 text-primary" },
  mensal: { label: "Mensal", className: "bg-info/10 text-info" },
  alinhamento: { label: "Alinhamento", className: "bg-warning/10 text-warning" },
  outro: { label: "Outro", className: "bg-muted text-muted-foreground" },
};

const Agendamentos = () => {
  const [events, setEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "", client: "", date: new Date().toISOString().split("T")[0], time: "10:00", type: "kickoff", team: [],
  });
  const [teamInput, setTeamInput] = useState("");

  const selectedDateStr = selectedDate?.toISOString().split("T")[0] || "";
  const dayEvents = events.filter(e => e.date === selectedDateStr);
  const upcomingEvents = [...events]
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 8);

  const eventDates = events.map(e => new Date(e.date));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendário de reuniões e compromissos</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Evento</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="metric-card lg:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="pointer-events-auto w-full"
            modifiers={{ hasEvent: eventDates }}
            modifiersClassNames={{ hasEvent: "bg-primary/20 font-bold text-primary" }}
          />
          {selectedDate && dayEvents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
              </p>
              {dayEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group">
                  <div className="text-xs font-mono text-muted-foreground w-10">{e.time}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{e.client}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeConfig[e.type].className}`}>{typeConfig[e.type].label}</span>
                </div>
              ))}
            </div>
          )}
          {selectedDate && dayEvents.length === 0 && (
            <p className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">Nenhum evento neste dia.</p>
          )}
        </div>

        {/* Upcoming List */}
        <div className="metric-card lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Próximos Eventos</h3>
          <div className="space-y-2">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:border-primary/30 transition-all group">
                <div className="text-center min-w-[48px]">
                  <p className="text-lg font-bold leading-none">{new Date(e.date).getDate()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{new Date(e.date).toLocaleDateString("pt-BR", { month: "short" })}</p>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{e.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeConfig[e.type].className}`}>{typeConfig[e.type].label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.client}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{e.time}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{e.team.join(", ")}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditEvent({ ...e })} className="p-1.5 rounded-md hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => setDeleteId(e.id)} className="p-1.5 rounded-md hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Título" value={newEvent.title} onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Cliente" value={newEvent.client} onChange={(e) => setNewEvent(p => ({ ...p, client: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newEvent.date} onChange={(e) => setNewEvent(p => ({ ...p, date: e.target.value }))} />
              <input type="time" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={newEvent.time} onChange={(e) => setNewEvent(p => ({ ...p, time: e.target.value }))} />
            </div>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newEvent.type} onChange={(e) => setNewEvent(p => ({ ...p, type: e.target.value as Event["type"] }))}>
              <option value="kickoff">Kickoff</option>
              <option value="mensal">Reunião Mensal</option>
              <option value="alinhamento">Alinhamento</option>
              <option value="outro">Outro</option>
            </select>
            <div className="flex gap-2">
              <input className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Adicionar membro da equipe" value={teamInput} onChange={(e) => setTeamInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && teamInput.trim()) { setNewEvent(p => ({ ...p, team: [...p.team, teamInput.trim()] })); setTeamInput(""); } }} />
            </div>
            {newEvent.team.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {newEvent.team.map((t, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                    {t}
                    <button onClick={() => setNewEvent(p => ({ ...p, team: p.team.filter((_, j) => j !== i) }))} className="hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (newEvent.title.trim()) {
                setEvents(p => [...p, { ...newEvent, id: Date.now().toString() }]);
                setNewEvent({ title: "", client: "", date: new Date().toISOString().split("T")[0], time: "10:00", type: "kickoff", team: [] });
                setShowAdd(false);
              }
            }}>Criar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={() => setEditEvent(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Evento</DialogTitle></DialogHeader>
          {editEvent && (
            <div className="space-y-3">
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editEvent.title} onChange={(e) => setEditEvent({ ...editEvent, title: e.target.value })} />
              <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editEvent.client} onChange={(e) => setEditEvent({ ...editEvent, client: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editEvent.date} onChange={(e) => setEditEvent({ ...editEvent, date: e.target.value })} />
                <input type="time" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editEvent.time} onChange={(e) => setEditEvent({ ...editEvent, time: e.target.value })} />
              </div>
              <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editEvent.type} onChange={(e) => setEditEvent({ ...editEvent, type: e.target.value as Event["type"] })}>
                <option value="kickoff">Kickoff</option>
                <option value="mensal">Reunião Mensal</option>
                <option value="alinhamento">Alinhamento</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { if (editEvent) { setEvents(p => p.map(e => e.id === editEvent.id ? editEvent : e)); setEditEvent(null); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir evento?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setEvents(p => p.filter(e => e.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Agendamentos;
