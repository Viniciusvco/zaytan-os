import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun, Shield, User, Eye, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: { label: "Admin", icon: Shield, className: "bg-primary/10 text-primary" },
  cliente: { label: "Cliente", icon: User, className: "bg-success/10 text-success" },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const { role, setRole, currentUser } = useRole();
  const { signOut, profile } = useAuth();
  const [showSimulator, setShowSimulator] = useState(false);
  const isRealAdmin = profile?.role === "admin";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              {isRealAdmin && (
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  {(["admin", "cliente"] as UserRole[]).map((r) => {
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
              )}

              {isRealAdmin && (
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
                          { role: "admin" as UserRole, label: "Admin" },
                          { role: "cliente" as UserRole, label: "Cliente" },
                        ].map(opt => (
                          <button key={opt.label} onClick={() => {
                            setRole(opt.role);
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

              <span className="text-xs text-muted-foreground hidden sm:block">{currentUser.name}</span>
              <button onClick={() => setDark(!dark)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </button>
              <button onClick={signOut} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors" title="Sair">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
