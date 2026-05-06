
-- Fix 1: Restrict realtime subscriptions to authenticated users on user-scoped topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive own-topic broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can receive own-topic broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);

DROP POLICY IF EXISTS "Authenticated users can send to own topics" ON realtime.messages;
CREATE POLICY "Authenticated users can send to own topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE ('user:' || auth.uid()::text || '%')
);

-- Fix 2: Revoke direct SELECT on client_secret_hash from clients (RLS owner can no longer read it)
REVOKE SELECT (client_secret_hash) ON public.authorizations FROM anon, authenticated;
