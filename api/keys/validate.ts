import { supabase } from "@/integrations/supabase/client";

export async function POST(req: Request) {
  const { authorization } = Object.fromEntries(req.headers);

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing API key" }), { status: 401 });
  }

  const rawKey = authorization.replace("Bearer ", "");

  // Hash the key the same way you hashed it when storing
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0")).join("");

  // Look up the key in Supabase
  const { data: keyRecord } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (!keyRecord) {
    return new Response(JSON.stringify({ error: "Invalid or revoked API key" }), { status: 403 });
  }

  return new Response(JSON.stringify({
    valid: true,
    scopes: keyRecord.scopes,
    user_id: keyRecord.user_id
  }));
}
