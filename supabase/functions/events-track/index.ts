import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST", 405);

  const v = await validateApiKey(req, "events");
  if (!v.ok) return v.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("validation_error", "Invalid JSON body", 400);
  }

  const { integration_id, event_type, payload, response, status_code } = body ?? {};
  if (!integration_id || typeof integration_id !== "string") {
    return fail("validation_error", "integration_id is required", 400);
  }
  if (!event_type || typeof event_type !== "string") {
    return fail("validation_error", "event_type is required", 400);
  }

  const sb = adminClient();

  // Verify the integration belongs to the API key's user
  const { data: integration, error: intErr } = await sb
    .from("integrations")
    .select("id, owner")
    .eq("id", integration_id)
    .maybeSingle();
  if (intErr) return fail("server_error", intErr.message, 500);
  if (!integration || integration.owner !== v.user_id) {
    return fail("forbidden", "Integration not found or not owned by key", 403);
  }

  const { data, error } = await sb
    .from("integration_logs")
    .insert({
      integration_id,
      event_type,
      payload: payload ?? {},
      response: response ?? {},
      status_code: status_code ?? null,
    })
    .select()
    .single();

  if (error) return fail("server_error", error.message, 500);
  return ok(data, 201);
});
