import { useState } from "react";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ContextFilters } from "@/components/ContextFilters";

interface Product {
  id: string;
  name: string;
  category: "trafego" | "automacao" | "lp" | "consultoria";
  basePrice: number;
  type: "recorrente" | "pontual";
  description: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Gestão Meta Ads", category: "trafego", basePrice: 3500, type: "recorrente", description: "Gestão completa de campanhas Meta Ads com relatórios semanais" },
  { id: "2", name: "Gestão Google Ads", category: "trafego", basePrice: 4000, type: "recorrente", description: "Campanhas de pesquisa, display e YouTube" },
  { id: "3", name: "Landing Page", category: "lp", basePrice: 1500, type: "pontual", description: "Página de alta conversão com copywriting e design" },
  { id: "4", name: "Setup CRM + Automação", category: "automacao", basePrice: 5000, type: "pontual", description: "Implementação completa de CRM com fluxos automatizados" },
  { id: "5", name: "Chatbot IA (N8N + GPT)", category: "automacao", basePrice: 6000, type: "recorrente", description: "Chatbot inteligente com integração WhatsApp" },
  { id: "6", name: "Pacote Completo (Tráfego + LP)", category: "trafego", basePrice: 5500, type: "recorrente", description: "Gestão de tráfego com landing pages inclusas" },
  { id: "7", name: "Consultoria Estratégica", category: "consultoria", basePrice: 2000, type: "pontual", description: "Sessão de consultoria com análise de funil e recomendações" },
];

const categoryConfig: Record<string, { label: string; className: string }> = {
  trafego: { label: "Tráfego", className: "bg-primary/10 text-primary" },
  automacao: { label: "Automação", className: "bg-info/10 text-info" },
  lp: { label: "Landing Page", className: "bg-warning/10 text-warning" },
  consultoria: { label: "Consultoria", className: "bg-success/10 text-success" },
};

const Produtos = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Omit<Product, "id">>({ name: "", category: "trafego", basePrice: 0, type: "recorrente", description: "" });

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos/pacotes cadastrados</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
      </div>

      <ContextFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar produtos..."
        filterGroups={[{
          key: "cat", label: "Categoria",
          options: [
            { label: "Todos", value: "all" },
            { label: "Tráfego", value: "trafego" },
            { label: "Automação", value: "automacao" },
            { label: "Landing Page", value: "lp" },
            { label: "Consultoria", value: "consultoria" },
          ],
        }]}
        activeFilters={{ cat: catFilter }}
        onFilterChange={(_, v) => setCatFilter(v)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const cat = categoryConfig[p.category];
          return (
            <div key={p.id} className="metric-card">
              <div className="flex items-start justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditProduct({ ...p })} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold mb-1">{p.name}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${cat.className}`}>{cat.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.type === "recorrente" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {p.type === "recorrente" ? "Recorrente" : "Pontual"}
                  </span>
                </div>
                <span className="text-sm font-bold">R$ {p.basePrice.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Nome do produto" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Descrição" value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value as any }))}>
              <option value="trafego">Tráfego</option><option value="automacao">Automação</option><option value="lp">Landing Page</option><option value="consultoria">Consultoria</option>
            </select>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={newProduct.type} onChange={e => setNewProduct(p => ({ ...p, type: e.target.value as any }))}>
              <option value="recorrente">Recorrente</option><option value="pontual">Pontual</option>
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" placeholder="Preço Base (R$)" value={newProduct.basePrice || ""} onChange={e => setNewProduct(p => ({ ...p, basePrice: Number(e.target.value) }))} />
          </div>
          <DialogFooter><Button onClick={() => { if (newProduct.name) { setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() }]); setNewProduct({ name: "", category: "trafego", basePrice: 0, type: "recorrente", description: "" }); setShowAdd(false); } }}>Adicionar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Produto</DialogTitle></DialogHeader>
          {editProduct && <div className="space-y-3">
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} />
            <input className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editProduct.description} onChange={e => setEditProduct({ ...editProduct, description: e.target.value })} />
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editProduct.category} onChange={e => setEditProduct({ ...editProduct, category: e.target.value as any })}>
              <option value="trafego">Tráfego</option><option value="automacao">Automação</option><option value="lp">Landing Page</option><option value="consultoria">Consultoria</option>
            </select>
            <select className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm" value={editProduct.type} onChange={e => setEditProduct({ ...editProduct, type: e.target.value as any })}>
              <option value="recorrente">Recorrente</option><option value="pontual">Pontual</option>
            </select>
            <input type="number" className="w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none" value={editProduct.basePrice} onChange={e => setEditProduct({ ...editProduct, basePrice: Number(e.target.value) })} />
          </div>}
          <DialogFooter><Button onClick={() => { if (editProduct) { setProducts(p => p.map(pr => pr.id === editProduct.id ? editProduct : pr)); setEditProduct(null); } }}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { setProducts(p => p.filter(pr => pr.id !== deleteId)); setDeleteId(null); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
