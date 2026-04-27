-- 1. Add can_create_users flag on clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS can_create_users BOOLEAN NOT NULL DEFAULT true;

-- 2. Create credentials table
CREATE TABLE IF NOT EXISTS public.created_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_by_user_id UUID,
  client_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.created_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to created_credentials"
ON public.created_credentials
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Creator can view own created credentials"
ON public.created_credentials
FOR SELECT
TO authenticated
USING (created_by_user_id = auth.uid());

CREATE POLICY "Client managers can view their client's credentials"
ON public.created_credentials
FOR SELECT
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid())
  AND public.get_user_client_role(auth.uid()) IN ('gerente'::client_role_type, 'supervisor'::client_role_type)
);

CREATE TRIGGER update_created_credentials_updated_at
BEFORE UPDATE ON public.created_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();