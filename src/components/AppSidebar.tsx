import {
  LayoutDashboard, Users, DollarSign, Package, Target, HeadphonesIcon,
  FileText, BarChart3, Kanban, UserCog, Briefcase, Rocket,
} from "lucide-react";
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
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Clientes", url: "/clientes", icon: Users },
    { title: "Produtos", url: "/produtos", icon: Package },
    { title: "Contratos", url: "/contratos", icon: FileText },
  ],
  operacao: [
    { title: "Demandas", url: "/demandas", icon: Kanban },
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Comercial", url: "/comercial", icon: Briefcase },
    { title: "Financeiro", url: "/financeiro", icon: DollarSign },
    { title: "Performance", url: "/performance", icon: BarChart3 },
  ],
  gestao: [
    { title: "Equipe (PDI)", url: "/equipe", icon: HeadphonesIcon },
    { title: "Usuários", url: "/usuarios", icon: UserCog },
  ],
};

const colaboradorItems = {
  principal: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Demandas", url: "/demandas", icon: Kanban },
  ],
  operacao: [
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Performance", url: "/performance", icon: BarChart3 },
  ],
};

const clienteItems = {
  principal: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Demandas", url: "/demandas", icon: Kanban },
    { title: "CRM", url: "/crm", icon: Target },
  ],
  setup: [
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, whiteLabel } = useRole();

  const renderItems = (items: { title: string; url: string; icon: any }[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink to={item.url} end={item.url === "/"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-primary font-medium">
            <item.icon className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  const groups = role === "admin" ? adminItems : role === "colaborador" ? colaboradorItems : clienteItems;
  const groupLabels: Record<string, string> = {
    principal: "Principal", operacao: "Operação", gestao: "Gestão", setup: "Configuração",
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
              <h2 className="text-sm font-bold text-foreground tracking-tight">{whiteLabel.companyName} OS</h2>
              <p className="text-[10px] text-muted-foreground capitalize">{role === "admin" ? "Admin" : role === "colaborador" ? "Equipe" : "Cliente"}</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {Object.entries(groups).map(([key, items]) => (
          <SidebarGroup key={key}>
            <SidebarGroupLabel>{groupLabels[key] || key}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(items)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{whiteLabel.companyName} OS v6.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
