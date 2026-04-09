
CREATE OR REPLACE FUNCTION public.nextval_proposal()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.laudo_proposal_seq');
$$;
