CREATE TABLE public.passkeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint NOT NULL DEFAULT 0,
  transports text[] NOT NULL DEFAULT '{}'::text[],
  device_label text NOT NULL DEFAULT 'Device',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

GRANT SELECT, DELETE ON public.passkeys TO authenticated;
GRANT ALL ON public.passkeys TO service_role;

ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own passkeys" ON public.passkeys
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own passkeys" ON public.passkeys
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_passkeys_user ON public.passkeys(user_id);

CREATE TABLE public.passkey_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.passkey_backup_codes TO authenticated;
GRANT ALL ON public.passkey_backup_codes TO service_role;

ALTER TABLE public.passkey_backup_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backup codes" ON public.passkey_backup_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_backup_codes_user ON public.passkey_backup_codes(user_id);

CREATE TABLE public.passkey_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge text NOT NULL,
  type text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.passkey_challenges TO service_role;

ALTER TABLE public.passkey_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_passkey_challenges_user ON public.passkey_challenges(user_id);