
-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador', 'cliente');
CREATE TYPE public.colaborador_subtype AS ENUM ('gestor', 'designer', 'cs');
CREATE TYPE public.contract_status AS ENUM ('rascunho', 'ativo', 'cancelado', 'aguardando');
CREATE TYPE public.lead_status AS ENUM ('novo', 'contatado', 'qualificado', 'proposta', 'fechado', 'perdido');
CREATE TYPE public.loss_reason_type AS ENUM ('nao_atende', 'sem_interesse', 'concorrente', 'dados_incorretos', 'sem_perfil');
CREATE TYPE public.financial_type AS ENUM ('receita', 'despesa');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'atrasado');
CREATE TYPE public.demand_status AS ENUM ('backlog', 'em_progresso', 'revisao', 'concluido');
CREATE TYPE public.demand_priority AS ENUM ('baixa', 'media', 'alta', 'critica');
CREATE TYPE public.demand_specialty AS ENUM ('trafego', 'design', 'cs');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========= TABLES =========

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role app_role NOT NULL DEFAULT 'cliente',
  colaborador_type colaborador_subtype,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#FF6E27',
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  setup_value NUMERIC(12,2) DEFAULT 0,
  mrr_value NUMERIC(12,2) DEFAULT 0,
  weekly_investment NUMERIC(12,2) DEFAULT 0,
  status contract_status NOT NULL DEFAULT 'rascunho',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  min_price NUMERIC(12,2) DEFAULT 0,
  max_price NUMERIC(12,2) DEFAULT 0,
  recurrence TEXT DEFAULT 'mensal',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'meta_ads',
  status lead_status NOT NULL DEFAULT 'novo',
  value NUMERIC(12,2),
  loss_reason loss_reason_type,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_distribution_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  investment_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  period_start DATE,
  period_end DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  type financial_type NOT NULL,
  category TEXT,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE,
  paid_date DATE,
  status payment_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status demand_status NOT NULL DEFAULT 'backlog',
  priority demand_priority NOT NULL DEFAULT 'media',
  specialty demand_specialty,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========= ENABLE RLS =========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_distribution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- ========= FUNCTIONS (after tables exist) =========

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _client_id UUID;
BEGIN
  SELECT id INTO _client_id FROM public.clients WHERE user_id = _user_id LIMIT 1;
  RETURN _client_id;
END;
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'cliente')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========= TRIGGERS =========
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lead_dist_updated_at BEFORE UPDATE ON public.lead_distribution_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_financial_updated_at BEFORE UPDATE ON public.financial_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_demands_updated_at BEFORE UPDATE ON public.demands FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========= RLS POLICIES =========

-- Profiles
CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User roles
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Clients
CREATE POLICY "Admins full access to clients" ON public.clients FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own record" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Colaboradores can view assigned clients" ON public.clients FOR SELECT USING (
  assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Contracts
CREATE POLICY "Admins full access to contracts" ON public.contracts FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own contracts" ON public.contracts FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()));

-- Products
CREATE POLICY "Admins full access to products" ON public.products FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Everyone can view active products" ON public.products FOR SELECT TO authenticated USING (active = true);

-- Leads
CREATE POLICY "Admins full access to leads" ON public.leads FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own leads" ON public.leads FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Clients can update own leads" ON public.leads FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()));

-- Lead distribution config
CREATE POLICY "Admins full access to lead_distribution_config" ON public.lead_distribution_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Financial records
CREATE POLICY "Admins full access to financial_records" ON public.financial_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own financial_records" ON public.financial_records FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()));

-- Demands
CREATE POLICY "Admins full access to demands" ON public.demands FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients can view own demands" ON public.demands FOR SELECT USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Clients can insert own demands" ON public.demands FOR INSERT WITH CHECK (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Clients can update own demands" ON public.demands FOR UPDATE USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Colaboradores can view assigned demands" ON public.demands FOR SELECT USING (
  assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);
