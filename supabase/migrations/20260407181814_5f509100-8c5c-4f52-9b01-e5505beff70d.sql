
CREATE OR REPLACE FUNCTION public.ensure_client_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'cliente' THEN
    INSERT INTO public.clients (name, email, user_id, active)
    VALUES (NEW.full_name, NEW.email, NEW.user_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_ensure_client
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.ensure_client_record();
