import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "admin" | "colaborador" | "cliente";
export type ColaboradorSubtype = "gestor" | "designer" | "cs";
export type LossReason = "nao_atende" | "sem_interesse" | "concorrente" | "dados_incorretos" | "sem_perfil" | "outros";

export const lossReasonLabels: Record<LossReason, string> = {
  nao_atende: "NÃO ATENDE / NÃO RESPONDE",
  sem_interesse: "SEM INTERESSE",
  concorrente: "FECHOU COM CONCORRENTE",
  dados_incorretos: "DADOS INCORRETOS",
  sem_perfil: "SEM PERFIL FINANCEIRO",
  outros: "OUTROS",
};

export type PaymentStatus = "em_dia" | "atrasado" | "inadimplente";

export interface ClientPaymentInfo {
  clientName: string;
  status: PaymentStatus;
  dueDate: string;
  amount: number;
}

export const mockPayments: ClientPaymentInfo[] = [
  { clientName: "Escritório Silva Advocacia", status: "em_dia", dueDate: "2026-04-10", amount: 4500 },
  { clientName: "Clínica Estética Bella", status: "em_dia", dueDate: "2026-04-15", amount: 3200 },
  { clientName: "Imobiliária Nova Era", status: "atrasado", dueDate: "2026-03-25", amount: 6800 },
  { clientName: "E-commerce TechShop", status: "em_dia", dueDate: "2026-04-20", amount: 5500 },
  { clientName: "Construtora Horizonte", status: "inadimplente", dueDate: "2026-02-15", amount: 8000 },
  { clientName: "Studio Fitness", status: "em_dia", dueDate: "2026-04-18", amount: 2500 },
  { clientName: "Farmácia Vida", status: "em_dia", dueDate: "2026-04-22", amount: 3000 },
];

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  colaboradorType: ColaboradorSubtype;
  setColaboradorType: (type: ColaboradorSubtype) => void;
  whiteLabel: { primaryColor: string; companyName: string };
  currentUser: { name: string; email: string };
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  trainingComplete: boolean;
  setTrainingComplete: (v: boolean) => void;
  clientPaymentStatus: PaymentStatus;
  feedbackPending: boolean;
  setFeedbackPending: (v: boolean) => void;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  
  // Sync role from real profile, fallback to admin for dev
  const [role, setRole] = useState<UserRole>("admin");
  const [colaboradorType, setColaboradorType] = useState<ColaboradorSubtype>("gestor");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [trainingComplete, setTrainingComplete] = useState(true);
  const [feedbackPending, setFeedbackPending] = useState(false);

  useEffect(() => {
    if (profile) {
      setRole(profile.role);
      if (profile.colaborador_type) {
        setColaboradorType(profile.colaborador_type);
      }
    }
  }, [profile]);

  const whiteLabel = { primaryColor: "#FF6E27", companyName: "Zaytan" };
  // Default to "em_dia" — only show banners when there's actual payment issues
  const clientPaymentStatus: PaymentStatus = "em_dia";

  const currentUser = profile
    ? { name: profile.full_name, email: profile.email }
    : { name: "Carregando...", email: "" };

  return (
    <RoleContext.Provider value={{
      role, setRole, colaboradorType, setColaboradorType,
      whiteLabel, currentUser,
      onboardingComplete, setOnboardingComplete,
      trainingComplete, setTrainingComplete,
      clientPaymentStatus, feedbackPending, setFeedbackPending,
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
