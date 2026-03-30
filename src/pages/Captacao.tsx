import { useState } from "react";
import { Globe, Plus, Pencil, Trash2, Eye, Copy, ArrowRight, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface FormField {
  label: string;
  type: "text" | "email" | "phone" | "select";
  required: boolean;
}

interface CaptureForm {
  id: string;
  name: string;
  client: string;
  fields: FormField[];
  submissions: number;
  conversions: number;
  status: "ativo" | "pausado" | "rascunho";
  createdAt: string;
}

interface Lead {
  id: string;
  formId: string;
  name: string;
  email: string;
  phone: string;
  stage: "novo" | "qualificado" | "convertido" | "perdido";
  date: string;
}

const initialForms: CaptureForm[] = [
  { id: "1", name: "LP Advocacia - Captação", client: "Escritório Silva", fields: [{ label: "Nome", type: "text", required: true }, { label: "Email", type: "email", required: true }, { label: "Telefone", type: "phone", required: true }], submissions: 124, conversions: 45, status: "ativo", createdAt: "2025-01-15" },
  { id: "2", name: "LP Estética - Agendamento", client: "Clínica Bella", fields: [{ label: "Nome", type: "text", required: true }, { label: "WhatsApp", type: "phone", required: true }, { label: "Procedimento", type: "select", required: true }], submissions: 89, conversions: 32, status: "ativo", createdAt: "2025-02-01" },
  { id: "3", name: "Formulário Imóveis", client: "Imobiliária Nova Era", fields: [{ label: "Nome", type: "text", required: true }, { label: "Email", type: "email", required: true }], submissions: 56, conversions: 18, status: "pausado", createdAt: "2025-02-20" },
];

const initialLeads: Lead[] = [
  { id: "1", formId: "1", name: "João Pereira", email: "joao@email.com", phone: "(11) 99999-0001", stage: "convertido", date: "2025-03-28" },
  { id: "2", formId: "1", name: "Maria Costa", email: "maria@email.com", phone: "(11) 99999-0002", stage: "qualificado", date: "2025-03-29" },
  { id: "3", formId: "2", name: "Ana Lima", email: "ana@email.com", phone: "(11) 99999-0003", stage: "novo", date: "2025-03-30" },
  { id: "4", formId: "1", name: "Carlos Silva", email: "carlos@email.com", phone: "(11) 99999-0004", stage: "perdido", date: "2025-03-27" },
  { id: "5", formId: "2", name: "Patrícia Souza", email: "patricia@email.com", phone: "(11) 99999-0005", stage: "qualificado", date: "2025-03-30" },
  { id: "6", formId: "3", name: "Roberto Alves", email: "roberto@email.com", phone: "(11) 99999-0006", stage: "novo", date: "2025-03-29" },
];

const leadStages = [
  { id: "novo", label: "Novo", className: "bg-info/10 text-info" },
  { id: "qualificado", label: "Qualificado", className: "bg-warning/10 text-warning" },
  { id: "convertido", label: "Convertido", className: "bg-success/10 text-success" },
  { id: "perdido", label: "Perdido", className: "bg-destructive/10 text-destructive" },
];

const Captacao = () => {
  const [forms, setForms] = useState(initialForms);
  const [leads, setLeads] = useState(initialLeads);
  const [activeTab, setActiveTab] = useState<"forms" | "pipeline">("forms");
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({ name: "", client: "" });

  const totalSubmissions = forms.reduce((s, f) => s + f.submissions, 0);
  const totalConversions = forms.reduce((s, f) => s + f.conversions, 0);
  const avgConversionRate = totalSubmissions > 0 ? Math.round((totalConversions / totalSubmissions) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Captação de Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">Formulários e pipeline de conversão</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Formulário</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2"><Globe className="h-4 w-4 text-primary" /></div>
          <p className="text-2xl font-bold">{forms.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Formulários Ativos</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center mb-2"><Eye className="h-4 w-4 text-info" /></div>
          <p className="text-2xl font-bold">{totalSubmissions}</p>
          <p className="text-xs text-muted-foreground mt-1">Total Submissões</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center mb-2"><ArrowRight className="h-4 w-4 text-success" /></div>
          <p className="text-2xl font-bold">{totalConversions}</p>
          <p className="text-xs text-muted-foreground mt-1">Conversões</p>
        </div>
        <div className="metric-card">
          <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center mb-2"><BarChart3 className="h-4 w-4 text-warning" /></div>
          <p className="text-2xl font-bold">{avgConversionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Taxa de Conversão</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-0.5 w-fit">
        {[
          { value: "forms" as const, label: "Formulários" },
          { value: "pipeline" as const, label: "Pipeline de Leads" },
        ].map((tab) => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`px-4 py-2 rounded-md text-xs font-medium transition-all ${activeTab === tab.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "forms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form) => {
            const rate = form.submissions > 0 ? Math.round((form.conversions / form.submissions) * 100) : 0;
            return (
              <div key={form.id} className="metric-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Globe className="h-4 w-4 text-primary" /></div>
                    <div>
                      <h4 className="text-sm font-semibold">{form.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{form.client}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${form.status === "ativo" ? "bg-success/10 text-success" : form.status === "pausado" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
                    {form.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 bg-muted/50 rounded-lg"><p className="text-lg font-bold">{form.submissions}</p><p className="text-[10px] text-muted-foreground">Submissões</p></div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg"><p className="text-lg font-bold">{form.conversions}</p><p className="text-[10px] text-muted-foreground">Conversões</p></div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg"><p className="text-lg font-bold">{rate}%</p><p className="text-[10px] text-muted-foreground">Taxa</p></div>
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] text-muted-foreground flex-1">{form.fields.length} campos</p>
                  <button className="p-1 rounded hover:bg-muted"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                  <button onClick={() => setDeleteId(form.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "pipeline" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {leadStages.map((stage) => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            return (
              <div key={stage.id} className="kanban-column min-w-[240px] flex-1">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${stage.className}`}>{stage.label}</span>
                  <span className="text-xs text-muted-foreground">{stageLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {stageLeads.map((lead) => {
                    const form = forms.find(f => f.id === lead.formId);
                    return (
                      <div key={lead.id} className="kanban-card">
                        <h4 className="text-sm font-medium mb-0.5">{lead.name}</h4>
                        <p className="text-[10px] text-muted-foreground mb-1">{lead.email}</p>
                        <p className="text-[10px] text-muted-foreground mb-2">{lead.phone}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">{form?.name || "—"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(lead.date).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Formulário</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do formulário" value={newForm.name} onChange={(e) => setNewForm(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Cliente" value={newForm.client} onChange={(e) => setNewForm(p => ({ ...p, client: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (newForm.name.trim()) {
                setForms(p => [...p, { id: Date.now().toString(), ...newForm, fields: [{ label: "Nome", type: "text", required: true }, { label: "Email", type: "email", required: true }], submissions: 0, conversions: 0, status: "rascunho", createdAt: new Date().toISOString().split("T")[0] }]);
                setNewForm({ name: "", client: "" });
                setShowAdd(false);
              }
            }}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir formulário?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setForms(p => p.filter(f => f.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Captacao;
