
-- API Keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  scopes text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own api keys" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api keys" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);

-- Authorizations table (apps authorized to use Opix)
CREATE TABLE public.authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_name text NOT NULL,
  app_url text,
  app_icon text,
  description text,
  client_id text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  client_secret_hash text,
  redirect_uri text,
  scopes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own authorizations" ON public.authorizations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own authorizations" ON public.authorizations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own authorizations" ON public.authorizations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own authorizations" ON public.authorizations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_authorizations_user_id ON public.authorizations(user_id);

-- Add function to generate API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  key text;
BEGIN
  key := 'opx_' || encode(gen_random_bytes(32), 'hex');
  RETURN key;
END;
$$;
