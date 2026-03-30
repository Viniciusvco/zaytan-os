import {
  LayoutDashboard,
  Users,
  Kanban,
  DollarSign,
  Lightbulb,
  FolderOpen,
  Brain,
  Target,
  ClipboardList,
  HeadphonesIcon,
  FileText,
  Calendar,
  Globe,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import zaytanLogo from "@/assets/zaytan-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pipeline", url: "/pipeline", icon: Kanban },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Projetos", url: "/projetos", icon: FolderOpen },
  { title: "Contratos", url: "/contratos", icon: FileText },
];

const operationItems = [
  { title: "Comercial", url: "/comercial", icon: Target },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Operacional", url: "/operacional", icon: ClipboardList },
  { title: "Customer Success", url: "/cs", icon: HeadphonesIcon },
  { title: "Agendamentos", url: "/agendamentos", icon: Calendar },
  { title: "Captação de Leads", url: "/captacao", icon: Globe },
];

const strategyItems = [
  { title: "Estratégia & IA", url: "/estrategia", icon: Lightbulb },
  { title: "Zaytan Mind", url: "/zaytan-mind", icon: Brain },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderItems = (items: typeof mainItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className="hover:bg-sidebar-accent/50"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

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
              <p className="text-[10px] text-muted-foreground">Strategic Hub</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(mainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operationItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Inteligência</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(strategyItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Zaytan OS v4.0</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
