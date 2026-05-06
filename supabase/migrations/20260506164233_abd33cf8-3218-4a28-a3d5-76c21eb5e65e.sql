
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS private.encryption_keys (
  name text PRIMARY KEY,
  key bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.encryption_keys FROM PUBLIC;

INSERT INTO private.encryption_keys (name, key)
VALUES ('integrations_v1', extensions.gen_random_bytes(32))
ON CONFLICT (name) DO NOTHING;

-- Block secret-looking keys in plaintext config
CREATE OR REPLACE FUNCTION public.integrations_config_no_secrets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  k text;
  forbidden text[] := ARRAY[
    'api_key','apikey','api-key',
    'secret','client_secret','signing_secret','webhook_secret',
    'token','access_token','refresh_token','bearer','authorization',
    'password','passwd','pwd','private_key'
  ];
BEGIN
  IF NEW.config IS NULL THEN RETURN NEW; END IF;
  FOR k IN SELECT jsonb_object_keys(NEW.config) LOOP
    IF lower(k) = ANY(forbidden) THEN
      RAISE EXCEPTION 'Field % is not allowed in integrations.config — store via set_integration_secret()', k
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.integrations_config_no_secrets() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_integrations_config_no_secrets ON public.integrations;
CREATE TRIGGER trg_integrations_config_no_secrets
BEFORE INSERT OR UPDATE OF config ON public.integrations
FOR EACH ROW EXECUTE FUNCTION public.integrations_config_no_secrets();

-- Encrypted secrets column
ALTER TABLE public.integrations ADD COLUMN IF NOT EXISTS secrets bytea;
REVOKE SELECT (secrets), INSERT (secrets), UPDATE (secrets) ON public.integrations FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_integration_secret(_integration_id uuid, _key text, _value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key bytea;
  cur jsonb;
  upd jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integrations WHERE id = _integration_id AND owner = auth.uid()) THEN
    RAISE EXCEPTION 'not_found_or_forbidden';
  END IF;
  SELECT key INTO enc_key FROM private.encryption_keys WHERE name = 'integrations_v1';
  SELECT CASE WHEN secrets IS NULL THEN '{}'::jsonb
              ELSE convert_from(extensions.pgp_sym_decrypt_bytea(secrets, encode(enc_key,'hex')),'utf8')::jsonb
         END
    INTO cur FROM public.integrations WHERE id = _integration_id;
  upd := cur || jsonb_build_object(_key, _value);
  UPDATE public.integrations
    SET secrets = extensions.pgp_sym_encrypt(upd::text, encode(enc_key,'hex'))::bytea,
        updated_at = now()
    WHERE id = _integration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_integration_secret(_integration_id uuid, _key text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  enc_key bytea;
  decrypted jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.integrations WHERE id = _integration_id AND owner = auth.uid()) THEN
    RAISE EXCEPTION 'not_found_or_forbidden';
  END IF;
  SELECT key INTO enc_key FROM private.encryption_keys WHERE name = 'integrations_v1';
  SELECT convert_from(extensions.pgp_sym_decrypt_bytea(secrets, encode(enc_key,'hex')),'utf8')::jsonb
    INTO decrypted FROM public.integrations WHERE id = _integration_id AND secrets IS NOT NULL;
  RETURN decrypted ->> _key;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_integration_secret(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_integration_secret(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_integration_secret(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_integration_secret(uuid, text) TO authenticated;
