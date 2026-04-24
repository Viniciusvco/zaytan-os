import { Target, UserCog } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole } from "@/contexts/RoleContext";
import zaytanLogo from "@/assets/zaytan-logo.png";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const adminItems = {
  principal: [
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Usuários", url: "/usuarios", icon: UserCog },
  ],
};

const clienteItems = {
  principal: [
    { title: "CRM", url: "/crm", icon: Target },
  ],
  gestao: [
    { title: "Gestão de Acessos", url: "/client-users", icon: UserCog },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useRole();

  const groups = role === "admin" ? adminItems : clienteItems;

  const groupLabels: Record<string, string> = {
    principal: "Principal",
    gestao: "Gestão",
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 overflow-hidden">
            <img src={zaytanLogo} alt="Zaytan" className="h-9 w-9 object-cover" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Zaytan OS</h2>
              <p className="text-[10px] text-muted-foreground capitalize">
                {role === "admin" ? "Admin" : "Cliente"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groups).map(([key, items]) => (
          <SidebarGroup key={key}>
            <SidebarGroupLabel>{groupLabels[key] || key}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Zaytan OS v9.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
