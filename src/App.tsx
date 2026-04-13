import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { ClientRoleProvider } from "@/contexts/ClientRoleContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Produtos from "./pages/Produtos";
import Contratos from "./pages/Contratos";
import Financeiro from "./pages/Financeiro";
import Comercial from "./pages/Comercial";
import Performance from "./pages/Performance";
import Demandas from "./pages/Demandas";
import CRM from "./pages/CRM";
import VisaoContratos from "./pages/VisaoContratos";
import Onboarding from "./pages/Onboarding";
import Equipe from "./pages/Equipe";
import Usuarios from "./pages/Usuarios";
import Academy from "./pages/Academy";
import Feedbacks from "./pages/Feedbacks";
import SupportChat from "./pages/SupportChat";
import MinhaEquipe from "./pages/MinhaEquipe";
import ClientPerformance from "./pages/ClientPerformance";
import ClientUsersManagement from "./pages/ClientUsersManagement";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <RoleProvider>
      <ClientRoleProvider>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/contratos" element={<Contratos />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/comercial" element={<Comercial />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/visao-contratos" element={<VisaoContratos />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/feedbacks" element={<Feedbacks />} />
            <Route path="/suporte" element={<SupportChat />} />
            <Route path="/minha-equipe" element={<MinhaEquipe />} />
            <Route path="/client-performance" element={<ClientPerformance />} />
            <Route path="/client-users" element={<ClientUsersManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </ClientRoleProvider>
    </RoleProvider>
  );
}

function AuthRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
