import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Download, Search, Calendar, User, Building2, Sparkles, Trash2, Eye } from "lucide-react";
import { LaudoGenerator } from "@/components/LaudoGenerator";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const Laudos = () => {
  const { role } = useRole();
  const { profile } = useAuth();
  const qc = useQueryClient();
  const isAdmin = role === "admin";

  const [showGenerator, setShowGenerator] = useState(false);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedExisting, setSelectedExisting] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const openPdf = async (laudo: any) => {
    if (!laudo.pdf_url && !laudo.laudo_data?.pdf_path) {
      toast.error("PDF não disponível");
      return;
    }
    setViewing(laudo.id);
    try {
      // Try to derive storage path
      let path: string | null = laudo.laudo_data?.pdf_path ?? null;
      if (!path && laudo.pdf_url) {
        const m = laudo.pdf_url.match(/\/laudos\/(.+)$/);
        if (m) path = m[1];
      }
      if (path) {
        const { data, error } = await supabase.storage.from("laudos").download(path);
        if (error || !data) throw error || new Error("download falhou");
        const url = URL.createObjectURL(data);
        window.open(url, "_blank");
        // revoke later
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else if (laudo.pdf_url) {
        window.open(laudo.pdf_url, "_blank");
      }
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível abrir o PDF");
    } finally {
      setViewing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("laudos_avulsos").delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error("Erro ao excluir laudo");
      return;
    }
    // Try to remove the PDF from storage as well
    const path: string | null = deleteTarget.laudo_data?.pdf_path
      ?? (deleteTarget.pdf_url?.match(/\/laudos\/(.+)$/)?.[1] ?? null);
    if (path) {
      await supabase.storage.from("laudos").remove([path]);
    }
    toast.success("Laudo excluído");
    setDeleteTarget(null);
    qc.invalidateQueries({ queryKey: ["laudos-avulsos"] });
  };

  // Resolve current client_id (for cliente role)
  const { data: myClient } = useQuery({
    queryKey: ["my-client-for-laudos", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return null;
      const { data } = await supabase.from("clients").select("id, name").eq("user_id", profile.user_id).maybeSingle();
      return data;
    },
    enabled: !!profile && role === "cliente",
  });

  const { data: clientsList = [] } = useQuery({
    queryKey: ["clients-for-laudos"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").eq("active", true).order("name");
      return data || [];
    },
    enabled: isAdmin,
  });

  const { data: laudos = [], isLoading } = useQuery({
    queryKey: ["laudos-avulsos", clientFilter],
    queryFn: async () => {
      let q = supabase
        .from("laudos_avulsos")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (isAdmin && clientFilter !== "all") q = q.eq("client_id", clientFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return laudos;
    const s = search.toLowerCase();
    return laudos.filter((l: any) =>
      (l.client_name || "").toLowerCase().includes(s) ||
      (l.cpf || "").includes(s) ||
      String(l.numero_proposta || "").includes(s)
    );
  }, [laudos, search]);

  // For cliente role, avulsoClientId = own client. For admin: needs to pick or use first selected.
  const [adminTargetClient, setAdminTargetClient] = useState<string>("");
  const avulsoClientId = isAdmin ? (adminTargetClient || null) : (myClient?.id ?? null);

  const fmtDate = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gerador de Laudos</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                Crie um laudo técnico de revisão contratual do zero. Todos os laudos gerados ficam salvos no histórico abaixo.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => { setSelectedExisting(null); setShowGenerator(true); }}
            disabled={isAdmin && !adminTargetClient}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Laudo
          </Button>
        </div>

        {isAdmin && (
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Cliente associado ao novo laudo:</span>
            <select
              className="h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={adminTargetClient}
              onChange={e => setAdminTargetClient(e.target.value)}
            >
              <option value="">Selecione um cliente...</option>
              {clientsList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={FileText} label="Total de Laudos" value={laudos.length} />
        <StatCard icon={Calendar} label="Hoje" value={laudos.filter((l: any) => new Date(l.created_at).toDateString() === new Date().toDateString()).length} />
        <StatCard icon={Building2} label="Este Mês" value={laudos.filter((l: any) => {
          const d = new Date(l.created_at);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou nº proposta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isAdmin && (
          <select
            className="h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="all">Todos os clientes</option>
            {clientsList.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Histórico de Laudos
          </h3>
          <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? "registro" : "registros"}</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum laudo gerado ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Novo Laudo" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((l: any) => (
              <div key={l.id} className="px-4 py-3 hover:bg-muted/30 transition-colors flex items-center gap-4 flex-wrap">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{l.client_name}</p>
                    {l.numero_proposta && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        Proposta #{l.numero_proposta}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    {l.cpf && <span>{l.cpf}</span>}
                    {l.consultor_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{l.consultor_name}</span>}
                    {isAdmin && l.clients?.name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{l.clients.name}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fmtDate(l.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {l.pdf_url && (
                    <a href={l.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="h-3.5 w-3.5 mr-1" /> PDF
                      </Button>
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedExisting(l.laudo_data);
                      setShowGenerator(true);
                    }}
                  >
                    Regerar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LaudoGenerator
        open={showGenerator}
        onOpenChange={(v) => { setShowGenerator(v); if (!v) setSelectedExisting(null); }}
        leadName=""
        avulsoClientId={avulsoClientId}
        existingLaudoData={selectedExisting}
        onPdfSaved={() => {
          qc.invalidateQueries({ queryKey: ["laudos-avulsos"] });
          setShowGenerator(false);
          setSelectedExisting(null);
        }}
      />
    </div>
  );
};

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default Laudos;
