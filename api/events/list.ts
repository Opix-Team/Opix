import { supabase } from "@/integrations/supabase/client";

// --- Helper: validate API key + scopes ---
async function validateKey(req: Request, requiredScope: string) {
  const auth = req.headers.get("authorization");

  if (!auth || !auth.startsWith("Bearer ")) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401 }
      )
    };
  }

  const rawKey = auth.replace("Bearer ", "");

  // Hash key the same way you hashed it when storing
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const keyHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  // Look up key in Supabase
  const { data: keyRecord, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .single();

  if (error || !keyRecord) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({ error: "Invalid or revoked API key" }),
        { status: 403 }
      )
    };
  }

  // Check scope
  if (!keyRecord.scopes.includes(requiredScope)) {
    return {
      valid: false,
      response: new Response(
        JSON.stringify({ error: "Missing required scope: " + requiredScope }),
        { status: 403 }
      )
    };
  }

  return { valid: true, user_id: keyRecord.user_id };
}

// --- MAIN HANDLER ---
export async function GET(req: Request) {
  // Validate API key + scope
  const validation = await validateKey(req, "events");
  if (!validation.valid) return validation.response;

  // Fetch events for this user
  const { data, error } = await supabase
    .from("invite_events")
    .select("*")
    .eq("user_id", validation.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }

  return new Response(
    JSON.stringify(data),
    { headers: { "Content-Type": "application/json" } }
  );
}
