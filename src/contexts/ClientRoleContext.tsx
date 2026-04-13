import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";

export type ClientRole = "gerente" | "supervisor" | "vendedor";

interface ClientUserRole {
  id: string;
  user_id: string;
  client_id: string;
  client_role: ClientRole;
  supervisor_id: string | null;
}

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  client_role: ClientRole;
  supervisor_id: string | null;
}

interface ClientRoleContextType {
  clientRole: ClientRole | null;
  clientId: string | null;
  myProfileId: string | null;
  teamMembers: TeamMember[];
  /** IDs de profiles visíveis baseado no role */
  visibleProfileIds: string[];
  /** Vendedores visíveis para filtro */
  visibleVendedores: TeamMember[];
  loading: boolean;
  refetchTeam: () => void;
}

const ClientRoleContext = createContext<ClientRoleContextType | null>(null);

export function ClientRoleProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const { role } = useRole();
  const [clientRole, setClientRole] = useState<ClientRole | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientRole = async () => {
    if (!profile || role !== "cliente") {
      setLoading(false);
      return;
    }

    // Get client_id from clients table
    const { data: clientData } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", profile.user_id)
      .single();

    if (!clientData) {
      setLoading(false);
      return;
    }

    setClientId(clientData.id);
    setMyProfileId(profile.id);

    // Get my client role
    const { data: roleData } = await supabase
      .from("client_user_roles")
      .select("*")
      .eq("client_id", clientData.id)
      .eq("user_id", profile.id)
      .single();

    if (roleData) {
      setClientRole(roleData.client_role as ClientRole);
    } else {
      // Default to gerente for the client owner
      setClientRole("gerente");
    }

    // Fetch all team members for this client
    await fetchTeamMembers(clientData.id);
    setLoading(false);
  };

  const fetchTeamMembers = async (cId?: string) => {
    const id = cId || clientId;
    if (!id) return;

    const { data: roles } = await supabase
      .from("client_user_roles")
      .select("id, user_id, client_role, supervisor_id")
      .eq("client_id", id);

    if (!roles || roles.length === 0) {
      setTeamMembers([]);
      return;
    }

    const userIds = roles.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (!profiles) {
      setTeamMembers([]);
      return;
    }

    const members: TeamMember[] = roles.map((r: any) => {
      const p = profiles.find((p: any) => p.id === r.user_id);
      return {
        id: r.id,
        user_id: r.user_id,
        full_name: p?.full_name || "—",
        email: p?.email || "",
        client_role: r.client_role as ClientRole,
        supervisor_id: r.supervisor_id,
      };
    });

    setTeamMembers(members);
  };

  useEffect(() => {
    fetchClientRole();
  }, [profile, role]);

  const visibleProfileIds = useMemo(() => {
    if (!myProfileId || !clientRole) return [];

    if (clientRole === "gerente") {
      // Gerente vê tudo
      return teamMembers.map(m => m.user_id);
    }

    if (clientRole === "supervisor") {
      // Supervisor vê seus vendedores + ele mesmo
      const myVendedores = teamMembers
        .filter(m => m.supervisor_id === myProfileId)
        .map(m => m.user_id);
      return [myProfileId, ...myVendedores];
    }

    // Vendedor vê a equipe do seu supervisor
    const myMember = teamMembers.find(m => m.user_id === myProfileId);
    if (myMember?.supervisor_id) {
      const teamMates = teamMembers
        .filter(m => m.supervisor_id === myMember.supervisor_id || m.user_id === myMember.supervisor_id)
        .map(m => m.user_id);
      return [myProfileId, ...teamMates];
    }

    return [myProfileId];
  }, [clientRole, myProfileId, teamMembers]);

  const visibleVendedores = useMemo(() => {
    return teamMembers.filter(
      m => visibleProfileIds.includes(m.user_id) && m.client_role === "vendedor"
    );
  }, [teamMembers, visibleProfileIds]);

  return (
    <ClientRoleContext.Provider
      value={{
        clientRole,
        clientId,
        myProfileId,
        teamMembers,
        visibleProfileIds,
        visibleVendedores,
        loading,
        refetchTeam: () => fetchTeamMembers(),
      }}
    >
      {children}
    </ClientRoleContext.Provider>
  );
}

export function useClientRole() {
  const ctx = useContext(ClientRoleContext);
  if (!ctx) throw new Error("useClientRole must be used within ClientRoleProvider");
  return ctx;
}
