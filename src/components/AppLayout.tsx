import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Moon, Sun, Shield, Users, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useRole, UserRole } from "@/contexts/RoleContext";

const roleConfig: Record<UserRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: { label: "Admin", icon: Shield, className: "bg-primary/10 text-primary" },
  colaborador: { label: "Colaborador", icon: Users, className: "bg-info/10 text-info" },
  cliente: { label: "Cliente", icon: User, className: "bg-success/10 text-success" },
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const { role, setRole, currentUser } = useRole();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const rc = roleConfig[role];
  const RoleIcon = rc.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 shrink-0">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              {/* Role Switcher (mock) */}
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
              <span className="text-xs text-muted-foreground hidden sm:block">{currentUser.name}</span>
              <button onClick={() => setDark(!dark)} className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors">
                {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              </button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
