import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "cliente";
export type LossReason = "nao_atende" | "sem_interesse" | "concorrente" | "dados_incorretos" | "sem_perfil" | "outros";

export const lossReasonLabels: Record<LossReason, string> = {
  nao_atende: "NÃO ATENDE / NÃO RESPONDE",
  sem_interesse: "SEM INTERESSE",
  concorrente: "FECHOU COM CONCORRENTE",
  dados_incorretos: "DADOS INCORRETOS",
  sem_perfil: "SEM PERFIL FINANCEIRO",
  outros: "OUTROS",
};

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  whiteLabel: { primaryColor: string; companyName: string };
  currentUser: { name: string; email: string };
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [role, setRole] = useState<UserRole>("admin");

  useEffect(() => {
    if (profile) {
      // Tratar 'colaborador' (legado) como cliente para não travar acesso
      setRole(profile.role === "admin" ? "admin" : "cliente");
    }
  }, [profile]);

  const whiteLabel = { primaryColor: "#FF6E27", companyName: "Zaytan" };

  const currentUser = profile
    ? { name: profile.full_name, email: profile.email }
    : { name: "Carregando...", email: "" };

  return (
    <RoleContext.Provider value={{ role, setRole, whiteLabel, currentUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
