
-- Lead distribution status enum
CREATE TYPE public.lead_queue_status AS ENUM (
  'pendente',
  'em_processamento',
  'distribuido',
  'duplicado',
  'expirado',
  'estoque'
);

-- Distribution rule enum
CREATE TYPE public.distribution_rule AS ENUM (
  'proporcional',
  'estoque',
  'redistribuicao',
  'manual'
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  total_investment NUMERIC NOT NULL DEFAULT 0,
  stock_expiry_days INTEGER NOT NULL DEFAULT 7,
  active BOOLEAN NOT NULL DEFAULT true,
  min_lead_goal INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to campaigns"
  ON public.campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Campaign clients (participation)
CREATE TABLE public.campaign_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  investment_amount NUMERIC NOT NULL DEFAULT 0,
  weight_percent NUMERIC NOT NULL DEFAULT 0,
  weight_override BOOLEAN NOT NULL DEFAULT false,
  daily_limit INTEGER DEFAULT NULL,
  accumulated_balance NUMERIC NOT NULL DEFAULT 0,
  paused BOOLEAN NOT NULL DEFAULT false,
  leads_received_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, client_id)
);

ALTER TABLE public.campaign_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to campaign_clients"
  ON public.campaign_clients FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_campaign_clients_updated_at
  BEFORE UPDATE ON public.campaign_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Lead queue
CREATE TABLE public.lead_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT,
  status public.lead_queue_status NOT NULL DEFAULT 'pendente',
  assigned_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  stock_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  distribution_rule public.distribution_rule DEFAULT NULL,
  distributed_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  raw_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to lead_queue"
  ON public.lead_queue FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_lead_queue_updated_at
  BEFORE UPDATE ON public.lead_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for deduplication
CREATE INDEX idx_lead_queue_phone ON public.lead_queue(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_lead_queue_email ON public.lead_queue(email) WHERE email IS NOT NULL;
CREATE INDEX idx_lead_queue_status ON public.lead_queue(status);
CREATE INDEX idx_lead_queue_campaign ON public.lead_queue(campaign_id);
CREATE INDEX idx_lead_queue_assigned ON public.lead_queue(assigned_client_id);
CREATE INDEX idx_lead_queue_stock ON public.lead_queue(stock_client_id) WHERE stock_client_id IS NOT NULL;

-- Distribution logs (audit)
CREATE TABLE public.distribution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_queue_id UUID NOT NULL REFERENCES public.lead_queue(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  rule_applied public.distribution_rule NOT NULL,
  weight_at_distribution NUMERIC NOT NULL DEFAULT 0,
  accumulated_balance_at NUMERIC NOT NULL DEFAULT 0,
  status_before public.lead_queue_status NOT NULL,
  status_after public.lead_queue_status NOT NULL,
  performed_by UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.distribution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to distribution_logs"
  ON public.distribution_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_distribution_logs_lead ON public.distribution_logs(lead_queue_id);
CREATE INDEX idx_distribution_logs_client ON public.distribution_logs(client_id);
CREATE INDEX idx_distribution_logs_campaign ON public.distribution_logs(campaign_id);
