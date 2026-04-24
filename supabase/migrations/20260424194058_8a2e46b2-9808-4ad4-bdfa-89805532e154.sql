
-- Update get_user_client_id to also check client_user_roles membership
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _client_id UUID;
  _profile_id UUID;
BEGIN
  -- Owner case
  SELECT id INTO _client_id FROM public.clients WHERE user_id = _user_id LIMIT 1;
  IF _client_id IS NOT NULL THEN
    RETURN _client_id;
  END IF;

  -- Member case via client_user_roles
  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  IF _profile_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT client_id INTO _client_id
  FROM public.client_user_roles
  WHERE user_id = _profile_id
  LIMIT 1;

  RETURN _client_id;
END;
$function$;

-- Helper: get client_role for a given auth user
CREATE OR REPLACE FUNCTION public.get_user_client_role(_user_id uuid)
RETURNS public.client_role_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _profile_id UUID;
  _role public.client_role_type;
BEGIN
  SELECT id INTO _profile_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
  IF _profile_id IS NULL THEN
    -- If user is the client owner (no client_user_role row), treat as gerente
    IF EXISTS (SELECT 1 FROM public.clients WHERE user_id = _user_id) THEN
      RETURN 'gerente'::public.client_role_type;
    END IF;
    RETURN NULL;
  END IF;

  SELECT client_role INTO _role
  FROM public.client_user_roles
  WHERE user_id = _profile_id
  LIMIT 1;

  IF _role IS NULL AND EXISTS (SELECT 1 FROM public.clients WHERE user_id = _user_id) THEN
    RETURN 'gerente'::public.client_role_type;
  END IF;

  RETURN _role;
END;
$function$;

-- Drop old SELECT/INSERT policies on laudos_avulsos and recreate with role-aware logic
DROP POLICY IF EXISTS "Clients can view own laudos_avulsos" ON public.laudos_avulsos;
DROP POLICY IF EXISTS "Clients can insert own laudos_avulsos" ON public.laudos_avulsos;

-- SELECT: gerente/supervisor see all client laudos; vendedor only own
CREATE POLICY "Client members can view laudos_avulsos"
ON public.laudos_avulsos
FOR SELECT
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid())
  AND (
    public.get_user_client_role(auth.uid()) IN ('gerente'::public.client_role_type, 'supervisor'::public.client_role_type)
    OR created_by = auth.uid()
  )
);

-- INSERT: any client member can create, created_by must be self
CREATE POLICY "Client members can insert laudos_avulsos"
ON public.laudos_avulsos
FOR INSERT
TO authenticated
WITH CHECK (
  client_id = public.get_user_client_id(auth.uid())
  AND (created_by IS NULL OR created_by = auth.uid())
);

-- DELETE: gerente/supervisor can delete any of client; vendedor only own
CREATE POLICY "Client members can delete laudos_avulsos"
ON public.laudos_avulsos
FOR DELETE
TO authenticated
USING (
  client_id = public.get_user_client_id(auth.uid())
  AND (
    public.get_user_client_role(auth.uid()) IN ('gerente'::public.client_role_type, 'supervisor'::public.client_role_type)
    OR created_by = auth.uid()
  )
);
