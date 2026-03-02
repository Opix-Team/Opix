
-- Tighten the insert policy to require authentication
DROP POLICY "Anyone can insert invites" ON invites;
CREATE POLICY "Authenticated users can insert invites"
ON invites FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
