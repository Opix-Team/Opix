ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS authorization_id uuid;
CREATE INDEX IF NOT EXISTS idx_invites_authorization_id ON public.invites(authorization_id);
CREATE INDEX IF NOT EXISTS idx_invites_status ON public.invites(status);