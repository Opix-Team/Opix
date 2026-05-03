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

  const { invite_id, redeemed_by } = body ?? {};
  if (!invite_id) return fail("validation_error", "invite_id is required", 400);

  const sb = adminClient();
  const { data: invite, error: getErr } = await sb.from("invites")
    .select("*").eq("id", invite_id).maybeSingle();
  if (getErr) return fail("server_error", getErr.message, 500);
  if (!invite || invite.created_by !== v.user_id) {
    return fail("forbidden", "invite not found or not owned by this API key", 403);
  }
  if (invite.status === "used") return fail("validation_error", "invite already used", 400);
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return fail("validation_error", "invite expired", 400);
  }

  const { data, error } = await sb.from("invites")
    .update({
      status: "used",
      used_at: new Date().toISOString(),
      metadata: { ...(invite.metadata ?? {}), redeemed_by: redeemed_by ?? null },
    })
    .eq("id", invite_id)
    .select().single();
  if (error) return fail("server_error", error.message, 500);

  const callback = invite.authorization_id
    ? await sendAuthorizationCallback({
        authorization_id: invite.authorization_id,
        event: "invite.redeemed",
        data,
      })
    : { attempted: false, ok: false };

  return ok({ ...data, callback });
});
