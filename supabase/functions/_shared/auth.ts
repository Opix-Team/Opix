import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { fail } from "./responses.ts";

export function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type ValidatedKey = {
  ok: true;
  user_id: string;
  scopes: string[];
  key_id: string;
};

export type ValidationResult = ValidatedKey | { ok: false; response: Response };

export async function validateApiKey(
  req: Request,
  requiredScope?: string,
): Promise<ValidationResult> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: fail("unauthorized", "Missing API key", 401) };
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey.startsWith("opx_")) {
    return { ok: false, response: fail("unauthorized", "Invalid API key format", 401) };
  }

  const keyHash = await sha256Hex(rawKey);
  const sb = adminClient();

  const { data: keyRecord, error } = await sb
    .from("api_keys")
    .select("id, user_id, scopes, is_active, expires_at")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !keyRecord) {
    return { ok: false, response: fail("forbidden", "Invalid or revoked API key", 403) };
  }

  if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
    return { ok: false, response: fail("forbidden", "API key expired", 403) };
  }

  if (requiredScope && !keyRecord.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: fail("forbidden", `Missing required scope: ${requiredScope}`, 403),
    };
  }

  // Fire-and-forget last_used_at update
  sb.from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id)
    .then(() => {});

  return {
    ok: true,
    user_id: keyRecord.user_id,
    scopes: keyRecord.scopes,
    key_id: keyRecord.id,
  };
}
