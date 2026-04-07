import {
  LayoutDashboard, Users, DollarSign, Package, Target, HeadphonesIcon,
  FileText, BarChart3, Kanban, UserCog, Briefcase, Rocket, GraduationCap, MessageSquare,
  Settings, Bot,
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
    { title: "Financeiro", url: "/financeiro", icon: DollarSign },
    { title: "Produtos", url: "/produtos", icon: Package },
    { title: "Contratos", url: "/contratos", icon: FileText },
  ],
  operacao: [
    { title: "Demandas", url: "/demandas", icon: Kanban },
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Comercial", url: "/comercial", icon: Briefcase },
    { title: "Performance", url: "/performance", icon: BarChart3 },
  ],
  gestao: [
    { title: "Equipe (PDI)", url: "/equipe", icon: HeadphonesIcon },
    { title: "Usuários", url: "/usuarios", icon: UserCog },
    { title: "Academy", url: "/academy", icon: GraduationCap },
  ],
};

const colaboradorItems = {
  gestor: {
    principal: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Performance", url: "/performance", icon: BarChart3 },
    ],
    operacao: [
      { title: "Demandas", url: "/demandas", icon: Kanban },
      { title: "CRM", url: "/crm", icon: Target },
    ],
    formacao: [
      { title: "Academy", url: "/academy", icon: GraduationCap },
    ],
  },
  designer: {
    principal: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
    operacao: [
      { title: "Demandas", url: "/demandas", icon: Kanban },
    ],
    formacao: [
      { title: "Academy", url: "/academy", icon: GraduationCap },
    ],
  },
  cs: {
    principal: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
    operacao: [
      { title: "Demandas", url: "/demandas", icon: Kanban },
      { title: "CRM", url: "/crm", icon: Target },
    ],
    formacao: [
      { title: "Academy", url: "/academy", icon: GraduationCap },
    ],
  },
};

const clienteItems = {
  principal: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Demandas", url: "/demandas", icon: Kanban },
    { title: "CRM", url: "/crm", icon: Target },
  ],
  sucesso: [
    { title: "Feedbacks", url: "/feedbacks", icon: MessageSquare },
    { title: "Minha Equipe", url: "/minha-equipe", icon: Users },
    { title: "Suporte", url: "/suporte", icon: Bot },
  ],
  aprender: [
    { title: "Academy", url: "/academy", icon: GraduationCap },
  ],
  config: [
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, colaboradorType, whiteLabel, trainingComplete } = useRole();

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

  let groups: Record<string, { title: string; url: string; icon: any }[]>;

  if (role === "admin") {
    groups = adminItems;
  } else if (role === "colaborador") {
    if (!trainingComplete) {
      groups = { formacao: [{ title: "Academy", url: "/academy", icon: GraduationCap }] };
    } else {
      groups = colaboradorItems[colaboradorType];
    }
  } else {
    groups = clienteItems;
  }

  const groupLabels: Record<string, string> = {
    principal: "Principal", operacao: "Operação", gestao: "Gestão",
    config: "Configuração", formacao: "Formação", sucesso: "Sucesso",
    aprender: "Aprender", feedback: "Sucesso",
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
                {role === "admin" ? "Admin" : role === "colaborador"
                  ? (colaboradorType === "gestor" ? "Gestor" : colaboradorType === "designer" ? "Designer" : "CS")
                  : "Cliente"}
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
              <SidebarMenu>{renderItems(items)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Zaytan OS v8.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
