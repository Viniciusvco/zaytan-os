
-- Enum for client-level roles
CREATE TYPE public.client_role_type AS ENUM ('vendedor', 'supervisor', 'gerente');

-- Enum for juridico CRM statuses
CREATE TYPE public.juridico_status AS ENUM ('analise_documentacao', 'protocolo_administrativo', 'ajuizado', 'concluido');

-- Client user roles table
CREATE TABLE public.client_user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_role client_role_type NOT NULL DEFAULT 'vendedor',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (client_id, user_id)
);

ALTER TABLE public.client_user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to client_user_roles"
  ON public.client_user_roles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own client roles"
  ON public.client_user_roles FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Juridico cards table
CREATE TABLE public.juridico_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status juridico_status NOT NULL DEFAULT 'analise_documentacao',
  laudo_url TEXT,
  contrato_url TEXT,
  notes TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.juridico_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to juridico_cards"
  ON public.juridico_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own juridico cards"
  ON public.juridico_cards FOR SELECT
  TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can update own juridico cards"
  ON public.juridico_cards FOR UPDATE
  TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

-- Payment tracking table
CREATE TABLE public.payment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  seller_name TEXT,
  valor_parcela NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to payment_tracking"
  ON public.payment_tracking FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own payments"
  ON public.payment_tracking FOR SELECT
  TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

CREATE POLICY "Clients can update own payments"
  ON public.payment_tracking FOR UPDATE
  TO authenticated
  USING (client_id = get_user_client_id(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_client_user_roles_updated_at
  BEFORE UPDATE ON public.client_user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_juridico_cards_updated_at
  BEFORE UPDATE ON public.juridico_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_tracking_updated_at
  BEFORE UPDATE ON public.payment_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
