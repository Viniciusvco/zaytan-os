-- Add supervisor_id to client_user_roles
ALTER TABLE public.client_user_roles 
ADD COLUMN supervisor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create vendor_goals table for client-level performance tracking
CREATE TABLE public.vendor_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendedor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month_ref date NOT NULL,
  target_value numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(vendedor_id, client_id, month_ref)
);

-- Enable RLS
ALTER TABLE public.vendor_goals ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins full access to vendor_goals"
ON public.vendor_goals FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Clients can view goals for their client
CREATE POLICY "Clients can view own vendor_goals"
ON public.vendor_goals FOR SELECT
TO authenticated
USING (client_id = get_user_client_id(auth.uid()));

-- Clients can insert goals for their client
CREATE POLICY "Clients can insert own vendor_goals"
ON public.vendor_goals FOR INSERT
TO authenticated
WITH CHECK (client_id = get_user_client_id(auth.uid()));

-- Clients can update goals for their client
CREATE POLICY "Clients can update own vendor_goals"
ON public.vendor_goals FOR UPDATE
TO authenticated
USING (client_id = get_user_client_id(auth.uid()));

-- Timestamp trigger
CREATE TRIGGER update_vendor_goals_updated_at
BEFORE UPDATE ON public.vendor_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();