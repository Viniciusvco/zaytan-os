import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin" | "colaborador" | "cliente";
export type ColaboradorSubtype = "gestor" | "designer" | "cs";

interface WhiteLabelConfig {
  logo?: string;
  primaryColor: string;
  companyName: string;
}

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  colaboradorType: ColaboradorSubtype;
  setColaboradorType: (type: ColaboradorSubtype) => void;
  whiteLabel: WhiteLabelConfig;
  setWhiteLabel: (config: WhiteLabelConfig) => void;
  currentUser: { name: string; email: string };
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  trainingComplete: boolean;
  setTrainingComplete: (v: boolean) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("admin");
  const [colaboradorType, setColaboradorType] = useState<ColaboradorSubtype>("gestor");
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig>({
    primaryColor: "#FF6E27",
    companyName: "Zaytan",
  });
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(true);

  const currentUser = {
    admin: { name: "Admin Zaytan", email: "admin@zaytan.com" },
    colaborador: { name: "João Silva", email: "joao@zaytan.com" },
    cliente: { name: "Escritório Silva", email: "contato@silva.adv.br" },
  }[role];

  return (
    <RoleContext.Provider value={{
      role, setRole, colaboradorType, setColaboradorType,
      whiteLabel, setWhiteLabel, currentUser,
      onboardingComplete, setOnboardingComplete,
      trainingComplete, setTrainingComplete,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
