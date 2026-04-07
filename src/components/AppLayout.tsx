import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun, Shield, Users, User, Eye, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRole, UserRole, ColaboradorSubtype } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { ClientBanners } from "@/components/ClientBanners";

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: { label: "Admin", icon: Shield, className: "bg-primary/10 text-primary" },
  colaborador: { label: "Colaborador", icon: Users, className: "bg-info/10 text-info" },
  cliente: { label: "Cliente", icon: User, className: "bg-success/10 text-success" },
};

const subtypeLabels: Record<ColaboradorSubtype, string> = {
  gestor: "Gestor de Tráfego",
  designer: "Designer",
  cs: "CS / Atendimento",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const { role, setRole, colaboradorType, setColaboradorType, currentUser, trainingComplete } = useRole();
  const { signOut, profile } = useAuth();
  const [showSimulator, setShowSimulator] = useState(false);
  const isRealAdmin = profile?.role === "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const isLocked = role === "colaborador" && !trainingComplete;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Client banners (payment + feedback) */}
          <ClientBanners />
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              {/* Role Switcher */}
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {(["admin", "colaborador", "cliente"] as UserRole[]).map((r) => {
                  const cfg = roleConfig[r];
                  const Icon = cfg.icon;
                  return (
                    <button key={r} onClick={() => setRole(r)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1 ${role === r ? `${cfg.className} shadow-sm` : "text-muted-foreground hover:text-foreground"}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {role === "colaborador" && (
                <select
                  value={colaboradorType}
                  onChange={e => setColaboradorType(e.target.value as ColaboradorSubtype)}
                  className="h-7 px-2 rounded-md bg-muted border-0 text-[10px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {(Object.entries(subtypeLabels) as [ColaboradorSubtype, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              )}

              {role === "admin" && (
                <div className="relative">
                  <button onClick={() => setShowSimulator(!showSimulator)}
                    className="h-7 px-2 rounded-md bg-muted text-[10px] font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Simular
                  </button>
                  {showSimulator && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSimulator(false)} />
                      <div className="absolute right-0 top-8 z-50 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-3 pt-2 pb-1">Simular Visão</p>
                        {[
                          { role: "admin" as UserRole, sub: undefined, label: "Sócio / Admin" },
                          { role: "cliente" as UserRole, sub: undefined, label: "Cliente" },
                          { role: "colaborador" as UserRole, sub: "gestor" as ColaboradorSubtype, label: "Gestor de Tráfego" },
                          { role: "colaborador" as UserRole, sub: "designer" as ColaboradorSubtype, label: "Designer" },
                          { role: "colaborador" as UserRole, sub: "cs" as ColaboradorSubtype, label: "CS / Atendimento" },
                        ].map(opt => (
                          <button key={opt.label} onClick={() => {
                            setRole(opt.role);
                            if (opt.sub) setColaboradorType(opt.sub);
                            setShowSimulator(false);
                          }} className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 transition-colors">
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <NotificationBell />
              <span className="text-xs text-muted-foreground hidden sm:block">{currentUser.name}</span>
              <button onClick={() => setDark(!dark)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {isLocked ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="h-16 w-16 rounded-2xl bg-warning/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-warning" />
                </div>
                <h2 className="text-lg font-bold">Treinamento Obrigatório</h2>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Complete todos os treinamentos obrigatórios na Academy antes de acessar o sistema.
                </p>
              </div>
            ) : children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
