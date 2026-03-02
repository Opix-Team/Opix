
-- Base tables

CREATE TABLE public.invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'referral',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.invite_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invite_id UUID REFERENCES public.invites(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'webhook',
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  response JSONB DEFAULT '{}'::jsonb,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invites_type ON invites(type);
CREATE INDEX idx_invites_status ON invites(status);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);
CREATE INDEX idx_invite_events_invite_id ON invite_events(invite_id);
CREATE INDEX idx_integrations_owner ON integrations(owner);

-- Enable RLS
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Invites: owner can select
CREATE POLICY "Users can view their own invites"
ON invites FOR SELECT
USING (auth.uid() = created_by);

-- Anyone can insert invites (API layer secures)
CREATE POLICY "Anyone can insert invites"
ON invites FOR INSERT
WITH CHECK (true);

-- Invite owner can update
CREATE POLICY "Invite owner can update"
ON invites FOR UPDATE
USING (auth.uid() = created_by);

-- Invite owner can delete
CREATE POLICY "Invite owner can delete"
ON invites FOR DELETE
USING (auth.uid() = created_by);

-- Invite events: public read
CREATE POLICY "Public read invite events"
ON invite_events FOR SELECT
USING (true);

-- Invite events: insert for authenticated
CREATE POLICY "Authenticated can insert invite events"
ON invite_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Integrations: owner access
CREATE POLICY "Users can view their own integrations"
ON integrations FOR SELECT
USING (auth.uid() = owner);

CREATE POLICY "Users can create their own integrations"
ON integrations FOR INSERT
WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own integrations"
ON integrations FOR UPDATE
USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own integrations"
ON integrations FOR DELETE
USING (auth.uid() = owner);

-- Integration logs: owner access via join
CREATE POLICY "Users can view their integration logs"
ON integration_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM integrations
    WHERE integrations.id = integration_logs.integration_id
    AND integrations.owner = auth.uid()
  )
);

-- Profiles
CREATE POLICY "Profiles are viewable by everyone"
ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE invites;
ALTER PUBLICATION supabase_realtime ADD TABLE invite_events;

-- Functions and Triggers

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_invite_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO invite_events (invite_id, event_type, event_data)
  VALUES (NEW.id, 'created', jsonb_build_object(
    'type', NEW.type,
    'status', NEW.status,
    'source', NEW.source,
    'created_at', NEW.created_at
  ));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.log_invite_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO invite_events (invite_id, event_type, event_data)
    VALUES (NEW.id, NEW.status, jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'used_at', NEW.used_at,
      'expires_at', NEW.expires_at
    ));
  ELSE
    INSERT INTO invite_events (invite_id, event_type, event_data)
    VALUES (NEW.id, 'updated', jsonb_build_object(
      'old_row', row_to_json(OLD),
      'new_row', row_to_json(NEW)
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Invite triggers
CREATE TRIGGER trg_invite_created
  AFTER INSERT ON invites
  FOR EACH ROW EXECUTE FUNCTION log_invite_created();

CREATE TRIGGER trg_invite_status_change
  AFTER UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION log_invite_status_change();

-- Updated_at triggers
CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
