import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ContextFilters } from "@/components/ContextFilters";
import { toast } from "sonner";

const categoryConfig: Record<string, { label: string; className: string }> = {
  trafego: { label: "Tráfego", className: "bg-primary/10 text-primary" },
  automacao: { label: "Automação", className: "bg-info/10 text-info" },
  lp: { label: "Landing Page", className: "bg-warning/10 text-warning" },
  consultoria: { label: "Consultoria", className: "bg-success/10 text-success" },
};

const Produtos = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "trafego", min_price: 0, max_price: 0, recurrence: "mensal" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async (p: typeof form) => {
      const { error } = await supabase.from("products").insert(p);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setShowAdd(false); setForm({ name: "", description: "", category: "trafego", min_price: 0, max_price: 0, recurrence: "mensal" }); toast.success("Produto criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (p: any) => {
      const { id, created_at, updated_at, ...rest } = p;
      const { error } = await supabase.from("products").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setEditProduct(null); toast.success("Produto atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleteId(null); toast.success("Produto excluído"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = products.filter((p: any) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const ProductForm = ({ product, onChange }: { product: any; onChange: (p: any) => void }) => (
    <div className="space-y-3">
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do produto" value={product.name} onChange={e => onChange({ ...product, name: e.target.value })} />
      <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Descrição" value={product.description || ""} onChange={e => onChange({ ...product, description: e.target.value })} />
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={product.category || "trafego"} onChange={e => onChange({ ...product, category: e.target.value })}>
        <option value="trafego">Tráfego</option><option value="automacao">Automação</option><option value="lp">Landing Page</option><option value="consultoria">Consultoria</option>
      </select>
      <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={product.recurrence || "mensal"} onChange={e => onChange({ ...product, recurrence: e.target.value })}>
        <option value="mensal">Recorrente (Mensal)</option><option value="pontual">Pontual</option>
      </select>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Preço Mínimo (R$)" value={product.min_price || ""} onChange={e => onChange({ ...product, min_price: Number(e.target.value) })} />
        <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Preço Máximo (R$)" value={product.max_price || ""} onChange={e => onChange({ ...product, max_price: Number(e.target.value) })} />
      </div>
    </div>
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
      </div>

      <ContextFilters search={search} onSearchChange={setSearch} searchPlaceholder="Buscar produtos..."
        filterGroups={[{ key: "cat", label: "Categoria", options: [
          { label: "Todos", value: "all" }, { label: "Tráfego", value: "trafego" },
          { label: "Automação", value: "automacao" }, { label: "Landing Page", value: "lp" },
          { label: "Consultoria", value: "consultoria" },
        ]}]}
        activeFilters={{ cat: catFilter }}
        onFilterChange={(_, v) => setCatFilter(v)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p: any) => {
          const cat = categoryConfig[p.category || "trafego"] || categoryConfig.trafego;
          return (
            <div key={p.id} className="metric-card">
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-4 w-4 text-primary" /></div>
                <div className="flex gap-1">
                  <button onClick={() => setEditProduct({ ...p })} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.className}`}>{cat.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.recurrence === "mensal" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {p.recurrence === "mensal" ? "Recorrente" : "Pontual"}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                Range: R$ {(p.min_price || 0).toLocaleString()} — R$ {(p.max_price || 0).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <ProductForm product={form} onChange={setForm} />
          <DialogFooter><Button onClick={() => { if (form.name) createMut.mutate(form); }} disabled={createMut.isPending}>{createMut.isPending ? "Criando..." : "Adicionar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
          {editProduct && <ProductForm product={editProduct} onChange={setEditProduct} />}
          <DialogFooter><Button onClick={() => { if (editProduct) updateMut.mutate(editProduct); }} disabled={updateMut.isPending}>{updateMut.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
