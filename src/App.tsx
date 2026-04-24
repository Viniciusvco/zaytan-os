import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { ClientRoleProvider } from "@/contexts/ClientRoleContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import CRM from "./pages/CRM";
import Usuarios from "./pages/Usuarios";
import ClientUsersManagement from "./pages/ClientUsersManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function HomeRedirect() {
  const { role } = useRole();
  if (role === "cliente") return <Navigate to="/crm" replace />;
  return <Navigate to="/crm" replace />;
}

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
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/usuarios" element={<Usuarios />} />
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
