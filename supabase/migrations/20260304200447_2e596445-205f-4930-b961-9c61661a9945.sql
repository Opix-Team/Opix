
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  key text;
BEGIN
  key := 'opx_' || encode(gen_random_bytes(32), 'hex');
  RETURN key;
END;
$$;
