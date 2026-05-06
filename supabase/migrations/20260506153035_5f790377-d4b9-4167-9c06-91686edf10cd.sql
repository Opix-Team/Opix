
-- Fix profiles SELECT policy: restrict to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Fix invites: remove "Anyone can insert invites"
DROP POLICY IF EXISTS "Anyone can insert invites" ON public.invites;

-- Fix invite_events: scope to invite owner
DROP POLICY IF EXISTS "Public read invite events" ON public.invite_events;
DROP POLICY IF EXISTS "Authenticated can insert invite events" ON public.invite_events;

CREATE POLICY "Owners can view invite events"
ON public.invite_events FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.invites i
  WHERE i.id = invite_events.invite_id AND i.created_by = auth.uid()
));

CREATE POLICY "Owners can insert invite events"
ON public.invite_events FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.invites i
  WHERE i.id = invite_events.invite_id AND i.created_by = auth.uid()
));

-- Fix function search_path on trigger functions
CREATE OR REPLACE FUNCTION public.log_invite_created()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  insert into invite_events (invite_id, event_type, event_data)
  values (new.id, 'created', jsonb_build_object(
    'type', new.type,
    'status', new.status,
    'source', new.source,
    'created_at', new.created_at
  ));
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.log_invite_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  if new.status is distinct from old.status then
    insert into invite_events (invite_id, event_type, event_data)
    values (new.id, new.status, jsonb_build_object(
      'old_status', old.status,
      'new_status', new.status,
      'used_at', new.used_at,
      'expires_at', new.expires_at
    ));
  else
    insert into invite_events (invite_id, event_type, event_data)
    values (new.id, 'updated', jsonb_build_object(
      'old_row', row_to_json(old),
      'new_row', row_to_json(new)
    ));
  end if;
  return new;
end;
$function$;
