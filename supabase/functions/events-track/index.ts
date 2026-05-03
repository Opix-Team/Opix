import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";
import { sendAuthorizationCallback } from "../_shared/callback.ts";

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

  const { authorization_id, integration_id, event_type, payload, response, status_code } = body ?? {};
  if (!event_type || typeof event_type !== "string") {
    return fail("validation_error", "event_type is required", 400);
  }
  if (!authorization_id && !integration_id) {
    return fail(
      "validation_error",
      "authorization_id (the `id` returned from /authorizations-create) is required",
      400,
    );
  }

  const sb = adminClient();
  let resolvedIntegrationId: string | null = null;

  // Preferred path: caller passes the authorization id from step 3.
  if (authorization_id) {
    const { data: auth, error: authErr } = await sb
      .from("authorizations")
      .select("id, user_id, app_name")
      .eq("id", authorization_id)
      .maybeSingle();
    if (authErr) return fail("server_error", authErr.message, 500);
    if (!auth || auth.user_id !== v.user_id) {
      return fail("forbidden", "authorization_id not found or not owned by this API key", 403);
    }

    // Find or create a backing integration row for this authorization, owned by the same user.
    const { data: existing, error: findErr } = await sb
      .from("integrations")
      .select("id")
      .eq("owner", v.user_id)
      .eq("name", auth.app_name)
      .maybeSingle();
    if (findErr) return fail("server_error", findErr.message, 500);

    if (existing) {
      resolvedIntegrationId = existing.id;
    } else {
      const { data: created, error: createErr } = await sb
        .from("integrations")
        .insert({
          owner: v.user_id,
          name: auth.app_name,
          type: "api",
          config: { authorization_id: auth.id },
        })
        .select("id")
        .single();
      if (createErr) return fail("server_error", createErr.message, 500);
      resolvedIntegrationId = created.id;
    }
  } else {
    // Back-compat: caller passes integration_id directly.
    const { data: integration, error: intErr } = await sb
      .from("integrations")
      .select("id, owner")
      .eq("id", integration_id)
      .maybeSingle();
    if (intErr) return fail("server_error", intErr.message, 500);
    if (!integration || integration.owner !== v.user_id) {
      return fail("forbidden", "integration_id not found or not owned by this API key", 403);
    }
    resolvedIntegrationId = integration.id;
  }

  const { data, error } = await sb
    .from("integration_logs")
    .insert({
      integration_id: resolvedIntegrationId,
      event_type,
      payload: payload ?? {},
      response: response ?? {},
      status_code: status_code ?? null,
    })
    .select()
    .single();

  if (error) return fail("server_error", error.message, 500);

  const callback = authorization_id
    ? await sendAuthorizationCallback({
        authorization_id,
        event: event_type,
        data: { event_type, payload: payload ?? {}, status_code: status_code ?? null, log_id: data.id },
      })
    : { attempted: false, ok: false };

  return ok({ ...data, callback }, 201);
});
