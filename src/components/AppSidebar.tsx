import {
  LayoutDashboard, Users, DollarSign, Package, Target, HeadphonesIcon,
  FileText, BarChart3, Kanban, UserCog, Briefcase, Rocket, GraduationCap, MessageSquare,
  Settings, Bot, CreditCard,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole } from "@/contexts/RoleContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
    { title: "Motor Revisional", url: "/contratos", icon: FileText },
  ],
  operacao: [
    { title: "Demandas", url: "/demandas", icon: Kanban },
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Comercial", url: "/comercial", icon: Briefcase },
    { title: "Performance", url: "/performance", icon: BarChart3 },
    { title: "Contratos & Pagamentos", url: "/visao-contratos", icon: CreditCard },
  ],
  gestao: [
    { title: "Equipe (PDI)", url: "/equipe", icon: HeadphonesIcon },
    { title: "Usuários", url: "/usuarios", icon: UserCog },
    { title: "Treinamentos", url: "/academy", icon: GraduationCap },
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
      { title: "Treinamentos", url: "/academy", icon: GraduationCap },
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
      { title: "Treinamentos", url: "/academy", icon: GraduationCap },
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
      { title: "Treinamentos", url: "/academy", icon: GraduationCap },
    ],
  },
};

// Default client views: CRM, Contratos, Treinamentos, Onboarding, Performance, Gestão de Acessos
const clienteItems = {
  principal: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "CRM", url: "/crm", icon: Target },
    { title: "Performance", url: "/client-performance", icon: BarChart3 },
    { title: "Contratos", url: "/visao-contratos", icon: CreditCard },
  ],
  gestao: [
    { title: "Gestão de Acessos", url: "/client-users", icon: UserCog },
  ],
  aprender: [
    { title: "Treinamentos", url: "/academy", icon: GraduationCap },
  ],
  config: [
    { title: "Onboarding", url: "/onboarding", icon: Rocket },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, colaboradorType, whiteLabel, trainingComplete } = useRole();
  const { user } = useAuth();

  // Fetch visibility config for client role
  const { data: visibilityConfig } = useQuery({
    queryKey: ["my-visibility-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_visibility_config").select("hidden_views");
      if (error) return null;
      return data?.[0] || null;
    },
    enabled: role === "cliente",
  });

  const hiddenViews: string[] = (visibilityConfig as any)?.hidden_views || [];

  const filterHidden = (items: { title: string; url: string; icon: any }[]) => {
    if (role !== "cliente" || hiddenViews.length === 0) return items;
    return items.filter(item => {
      const viewKey = item.url.replace("/", "");
      return !hiddenViews.includes(viewKey);
    });
  };

  const renderItems = (items: { title: string; url: string; icon: any }[]) =>
    filterHidden(items).map((item) => (
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
      groups = { formacao: [{ title: "Treinamentos", url: "/academy", icon: GraduationCap }] };
    } else {
      groups = colaboradorItems[colaboradorType];
    }
  } else {
    groups = clienteItems;
  }

  // Determine which groups are "coming soon" based on role
  const comingSoonGroups = new Set<string>();
  if (role === "colaborador") {
    Object.keys(groups).forEach(k => comingSoonGroups.add(k));
  }

  const baseLabels: Record<string, string> = {
    principal: "Principal", operacao: "Operação", gestao: "Gestão",
    config: "Configuração", formacao: "Formação", sucesso: "Sucesso",
    aprender: "Aprender", feedback: "Sucesso",
  };

  const groupLabels: Record<string, string> = {};
  for (const key of Object.keys(baseLabels)) {
    groupLabels[key] = comingSoonGroups.has(key) ? `${baseLabels[key]} (Em breve)` : baseLabels[key];
  }

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
        {Object.entries(groups).map(([key, items]) => {
          const visibleItems = filterHidden(items);
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={key}>
              <SidebarGroupLabel>{groupLabels[key] || key}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(items)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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