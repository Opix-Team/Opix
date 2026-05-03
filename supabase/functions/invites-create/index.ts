import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";
import { sendAuthorizationCallback } from "../_shared/callback.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST", 405);

  const v = await validateApiKey(req, "invites");
  if (!v.ok) return v.response;

  let body: any;
  try { body = await req.json(); } catch { return fail("validation_error", "Invalid JSON body", 400); }

  const { authorization_id, type, source, metadata, expires_at } = body ?? {};
  if (!authorization_id || typeof authorization_id !== "string") {
    return fail("validation_error", "authorization_id is required", 400);
  }

  const sb = adminClient();
  const { data: auth, error: authErr } = await sb
    .from("authorizations")
    .select("id, user_id")
    .eq("id", authorization_id)
    .maybeSingle();
  if (authErr) return fail("server_error", authErr.message, 500);
  if (!auth || auth.user_id !== v.user_id) {
    return fail("forbidden", "authorization_id not found or not owned by this API key", 403);
  }

  const { data, error } = await sb.from("invites").insert({
    created_by: v.user_id,
    authorization_id: auth.id,
    type: type ?? "referral",
    source: source ?? null,
    metadata: metadata ?? {},
    expires_at: expires_at ?? null,
  }).select().single();

  if (error) return fail("server_error", error.message, 500);

  const callback = await sendAuthorizationCallback({
    authorization_id: auth.id,
    event: "invite.created",
    data,
  });

  return ok({ ...data, callback }, 201);
});
